// StockVista — /api/create-subscription-order.js
// Creates a Razorpay order server-side. Amount is computed here (never trusted from client)
// so a tampered client request can never create an order for less than the real price.
// Coupon codes are re-validated here too — the client-side discount shown in the UI is
// cosmetic only; this is the number that actually gets charged.
import { createClient } from '@supabase/supabase-js';

const PRICES = {
  basic:   { monthly: 999,  quarterly: 2697,  yearly: 8991 },
  premium: { monthly: 2499, quarterly: 6747,  yearly: 22491 },
  fno:     { monthly: 3999, quarterly: 10797, yearly: 35991 },
  elite:   { monthly: 5999, quarterly: 16197, yearly: 53991 },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { planId, cycle, userId, couponCode } = req.body || {};
    if (!planId || !cycle || !userId) {
      return res.status(400).json({ error: 'planId, cycle and userId are required' });
    }
    if (!PRICES[planId] || !PRICES[planId][cycle]) {
      return res.status(400).json({ error: 'Invalid plan or billing cycle' });
    }

    let amountRupees = PRICES[planId][cycle];

    // Re-validate the coupon server-side — the client only used this to decide
    // what to *show*. If it doesn't check out here (expired, exhausted, wrong
    // plan, tampered code) we silently fall back to full price rather than
    // trusting anything the client sent.
    if (couponCode && couponCode.trim()) {
      const supabaseAdmin = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const { data: couponRows, error: couponErr } = await supabaseAdmin
        .rpc('validate_coupon', { p_code: couponCode.trim(), p_plan_id: planId });
      const coupon = !couponErr && couponRows && couponRows[0];

      if (coupon && coupon.valid && coupon.discount_type !== 'free') {
        if (coupon.discount_type === 'percent') {
          amountRupees = Math.round(amountRupees * (1 - coupon.discount_value / 100));
        } else if (coupon.discount_type === 'flat') {
          amountRupees = amountRupees - coupon.discount_value;
        }
        // Razorpay rejects ₹0 orders — floor at ₹1, matching the frontend's display logic.
        amountRupees = Math.max(1, amountRupees);
      }
      // coupon.discount_type === 'free' should never reach this endpoint — that flow
      // activates directly via redeem_free_coupon() and skips Razorpay entirely. If it
      // somehow does, we just charge full price rather than guessing.
    }

    const amountPaise = amountRupees * 100;
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_SECRET;
    if (!keyId || !keySecret) {
      return res.status(500).json({ error: 'Razorpay keys not configured on server' });
    }
    // Create order via Razorpay REST API (no SDK dependency needed)
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const receipt = `sub_${planId}_${cycle}_${Date.now()}`.slice(0, 40);
    const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt,
        notes: { userId, planId, cycle, couponCode: couponCode || '', product: 'stockvista_subscription' },
      }),
    });
    const order = await orderRes.json();
    if (!orderRes.ok) {
      return res.status(500).json({ error: order?.error?.description || 'Failed to create Razorpay order' });
    }
    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId, // public key id — safe to expose to client
    });
  } catch (err) {
    console.error('create-subscription-order error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
