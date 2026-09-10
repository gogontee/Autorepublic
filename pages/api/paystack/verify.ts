// pages/api/paystack/verify.ts

import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseServer } from '@/lib/supabase/server'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    })
  }

  try {
    const { reference, transactionId } = req.body

    if (
      typeof reference !== 'string' ||
      typeof transactionId !== 'string' ||
      !reference.trim() ||
      !transactionId.trim()
    ) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      })
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY is not configured')
      return res.status(500).json({
        success: false,
        error: 'Payment service is not configured',
      })
    }

    // =========================================================
    // STEP 1: LOAD THE EXACT PENDING TRANSACTION
    // =========================================================

    const { data: transaction, error: txError } = await supabaseServer
      .from('transactions')
      .select('id, user_id, amount, status, type')
      .eq('id', transactionId)
      .maybeSingle()

    if (txError) {
      console.error('Error loading payment transaction:', txError)
      return res.status(500).json({
        success: false,
        error: 'Unable to load payment transaction',
      })
    }

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Payment transaction not found',
      })
    }

    if (transaction.status === 'completed') {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified',
      })
    }

    if (transaction.status !== 'pending' || transaction.type !== 'credit') {
      return res.status(400).json({
        success: false,
        error: 'Transaction is not eligible for payment verification',
      })
    }

    const { data: authUser, error: userError } =
      await supabaseServer.auth.admin.getUserById(transaction.user_id)
    const ownerEmail = authUser.user?.email

    if (userError || !ownerEmail) {
      console.error('Unable to load payment owner from Auth:', {
        code: userError?.code,
        message: userError?.message,
      })
      return res.status(500).json({
        success: false,
        error: 'Unable to validate payment owner',
      })
    }

    // =========================================================
    // STEP 2: VERIFY PAYMENT WITH PAYSTACK
    // =========================================================

    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const paystackData = await paystackResponse.json()

    const paystackTransaction = paystackData.data
    const expectedAmountInKobo = Math.round(Number(transaction.amount) * 100)
    const paymentMatches =
      paystackData.status === true &&
      paystackTransaction?.status === 'success' &&
      paystackTransaction.reference === reference &&
      paystackTransaction.amount === expectedAmountInKobo &&
      paystackTransaction.currency === 'NGN' &&
      typeof paystackTransaction.customer?.email === 'string' &&
      paystackTransaction.customer.email.toLowerCase() === ownerEmail.toLowerCase()

    if (!paymentMatches) {
      return res.status(400).json({
        success: false,
        error: 'Payment details could not be validated',
      })
    }

    // =========================================================
    // STEP 3: COMPLETE ONLY THIS PENDING TRANSACTION
    // =========================================================

    const { data: credited, error: creditError } = await supabaseServer.rpc(
      'complete_wallet_funding',
      {
        p_transaction_id: transaction.id,
        p_description: `Wallet funding via Paystack (${reference})`,
      }
    )

    if (creditError) {
      console.error('Error completing wallet funding:', creditError)

      return res.status(500).json({
        success: false,
        error: 'Failed to complete wallet funding',
      })
    }

    if (!credited) {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified',
      })
    }

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

