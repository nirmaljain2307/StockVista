// StockVista — /api/run-market-screeners.js
// Runs once a day (via Vercel Cron — see vercel.json) to compute real market-wide
// screener results across a curated large-cap universe (Nifty 100-ish, ~100
// stocks). Results are stored in Supabase; the client reads pre-computed rows
// instead of scanning the market live in the browser.
//
// SCOPE NOTE: this covers ~100 large-cap NSE stocks, not the full NSE/BSE
// universe (2000+ stocks). Scanning the entire market needs a paid market-data
// feed and a much longer-running job — this is a deliberately scoped v1.
// Review and update NIFTY100_UNIVERSE periodically as index constituents change.

import { createClient } from '@supabase/supabase-js';

const NIFTY100_UNIVERSE = [
  'RELIANCE','TCS','HDFCBANK','ICICIBANK','INFY','HINDUNILVR','ITC','SBIN','BHARTIARTL','KOTAKBANK',
  'LT','AXISBANK','BAJFINANCE','ASIANPAINT','MARUTI','SUNPHARMA','TITAN','ULTRACEMCO','NESTLEIND','WIPRO',
  'ONGC','NTPC','POWERGRID','M&M','TATAMOTORS','TATASTEEL','JSWSTEEL','ADANIENT','ADANIPORTS','COALINDIA',
  'HCLTECH','BAJAJFINSV','DRREDDY','GRASIM','BRITANNIA','CIPLA','EICHERMOT','HEROMOTOCO','DIVISLAB','TECHM',
  'INDUSINDBK','SBILIFE','HDFCLIFE','BAJAJ-AUTO','APOLLOHOSP','UPL','BPCL','TATACONSUM','SHREECEM','HINDALCO',
  'VEDL','GAIL','PIDILITIND','DABUR','GODREJCP','SIEMENS','DLF','HAVELLS','AMBUJACEM','MARICO',
  'BANDHANBNK','BANKBARODA','PNB','CANBK','IDFCFIRSTB','GODREJPROP','INDIGO','TRENT','ZOMATO','LTIM',
  'MOTHERSON','BOSCHLTD','TVSMOTOR','ICICIPRULI','ICICIGI','SBICARD','MUTHOOTFIN','CHOLAFIN','PFC','RECLTD',
  'IRCTC','IOC','NHPC','SAIL','NMDC','JINDALSTEL','ADANIPOWER','ADANIGREEN','TORNTPHARM','LUPIN',
  'AUROPHARMA','BIOCON','COLPAL','BERGEPAINT','ASHOKLEY','MRF','PAGEIND','ABB','HAL','BEL',
];

const CHUNK_SIZE = 10;

async function fetchSymbolData(symbol) {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.NS?interval=1d&range=3mo`,
      { headers: { 'Accept': 'application/json' } }
    );
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    const closes = result?.indicators?.quote?.[0]?.close?.filter(c => c != null);
    if (!closes || closes.length < 25) return null;

    const today = closes[closes.length - 1];
    const prior20 = closes.slice(-21, -1);
    const high20 = Math.max(...prior20);
    const isBreakout = today >= high20;
    const breakoutMargin = +(((today - high20) / high20) * 100).toFixed(2);

    const baselineIdx = closes.length >= 31 ? closes.length - 31 : 0;
    const baseline = closes[baselineIdx];
    const momentum30 = +(((today - baseline) / baseline) * 100).toFixed(2);

    return { symbol, today: +today.toFixed(2), isBreakout, breakoutMargin, momentum30 };
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  // Secure the endpoint — only Vercel Cron (or a manual call with the right
  // secret) can trigger this, since it writes to the database.
  const authHeader = req.headers['authorization'];
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const results = [];
    for (let i = 0; i < NIFTY100_UNIVERSE.length; i += CHUNK_SIZE) {
      const chunk = NIFTY100_UNIVERSE.slice(i, i + CHUNK_SIZE);
      const chunkResults = await Promise.all(chunk.map(fetchSymbolData));
      results.push(...chunkResults.filter(Boolean));
    }

    const today = new Date().toISOString().slice(0, 10);

    const breakouts = results
      .filter(r => r.isBreakout)
      .sort((a, b) => b.breakoutMargin - a.breakoutMargin)
      .slice(0, 30)
      .map(r => ({
        category: 'breakouts', symbol: r.symbol, exchange: 'NSE',
        metric_value: r.breakoutMargin,
        meta: { close: r.today, note: 'Closed at or above its prior 20-day high' },
        as_of_date: today,
      }));

    const momentum = [...results]
      .sort((a, b) => b.momentum30 - a.momentum30)
      .slice(0, 30)
      .map(r => ({
        category: 'momentum', symbol: r.symbol, exchange: 'NSE',
        metric_value: r.momentum30,
        meta: { close: r.today, note: '30-trading-day price return' },
        as_of_date: today,
      }));

    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Full daily refresh — clear yesterday's rows for these categories, insert today's.
    await supabaseAdmin.from('screener_results').delete().in('category', ['breakouts', 'momentum']);
    if (breakouts.length) await supabaseAdmin.from('screener_results').insert(breakouts);
    if (momentum.length) await supabaseAdmin.from('screener_results').insert(momentum);

    return res.status(200).json({
      success: true,
      scanned: results.length,
      breakouts: breakouts.length,
      momentum: momentum.length,
      as_of_date: today,
    });
  } catch (err) {
    console.error('run-market-screeners error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Allow this function up to 60s to scan the full universe (Vercel Pro or
// higher — Hobby plans may cap this lower; reduce CHUNK_SIZE / universe size
// if you see timeouts on your plan).
export const config = { maxDuration: 60 };
