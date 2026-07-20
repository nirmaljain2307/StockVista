// StockVista — /api/verify-subscription-payment.js
// Verifies the Razorpay payment signature server-side (HMAC SHA256), then activates
// the user's plan in Supabase using the service-role key. Never trust plan activation
// from the client directly — always go through this verified path.
//
// SECURITY FIX (July 2026): previously the planId/cycle used for activation came
// straight from the client request body. The Razorpay signature only proves
// "order X was paid" — it says nothing about which plan the client CLAIMS the
// order was for. So someone could pay for a ₹999 Basic order and then call this
// endpoint with planId: 'elite'. Now we fetch the order back from Razorpay and
// activate exactly the plan/cycle recorded in the order's notes at creation
// time (set server-side by create-subscription-order.js). Client-sent values
// are only used as a cross-check.
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const CYCLE_DAYS = { monthly: 30, quarterly: 90, yearly: 365 };
const VALID_PLANS = ['basic', 'premium', 'fno', 'commodity_basic', 'commodity', 'elite'];

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
    } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_SECRET;
    if (!keyId || !keySecret) {
      return res.status(500).json({ error: 'Razorpay keys not configured on server' });
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

    // 2. Fetch the order back from Razorpay — its notes (written server-side at
    // order creation) are the source of truth for plan, cycle, user and coupon.
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
      headers: { 'Authorization': `Basic ${auth}` },
    });
    const order = await orderRes.json();
    if (!orderRes.ok || !order || !order.notes) {
      return res.status(500).json({
        error: `Could not confirm order details with Razorpay. Contact support with payment ID: ${razorpay_payment_id}`,
      });
    }
    const planId = order.notes.planId;
    const cycle = order.notes.cycle;
    const couponCode = order.notes.couponCode || '';
    if (order.notes.product !== 'stockvista_subscription') {
      return res.status(400).json({ error: 'Order is not a subscription order' });
    }
    if (order.notes.userId !== userId) {
      return res.status(400).json({ error: 'This payment belongs to a different account' });
    }
    if (!VALID_PLANS.includes(planId) || !CYCLE_DAYS[cycle]) {
      return res.status(400).json({ error: 'Invalid plan or billing cycle on order' });
    }

    // 3. Activate the plan using the service-role client (bypasses RLS safely, server-side only)
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

    // 3b. If a coupon was used, bump its usage count now that the payment is confirmed
    // real. This runs after activation and is wrapped so a coupon-table hiccup never
    // blocks a paying customer from getting their plan.
    if (couponCode && couponCode.trim()) {
      try {
        const { data: couponRow } = await supabaseAdmin
          .from('coupons')
          .select('id, uses')
          .eq('code', couponCode.trim())
          .single();
        if (couponRow) {
          await supabaseAdmin
            .from('coupons')
            .update({ uses: (couponRow.uses || 0) + 1 })
            .eq('id', couponRow.id);
        }
      } catch (couponUpdateErr) {
        console.error('coupon usage increment failed (non-fatal):', couponUpdateErr);
      }
    }

    // 4. Record the transaction + audit trail
    await supabaseAdmin.from('audit_log').insert([{
      action: 'SUBSCRIPTION_PAYMENT_VERIFIED',
      entity_type: 'user',
      entity_id: userId,
      details: JSON.stringify({ planId, cycle, couponCode: couponCode || null, razorpay_order_id, razorpay_payment_id, new_expiry: newExpiry.toISOString() }),
      performed_by: userId,
      created_at: now.toISOString(),
    }]);
    return res.status(200).json({ success: true, plan_expires_at: newExpiry.toISOString() });
  } catch (err) {
    console.error('verify-subscription-payment error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
