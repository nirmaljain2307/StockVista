// StockVista — /api/create-subscription-order.js
// Creates a Razorpay order server-side. Amount is computed here (never trusted from client)
// so a tampered client request can never create an order for less than the real price.

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
    const { planId, cycle, userId } = req.body || {};

    if (!planId || !cycle || !userId) {
      return res.status(400).json({ error: 'planId, cycle and userId are required' });
    }
    if (!PRICES[planId] || !PRICES[planId][cycle]) {
      return res.status(400).json({ error: 'Invalid plan or billing cycle' });
    }

    const amountRupees = PRICES[planId][cycle];
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
        notes: { userId, planId, cycle, product: 'stockvista_subscription' },
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
