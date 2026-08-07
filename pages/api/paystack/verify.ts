// pages/api/paystack/verify.ts

import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseServer } from '@/lib/supabase/server'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('🚀 API CALLED - Method:', req.method)

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    })
  }

  try {
    const { reference, transactionId } = req.body

    console.log('🔍 Verifying payment:', {
      reference,
      transactionId,
    })

    if (!reference || !transactionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      })
    }

    // =========================================================
    // STEP 1: VERIFY PAYMENT WITH PAYSTACK
    // =========================================================

    console.log('📡 Verifying with Paystack...')

    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const paystackData = await paystackResponse.json()

    console.log('📦 Paystack response:', {
      status: paystackData.status,
      dataStatus: paystackData.data?.status,
      amount: paystackData.data?.amount,
      customerEmail: paystackData.data?.customer?.email,
      reference: paystackData.data?.reference,
    })

    // Make sure Paystack itself confirmed the transaction
    if (
      !paystackData.status ||
      paystackData.data?.status !== 'success'
    ) {
      console.error('❌ Paystack verification failed')

      await supabaseServer
        .from('transactions')
        .update({
          status: 'failed',
          description: `Payment failed - ${reference}`,
        })
        .eq('id', transactionId)

      return res.status(400).json({
        success: false,
        error: 'Payment verification failed with Paystack',
      })
    }

    // =========================================================
    // STEP 2: FIND TRANSACTION
    // =========================================================

    console.log(
      '🔍 Looking for transaction in DB:',
      transactionId
    )

    const {
      data: transaction,
      error: txError,
    } = await supabaseServer
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    console.log('📊 Transaction query result:', {
      found: !!transaction,
      error: txError,
      transactionId,
    })

    // =========================================================
    // STEP 3: FALLBACK TRANSACTION LOOKUP
    // =========================================================

    if (txError || !transaction) {
      console.error('❌ Transaction not found:', {
        transactionId,
        txError,
      })

      const customerEmail =
        paystackData.data?.customer?.email

      if (customerEmail) {
        console.log(
          '🔍 Looking for user by email:',
          customerEmail
        )

        const {
          data: user,
          error: userError,
        } = await supabaseServer
          .from('users')
          .select('id')
          .eq('email', customerEmail)
          .single()

        if (!userError && user) {
          console.log('✅ Found user:', user.id)

          const {
            data: pendingTransaction,
            error: pendingError,
          } = await supabaseServer
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'pending')
            .order('created_at', {
              ascending: false,
            })
            .limit(1)
            .single()

          if (!pendingError && pendingTransaction) {
            console.log(
              '✅ Found pending transaction:',
              pendingTransaction.id
            )

            // Make sure the transaction hasn't already
            // been completed.
            if (pendingTransaction.status === 'completed') {
              console.log(
                '⚠️ Transaction already completed'
              )

              return res.status(200).json({
                success: true,
                message:
                  'Payment already verified',
              })
            }

            const {
              error: updateError,
            } = await supabaseServer
              .from('transactions')
              .update({
                status: 'completed',
                description: `Wallet funding via Paystack (${reference})`,
              })
              .eq('id', pendingTransaction.id)
              .eq('status', 'pending')

            if (updateError) {
              console.error(
                '❌ Failed to update transaction:',
                updateError
              )

              return res.status(500).json({
                success: false,
                error:
                  'Failed to update transaction',
              })
            }

            await updateWallet(
              pendingTransaction.user_id,
              pendingTransaction.amount
            )

            console.log(
              '✅ Payment verified and wallet updated!'
            )

            return res.status(200).json({
              success: true,
              message:
                'Payment verified and wallet updated',
            })
          }
        }
      }

      return res.status(404).json({
        success: false,
        error: `Transaction not found: ${transactionId}`,
      })
    }

    // =========================================================
    // STEP 4: PROTECT AGAINST DUPLICATE CREDIT
    // =========================================================

    console.log('💰 Transaction found:', {
      id: transaction.id,
      userId: transaction.user_id,
      amount: transaction.amount,
      currentStatus: transaction.status,
    })

    if (transaction.status === 'completed') {
      console.log(
        '⚠️ Transaction already completed. Wallet will NOT be credited again.'
      )

      return res.status(200).json({
        success: true,
        message: 'Payment already verified',
      })
    }

    // =========================================================
    // STEP 5: MARK TRANSACTION COMPLETED
    // =========================================================

    const {
      error: updateError,
    } = await supabaseServer
      .from('transactions')
      .update({
        status: 'completed',
        description: `Wallet funding via Paystack (${reference})`,
      })
      .eq('id', transaction.id)
      .eq('status', 'pending')

    if (updateError) {
      console.error(
        '❌ Error updating transaction:',
        updateError
      )

      return res.status(500).json({
        success: false,
        error: 'Failed to update transaction',
      })
    }

    // =========================================================
    // STEP 6: UPDATE WALLET
    // =========================================================

    await updateWallet(
      transaction.user_id,
      transaction.amount
    )

    console.log(
      '✅ Payment verified and wallet updated!'
    )

    return res.status(200).json({
      success: true,
      message:
        'Payment verified and wallet updated',
    })
  } catch (error) {
    console.error('❌ Error:', error)

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

// =============================================================
// UPDATE WALLET
// =============================================================

async function updateWallet(
  userId: string,
  amount: number
) {
  console.log(
    '💰 Updating wallet for user:',
    userId
  )

  const {
    data: wallet,
    error: walletError,
  } = await supabaseServer
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (
    walletError &&
    walletError.code !== 'PGRST116'
  ) {
    console.error(
      '❌ Error fetching wallet:',
      walletError
    )

    return
  }

  // =========================================================
  // EXISTING WALLET
  // =========================================================

  if (wallet) {
    const newBalance =
      (wallet.balance || 0) + amount

    const newTotalEarnings =
      (wallet.total_earnings || 0) + amount

    const {
      error: updateError,
    } = await supabaseServer
      .from('wallets')
      .update({
        balance: newBalance,
        total_earnings: newTotalEarnings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wallet.id)

    if (updateError) {
      console.error(
        '❌ Error updating wallet:',
        updateError
      )
    } else {
      console.log(
        `✅ Wallet updated: New balance ${newBalance}`
      )
    }

    return
  }

  // =========================================================
  // CREATE NEW WALLET
  // =========================================================

  const {
    error: createError,
  } = await supabaseServer
    .from('wallets')
    .insert({
      user_id: userId,
      balance: amount,
      total_earnings: amount,
      total_withdrawn: 0,
    })

  if (createError) {
    console.error(
      '❌ Error creating wallet:',
      createError
    )
  } else {
    console.log(
      `✅ Wallet created with balance ${amount}`
    )
  }
}