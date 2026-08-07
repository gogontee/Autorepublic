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
      error: 'Method not allowed' 
    })
  }

  try {
    const { reference, transactionId } = req.body

    console.log('🔍 Verifying payment:', { reference, transactionId })

    if (!reference || !transactionId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      })
    }

    // STEP 1: Verify with Paystack FIRST
    console.log('📡 Verifying with Paystack...')
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    )

    const paystackData = await paystackResponse.json()
    console.log('📦 Paystack response:', {
      status: paystackData.status,
      dataStatus: paystackData.data?.status,
      amount: paystackData.data?.amount,
      customerEmail: paystackData.data?.customer?.email
    })

    // Check if Paystack verification was successful
    if (!paystackData.status || paystackData.data?.status !== 'success') {
      console.error('❌ Paystack verification failed')
      
      // Update transaction to failed
      await supabaseServer
        .from('transactions')
        .update({ 
          status: 'failed',
          description: `Payment failed - ${reference}`
        })
        .eq('id', transactionId)

      return res.status(400).json({
        success: false,
        error: 'Payment verification failed with Paystack'
      })
    }

    // STEP 2: Find the transaction in the database using the server client
    console.log('🔍 Looking for transaction in DB:', transactionId)
    
    const { data: transaction, error: txError } = await supabaseServer
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    console.log('📊 Transaction query result:', { 
      found: !!transaction, 
      error: txError,
      transactionId 
    })

    if (txError || !transaction) {
      console.error('❌ Transaction not found in DB:', { transactionId, txError })
      
      // Try to find by matching the email from Paystack
      const customerEmail = paystackData.data?.customer?.email
      if (customerEmail) {
        console.log('🔍 Looking for user by email:', customerEmail)
        
        const { data: user, error: userError } = await supabaseServer
          .from('users')
          .select('id')
          .eq('email', customerEmail)
          .single()
        
        if (!userError && user) {
          console.log('✅ Found user:', user.id)
          
          // Find the most recent pending transaction for this user
          const { data: tx, error: txError } = await supabaseServer
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
          
          if (!txError && tx) {
            console.log('✅ Found transaction by user email:', tx.id)
            
            // Update this transaction instead
            const { error: updateError } = await supabaseServer
              .from('transactions')
              .update({ 
                status: 'completed',
                description: `Wallet funding via Paystack (${reference})`
              })
              .eq('id', tx.id)

            if (!updateError) {
              // Update wallet
              await updateWallet(tx.user_id, tx.amount)
              
              return res.status(200).json({ 
                success: true,
                message: 'Payment verified and wallet updated'
              })
            }
          }
        }
      }
      
      return res.status(404).json({
        success: false,
        error: `Transaction not found: ${transactionId}`
      })
    }

    console.log('💰 Transaction found:', { 
      id: transaction.id,
      userId: transaction.user_id, 
      amount: transaction.amount,
      currentStatus: transaction.status 
    })

    // STEP 3: Update transaction to completed
    const { error: updateError } = await supabaseServer
      .from('transactions')
      .update({ 
        status: 'completed',
        description: `Wallet funding via Paystack (${reference})`
      })
      .eq('id', transaction.id)

    if (updateError) {
      console.error('Error updating transaction:', updateError)
      return res.status(500).json({
        success: false,
        error: 'Failed to update transaction'
      })
    }

    // STEP 4: Update wallet balance
    await updateWallet(transaction.user_id, transaction.amount)

    console.log('✅ Payment verified and wallet updated!')

    return res.status(200).json({ 
      success: true,
      message: 'Payment verified and wallet updated'
    })
  } catch (error) {
    console.error('❌ Error:', error)
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
}

async function updateWallet(userId: string, amount: number) {
  console.log('💰 Updating wallet for user:', userId)
  
  const { data: wallet, error: walletError } = await supabaseServer
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (walletError && walletError.code !== 'PGRST116') {
    console.error('Error fetching wallet:', walletError)
    return
  }

  if (wallet) {
    const newBalance = (wallet.balance || 0) + amount
    const newTotalEarnings = (wallet.total_earnings || 0) + amount
    
    const { error: updateError } = await supabaseServer
      .from('wallets')
      .update({
        balance: newBalance,
        total_earnings: newTotalEarnings,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id)
    
    if (updateError) {
      console.error('Error updating wallet:', updateError)
    } else {
      console.log(`✅ Wallet updated: New balance ${newBalance}`)
    }
  } else {
    const { error: createError } = await supabaseServer
      .from('wallets')
      .insert({
        user_id: userId,
        balance: amount,
        total_earnings: amount,
        total_withdrawn: 0
      })
    
    if (createError) {
      console.error('Error creating wallet:', createError)
    } else {
      console.log(`✅ Wallet created with balance ${amount}`)
    }
  }
}