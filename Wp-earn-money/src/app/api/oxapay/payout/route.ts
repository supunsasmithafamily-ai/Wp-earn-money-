import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';

/**
 * OxaPay Payout / Withdrawal API Route
 *
 * Handles withdrawal requests from users, sending cryptocurrency payments to
 * their external wallets through OxaPay, backed by an atomic Firestore
 * balance deduction.
 *
 * Requires:
 *   OXA_PAY_API_KEY   (server-only secret)
 *   OXA_PAY_BASE_URL  (default: https://api.oxapay.com)
 */

const MIN_WITHDRAWAL = 1000;
const MAX_WITHDRAWAL = 500000;
const COIN_TO_USD_RATE = 0.005; // 1 coin = $0.005

const NETWORKS: Record<string, { name: string; currency: string; fee: number }> = {
  trc20: { name: 'TRC20', currency: 'USDT', fee: 1 },
  erc20: { name: 'ERC20', currency: 'USDT', fee: 5 },
  bep20: { name: 'BEP20', currency: 'USDT', fee: 0.5 },
};

// In-memory per-user rate limiting (best-effort — resets on server restart /
// doesn't share state across serverless instances; use Redis for real scale).
const withdrawalAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW = 3600000; // 1 hour

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, walletAddress, network } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ success: false, error: 'Valid userId is required' }, { status: 400 });
    }
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Valid positive amount is required' }, { status: 400 });
    }
    if (!walletAddress || typeof walletAddress !== 'string' || walletAddress.trim().length < 10) {
      return NextResponse.json({ success: false, error: 'Valid wallet address is required' }, { status: 400 });
    }
    if (!network || !NETWORKS[network]) {
      return NextResponse.json(
        { success: false, error: `Invalid network. Must be one of: ${Object.keys(NETWORKS).join(', ')}` },
        { status: 400 },
      );
    }
    if (amount < MIN_WITHDRAWAL) {
      return NextResponse.json({ success: false, error: `Minimum withdrawal is ${MIN_WITHDRAWAL.toLocaleString()} coins` }, { status: 400 });
    }
    if (amount > MAX_WITHDRAWAL) {
      return NextResponse.json({ success: false, error: `Maximum withdrawal is ${MAX_WITHDRAWAL.toLocaleString()} coins per transaction` }, { status: 400 });
    }

    const now = Date.now();
    const userAttempts = withdrawalAttempts.get(userId);
    if (userAttempts && userAttempts.resetAt > now && userAttempts.count >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        { success: false, error: `Maximum ${RATE_LIMIT_MAX} withdrawals per hour. Please try again later.` },
        { status: 429 },
      );
    }

    const networkInfo = NETWORKS[network];
    const usdAmount = amount * COIN_TO_USD_RATE;
    const networkFee = networkInfo.fee;
    const finalPayoutAmount = Math.max(0, usdAmount - networkFee);

    if (finalPayoutAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Amount too small after network fees' }, { status: 400 });
    }

    const OXA_PAY_API_KEY = process.env.OXA_PAY_API_KEY;
    const OXA_PAY_BASE_URL = process.env.OXA_PAY_BASE_URL || 'https://api.oxapay.com';

    if (!OXA_PAY_API_KEY) {
      return NextResponse.json({ success: false, error: 'Payout service is not configured (missing OXA_PAY_API_KEY)' }, { status: 500 });
    }

    const db = getAdminDb();

    // ── Step 1: atomically check + deduct the coin balance first ──
    const payoutId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    let balanceAfter: number;

    try {
      balanceAfter = await db.runTransaction(async (transaction) => {
        const userRef = db.collection('users').doc(userId);
        const userSnap = await transaction.get(userRef);

        if (!userSnap.exists) throw new Error('USER_NOT_FOUND');

        const currentBalance = userSnap.data()?.coinBalance ?? 0;
        const currentSpent = userSnap.data()?.totalSpent ?? 0;
        if (currentBalance < amount) throw new Error('INSUFFICIENT_BALANCE');

        const newBalance = currentBalance - amount;
        transaction.update(userRef, {
          coinBalance: newBalance,
          totalSpent: currentSpent + amount,
        });

        const txRef = db.collection('coinTransactions').doc();
        transaction.set(txRef, {
          userId,
          type: 'withdrawal',
          amount: -amount,
          balanceAfter: newBalance,
          description: `Withdrawal to ${walletAddress.slice(0, 8)}... (${networkInfo.name})`,
          referenceId: payoutId,
          network,
          usdValue: usdAmount,
          networkFee,
          status: 'processing',
          createdAt: FieldValue.serverTimestamp(),
        });

        return newBalance;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'INSUFFICIENT_BALANCE') {
        return NextResponse.json({ success: false, error: 'Insufficient coin balance' }, { status: 400 });
      }
      if (msg === 'USER_NOT_FOUND') {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }
      throw err;
    }

    // Track this attempt for rate limiting only after the balance check passes.
    if (!userAttempts || userAttempts.resetAt <= now) {
      withdrawalAttempts.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    } else {
      userAttempts.count++;
    }

    // ── Step 2: call OxaPay to actually send the payout ──
    const payoutResponse = await fetch(`${OXA_PAY_BASE_URL}/v1/payout`, {
      method: 'POST',
      headers: {
        'payout_api_key': OXA_PAY_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: walletAddress.trim(),
        network: networkInfo.name,
        amount: finalPayoutAmount,
        currency: networkInfo.currency,
        callbackUrl: process.env.OXA_PAY_PAYOUT_CALLBACK_URL || undefined,
        description: `Withdrawal for user ${userId}: ${amount} coins`,
      }),
    });

    const payoutData = await payoutResponse.json();

    if (!payoutResponse.ok || (payoutData.status && payoutData.status !== 200 && !payoutData.data)) {
      console.error('[OxaPay Payout] OxaPay API error, refunding coins:', payoutData);

      // The coin deduction already happened — refund it since the actual
      // crypto payout failed, so we never lose the user's coins.
      await db.runTransaction(async (transaction) => {
        const userRef = db.collection('users').doc(userId);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists) return;
        const currentBalance = userSnap.data()?.coinBalance ?? 0;
        transaction.update(userRef, { coinBalance: currentBalance + amount });

        const txRef = db.collection('coinTransactions').doc();
        transaction.set(txRef, {
          userId,
          type: 'withdrawal_refund',
          amount,
          balanceAfter: currentBalance + amount,
          referenceId: payoutId,
          description: 'Withdrawal failed — coins refunded',
          createdAt: FieldValue.serverTimestamp(),
        });
      });

      return NextResponse.json({ success: false, error: payoutData.message || 'Payout request failed' }, { status: 502 });
    }

    const trackId = payoutData.data?.trackId || payoutData.trackId || payoutId;

    return NextResponse.json({
      success: true,
      payoutId: trackId,
      status: 'processing',
      amount: usdAmount,
      coins: amount,
      balanceAfter,
      networkFee,
      finalAmount: finalPayoutAmount,
      network: networkInfo.name,
      currency: networkInfo.currency,
      estimatedArrival: '10-30 minutes',
    });
  } catch (error) {
    console.error('[OxaPay Payout] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
