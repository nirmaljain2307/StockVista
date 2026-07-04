// supabase/functions/telegram-alert/index.ts
// Deploy: supabase functions deploy telegram-alert
// Set secrets: supabase secrets set TELEGRAM_BOT_TOKEN=xxx TELEGRAM_CHAT_ID=@yourchannel

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { rec } = await req.json();
    if (!rec) return new Response(JSON.stringify({ error: 'No rec provided' }), { status: 400 });

    const TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const CHAT  = Deno.env.get('TELEGRAM_CHAT_ID');
    if (!TOKEN || !CHAT) return new Response(JSON.stringify({ skipped: true }), { headers: corsHeaders });

    const statusEmoji: Record<string, string> = { BUY: '🟢', SELL: '🔴', HOLD: '🟡', AVOID: '⛔', EXIT: '🚪' };
    const segEmoji:    Record<string, string> = { equity: '📈', futures: '⚡', options: '🎯', commodity: '🏅' };

    const msg = `
${statusEmoji[rec.action] || '📊'} *${rec.action} — ${rec.symbol}* (${rec.exchange})
${segEmoji[rec.segment] || '📋'} ${(rec.segment || '').toUpperCase()}${rec.commodity_type ? ` · ${rec.commodity_type}` : ''}

💰 *Entry:* ₹${rec.entry_price}
🎯 *Target 1:* ₹${rec.target1}${rec.target2 ? `\n🎯 *Target 2:* ₹${rec.target2}` : ''}
🛑 *Stop Loss:* ₹${rec.stop_loss}
⏳ *Horizon:* ${rec.time_horizon || '—'}
⚠️ *Risk:* ${rec.risk_level || '—'}

${rec.rationale ? `📝 ${rec.rationale.slice(0, 200)}${rec.rationale.length > 200 ? '...' : ''}` : ''}

🔗 [View Full Analysis](https://stock-vista-sandy.vercel.app/recommendations)

_Investment in securities market is subject to market risk. Research only, not advice._
`.trim();

    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT, text: msg, parse_mode: 'Markdown', disable_web_page_preview: false }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
