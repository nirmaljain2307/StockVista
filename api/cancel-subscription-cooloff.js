// StockVista — /api/cancel-subscription-cooloff.js
// Lets a user undo a just-completed subscription purchase within a short cooling-off
// window (10 minutes). Issues a real Razorpay refund and reverts the plan server-side.
// Never trust the client's claim about timing — always re-check against the
// transaction's created_at timestamp stored in Supabase.

import { createClient } from '@supabase/supabase-js';

const COOLOFF_MINUTES = 10;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, razorpay_payment_id } = req.body || {};
    if (!userId || !razorpay_payment_id) {
      return res.status(400).json({ error: 'userId and razorpay_payment_id are required' });
    }

    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: txn, error: txnErr } = await supabaseAdmin
      .from('subscription_transactions')
      .select('*')
      .eq('razorpay_payment_id', razorpay_payment_id)
      .eq('user_id', userId)
      .single();

    if (txnErr || !txn) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    if (txn.refunded) {
      return res.status(400).json({ error: 'This transaction has already been refunded' });
    }

    const createdAt = new Date(txn.created_at);
    const minutesElapsed = (Date.now() - createdAt.getTime()) / 60000;
    if (minutesElapsed > COOLOFF_MINUTES) {
      return res.status(400).json({ error: `Cooling-off window (${COOLOFF_MINUTES} minutes) has expired for this purchase` });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_SECRET;
    if (!keyId || !keySecret) {
      return res.status(500).json({ error: 'Razorpay keys not configured on server' });
    }

    // 1. Issue the refund via Razorpay
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const refundRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({ speed: 'optimum', notes: { reason: 'cooling_off_cancellation' } }),
    });
    const refund = await refundRes.json();
    if (!refundRes.ok) {
      return res.status(500).json({ error: refund?.error?.description || 'Refund failed at payment gateway' });
    }

    // 2. Revert the user's plan to what it was before this purchase
    const now = new Date();
    const { error: revertErr } = await supabaseAdmin
      .from('users')
      .update({
        plan_id: txn.previous_plan_id,
        plan_expires_at: txn.previous_plan_expires_at,
        updated_at: now.toISOString(),
      })
      .eq('id', userId);

    if (revertErr) {
      return res.status(500).json({ error: 'Refund issued but plan revert failed — contact support: ' + revertErr.message });
    }

    // 3. Mark the transaction refunded + audit log
    await supabaseAdmin.from('subscription_transactions').update({
      refunded: true,
      refunded_at: now.toISOString(),
    }).eq('id', txn.id);

    await supabaseAdmin.from('audit_log').insert([{
      action: 'SUBSCRIPTION_COOLOFF_REFUND',
      entity_type: 'user',
      entity_id: userId,
      details: JSON.stringify({ razorpay_payment_id, refund_id: refund.id }),
      performed_by: userId,
      created_at: now.toISOString(),
    }]);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('cancel-subscription-cooloff error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
