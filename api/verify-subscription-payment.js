// StockVista — /api/verify-subscription-payment.js
// Verifies the Razorpay payment signature server-side (HMAC SHA256), then activates
// the user's plan in Supabase using the service-role key. Never trust plan activation
// from the client directly — always go through this verified path.

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const CYCLE_DAYS = { monthly: 30, quarterly: 90, yearly: 365 };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      planId,
      cycle,
    } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId || !planId || !cycle) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!CYCLE_DAYS[cycle]) {
      return res.status(400).json({ error: 'Invalid billing cycle' });
    }

    const keySecret = process.env.RAZORPAY_SECRET;
    if (!keySecret) {
      return res.status(500).json({ error: 'Razorpay secret not configured on server' });
    }

    // 1. Verify signature — this is the step that actually proves the payment is genuine
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed — signature mismatch' });
    }

    // 2. Activate the plan using the service-role client (bypasses RLS safely, server-side only)
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: existingUser, error: fetchErr } = await supabaseAdmin
      .from('users')
      .select('plan_expires_at')
      .eq('id', userId)
      .single();

    if (fetchErr) {
      return res.status(500).json({ error: 'Could not load user: ' + fetchErr.message });
    }

    const now = new Date();
    const currentExpiry = existingUser?.plan_expires_at ? new Date(existingUser.plan_expires_at) : null;
    // If they still have active time left, extend from there instead of losing it. Otherwise start from now.
    const base = currentExpiry && currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(base);
    newExpiry.setDate(newExpiry.getDate() + CYCLE_DAYS[cycle]);

    const { error: updateErr } = await supabaseAdmin
      .from('users')
      .update({
        plan_id: planId,
        plan_expires_at: newExpiry.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', userId);

    if (updateErr) {
      return res.status(500).json({ error: 'Could not activate plan: ' + updateErr.message });
    }

    // 3. Record the transaction + audit trail
    await supabaseAdmin.from('audit_log').insert([{
      action: 'SUBSCRIPTION_PAYMENT_VERIFIED',
      entity_type: 'user',
      entity_id: userId,
      details: JSON.stringify({ planId, cycle, razorpay_order_id, razorpay_payment_id, new_expiry: newExpiry.toISOString() }),
      performed_by: userId,
      created_at: now.toISOString(),
    }]);

    return res.status(200).json({ success: true, plan_expires_at: newExpiry.toISOString() });
  } catch (err) {
    console.error('verify-subscription-payment error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
