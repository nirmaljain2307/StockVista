// StockVista — /api/generate-research.js
// Phase 6: AI Research Orchestrator — with a full technical-analysis-backed
// trade-call engine for EQUITY, and a qualitative-only fallback for F&O and
// commodity (where derivatives/contract data is still unavailable — see
// PHASE_7_MCP_STATUS.md and the Phase 5 research notes for why).
//
// EQUITY: computes real technical indicators (SMA20/50/200, RSI14, ATR14,
// 20-day swing high/low) from free Yahoo Finance OHLC history — deterministic
// backend math, NOT calculated by Claude — then asks Claude to propose an
// action (BUY/SELL/HOLD) with entry/targets/stop-loss grounded in that data.
// The proposed numbers are validated with deterministic rules before being
// returned. This is always a DRAFT — nothing here writes to the
// recommendations table or publishes anything. An admin must review and
// explicitly apply + publish.
//
// F&O / COMMODITY: still qualitative-only (no entry/target/SL) because we
// don't have derivatives (OI, IV, PCR) or correctly-denominated MCX contract
// data from any free/legal source yet. Generating price levels without that
// would risk materially wrong numbers — worse than no call at all.

// ─── Deterministic technical indicators (plain math, no AI) ─────────────────
function calcSMA(closes, period) {
  if (closes.length < period) return null;
  const recent = closes.slice(-period);
  return +(recent.reduce((a, b) => a + b, 0) / period).toFixed(2);
}

function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period, avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return +(100 - 100 / (1 + rs)).toFixed(2);
}

function calcATR(highs, lows, closes, period = 14) {
  const trs = [];
  for (let i = 1; i < highs.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trs.push(tr);
  }
  if (trs.length < period) return null;
  const recent = trs.slice(-period);
  return +(recent.reduce((a, b) => a + b, 0) / period).toFixed(2);
}

function calcSwing(highs, lows, period = 20) {
  const rh = highs.slice(-period), rl = lows.slice(-period);
  if (!rh.length || !rl.length) return { high: null, low: null };
  return { high: +Math.max(...rh).toFixed(2), low: +Math.min(...rl).toFixed(2) };
}

// ─── Direct (in-process) fundamentals + news fetchers ────────────────────
// These used to call this app's own /api/get-fundamentals and /api/get-news
// endpoints over HTTP (server calling itself). That self-referencing hop is
// fragile on Vercel (can return an HTML error/interstitial page instead of
// JSON depending on deployment protection, cold starts, etc.) — that was
// the actual cause of the "Unexpected token '<'" crash. Calling the same
// logic directly, in-process, removes that failure mode entirely.

async function fetchFundamentalsDirect(symbol, exch) {
  try {
    const yhSym = exch === 'BSE' ? `${symbol}.BO` : `${symbol}.NS`;
    const modules = 'financialData,defaultKeyStatistics,summaryDetail';
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${yhSym}?modules=${modules}`;
    const resp = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; StockVistaBot/1.0)' },
    });
    if (!resp.ok) return null;
    const json = await resp.json();
    const result = json?.quoteSummary?.result?.[0];
    if (!result) return null;

    const fd = result.financialData || {};
    const ks = result.defaultKeyStatistics || {};
    const sd = result.summaryDetail || {};
    const num = (obj) => (obj && typeof obj.raw === 'number') ? obj.raw : null;
    const pct = (obj) => { const v = num(obj); return v !== null ? +(v * 100).toFixed(2) : null; };

    return {
      symbol, exchange: exch,
      valuation: {
        trailingPE: num(sd.trailingPE), forwardPE: num(ks.forwardPE),
        priceToBook: num(ks.priceToBook), marketCap: num(sd.marketCap),
        enterpriseValue: num(ks.enterpriseValue), pegRatio: num(ks.pegRatio),
      },
      profitability: {
        returnOnEquityPct: pct(fd.returnOnEquity), returnOnAssetsPct: pct(fd.returnOnAssets),
        grossMarginsPct: pct(fd.grossMargins), operatingMarginsPct: pct(fd.operatingMargins),
        profitMarginsPct: pct(fd.profitMargins),
      },
      growth: { revenueGrowthPct: pct(fd.revenueGrowth), earningsGrowthPct: pct(fd.earningsGrowth) },
      balanceSheet: {
        debtToEquity: num(fd.debtToEquity), currentRatio: num(fd.currentRatio),
        quickRatio: num(fd.quickRatio), totalCash: num(fd.totalCash), totalDebt: num(fd.totalDebt),
      },
      dividend: { yieldPct: pct(sd.dividendYield) },
      priceRange: { fiftyTwoWeekHigh: num(sd.fiftyTwoWeekHigh), fiftyTwoWeekLow: num(sd.fiftyTwoWeekLow) },
      eps: { trailing: num(ks.trailingEps), forward: num(ks.forwardEps) },
    };
  } catch (e) {
    return null;
  }
}

function parseRssItems(xml) {
  const items = [];
  const itemBlocks = xml.split('<item>').slice(1);
  for (const block of itemBlocks) {
    const get = (tag) => {
      const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
      if (!m) return null;
      return m[1].replace('<![CDATA[', '').replace(']]>', '').trim();
    };
    const title = get('title');
    const link = get('link');
    const pubDate = get('pubDate');
    const source = get('source');
    if (title) items.push({ headline: title, link, publishedAt: pubDate, source: source || 'Google News aggregation' });
  }
  return items;
}

async function fetchNewsDirect(company) {
  try {
    const query = encodeURIComponent(`${company} NSE stock`);
    const url = `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;
    const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StockVistaBot/1.0)' } });
    if (!resp.ok) return null;
    const xml = await resp.text();
    const items = parseRssItems(xml).slice(0, 10);
    return { items };
  } catch (e) {
    return null;
  }
}

async function fetchTechnicals(yhSym) {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${yhSym}?interval=1d&range=6mo`,
    { headers: { Accept: 'application/json' } }
  );
  if (!res.ok) return null;
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  const q = result?.indicators?.quote?.[0];
  if (!result || !q) return null;

  const closes = q.close?.filter(c => c != null) || [];
  const highs = q.high?.filter(c => c != null) || [];
  const lows = q.low?.filter(c => c != null) || [];
  if (closes.length < 25) return null;

  const lastClose = closes[closes.length - 1];
  const sma20 = calcSMA(closes, 20);
  const sma50 = calcSMA(closes, 50);
  const sma200 = calcSMA(closes, 200);
  const rsi14 = calcRSI(closes, 14);
  const atr14 = calcATR(highs, lows, closes, 14);
  const swing20 = calcSwing(highs, lows, 20);

  let trend = 'neutral';
  if (sma20 && sma50 && lastClose > sma20 && sma20 > sma50) trend = 'uptrend';
  else if (sma20 && sma50 && lastClose < sma20 && sma20 < sma50) trend = 'downtrend';

  return {
    lastClose: +lastClose.toFixed(2),
    sma20, sma50, sma200, rsi14, atr14,
    swingHigh20: swing20.high, swingLow20: swing20.low,
    trend,
    note: 'Deterministic indicators calculated from daily OHLC (6mo). Not AI-generated.',
  };
}

// ─── Deterministic validation of Claude's proposed trade call ───────────────
function validateTradeCall(call, technicals) {
  const issues = [];
  if (!call || !call.action) return { valid: false, issues: ['No action returned'] };
  if (call.action === 'HOLD' || call.action === 'AVOID') return { valid: true, issues: [] };

  const { entry_price, target1, target2, target3, stop_loss } = call;
  if (!entry_price || !stop_loss || !target1) {
    issues.push('Missing entry, target1, or stop-loss — cannot validate.');
    return { valid: false, issues };
  }

  if (call.action === 'BUY') {
    if (!(target1 > entry_price)) issues.push('BUY target1 must be above entry.');
    if (!(stop_loss < entry_price)) issues.push('BUY stop-loss must be below entry.');
    if (target2 && !(target2 > target1)) issues.push('target2 should be above target1.');
    if (target3 && target2 && !(target3 > target2)) issues.push('target3 should be above target2.');
  } else if (call.action === 'SELL') {
    if (!(target1 < entry_price)) issues.push('SELL target1 must be below entry.');
    if (!(stop_loss > entry_price)) issues.push('SELL stop-loss must be above entry.');
    if (target2 && !(target2 < target1)) issues.push('target2 should be below target1.');
    if (target3 && target2 && !(target3 < target2)) issues.push('target3 should be below target2.');
  }

  const risk = Math.abs(entry_price - stop_loss);
  const reward = Math.abs(target1 - entry_price);
  const riskReward = risk > 0 ? +(reward / risk).toFixed(2) : null;
  if (riskReward !== null && riskReward < 1.2) {
    issues.push(`Risk-reward is only 1:${riskReward} — below the 1:1.5 minimum guideline. Review before publishing.`);
  }

  if (technicals?.rsi14 != null) {
    if (call.action === 'BUY' && technicals.rsi14 > 75) issues.push(`RSI is ${technicals.rsi14} (overbought) — entry may be extended.`);
    if (call.action === 'SELL' && technicals.rsi14 < 25) issues.push(`RSI is ${technicals.rsi14} (oversold) — entry may be extended.`);
  }

  return { valid: issues.filter(i => !i.startsWith('Risk-reward') && !i.startsWith('RSI')).length === 0, issues, riskReward };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol, exchange, companyName, segment } = req.body || {};
  if (!symbol) {
    return res.status(400).json({ error: 'symbol is required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured on server. This feature requires adding that env var (Claude API usage — billed per call).' });
  }

  const exch = (exchange || 'NSE').toUpperCase();
  const seg = (segment || 'equity').toLowerCase();
  const isEquity = seg === 'equity';
  const yhSym = exch === 'BSE' ? `${symbol}.BO` : `${symbol}.NS`;

  try {
    const [quoteRes, fundamentals, news, technicals] = await Promise.all([
      fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${yhSym}?interval=1d&range=1d`, { headers: { Accept: 'application/json' } }).catch(() => null),
      fetchFundamentalsDirect(symbol, exch),
      fetchNewsDirect(companyName || symbol),
      isEquity ? fetchTechnicals(yhSym).catch(() => null) : Promise.resolve(null),
    ]);

    let quote = null;
    const missingDatasets = [];

    if (quoteRes && quoteRes.ok) {
      const qj = await quoteRes.json();
      const meta = qj?.chart?.result?.[0]?.meta;
      if (meta) quote = { price: meta.regularMarketPrice, previousClose: meta.previousClose || meta.chartPreviousClose };
    }
    if (!quote) missingDatasets.push('live_quote');
    if (!fundamentals) missingDatasets.push('fundamentals');
    if (!news) missingDatasets.push('news');

    if (isEquity && !technicals) missingDatasets.push('technicals');
    if (!isEquity) missingDatasets.push('technicals_not_computed_for_this_segment');

    missingDatasets.push('sector_peer_comparison', 'institutional_fii_dii_activity');
    if (!isEquity) missingDatasets.push('derivatives_options_data_open_interest_iv');

    const researchPacket = {
      symbol, exchange: exch, segment: seg, companyName: companyName || symbol,
      requestedAt: new Date().toISOString(),
      quote, fundamentals, technicals, news: news?.items || [],
      missingDatasets,
    };

    // ─── System prompt — segment-aware ───────────────────────────────────
    let systemPrompt;
    if (isEquity && technicals) {
      systemPrompt = `You are a research assistant analysing NSE/BSE listed Indian equities using ONLY the structured data provided in the user message. Never fabricate prices, financials, news, or indicator values not present in the input — the "technicals" object was calculated deterministically by the backend, trust those numbers exactly as given.

You have: current quote, technical indicators (SMA20/50/200, RSI14, ATR14, 20-day swing high/low, trend), fundamentals, and recent news. You do NOT have institutional (FII/DII) activity or sector/peer comparison data — factor that into your confidence level.

Propose ONE of: BUY, SELL, or HOLD, grounded in the technicals given:
- Use the trend, RSI, and SMA relationship to judge direction
- Use swingLow20/swingHigh20 and ATR14 for realistic stop-loss placement (e.g. stop-loss beyond recent swing low/high, sized with ATR)
- Use swingHigh20/swingLow20 and reasonable extensions for target1/target2/target3
- Ensure risk-reward on target1 is at least 1:1.5 — if you cannot construct a valid setup meeting this, return HOLD instead
- If RSI is extreme (>75 or <25) in the direction of your call, lower your confidence and say so
- If fundamentals are weak/missing and technicals are the only basis, say so explicitly and lower confidence

Never claim certainty. State your reasoning referencing the actual numbers given.

Return ONLY valid JSON, no other text, in this exact shape:
{
  "action": "BUY"|"SELL"|"HOLD",
  "entry_price": number|null,
  "target1": number|null,
  "target2": number|null,
  "target3": number|null,
  "stop_loss": number|null,
  "confidence": number,
  "reasoning": string,
  "keyRisk": string,
  "fundamentalNote": string,
  "newsNote": string
}`;
    } else {
      systemPrompt = `You are a research assistant analysing NSE/BSE listed Indian securities using ONLY the structured data provided. Never fabricate data.

For this request (segment: ${seg}), you do NOT have technical chart analysis, sector/peer comparison, institutional activity, or derivatives/options/contract data — these are listed in "missingDatasets". Because of this, you must NOT produce entry price, targets, or stop-loss — that would be a recommendation from incomplete data, which is prohibited.

Produce a qualitative research summary only: a fundamental assessment (if fundamentals present), a news summary (if news present), an overall qualitative stance ("Positive"|"Negative"|"Neutral"|"Watch" — use "Watch" whenever confidence is below 60 or data is missing), a confidence score 0-100, and explicit data limitations.

Return ONLY valid JSON, no other text:
{
  "fundamentalView": { "score": number|null, "summary": string, "strengths": string[], "weaknesses": string[] },
  "newsView": { "summary": string, "materialEvents": string[] },
  "verdict": { "stance": "Positive"|"Negative"|"Neutral"|"Watch", "confidence": number, "primaryReason": string, "keyRisk": string },
  "dataLimitations": string
}`;
    }

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: 'user', content: JSON.stringify(researchPacket) }],
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      return res.status(502).json({ error: 'Claude API request failed', detail: errText.slice(0, 300) });
    }

    const claudeJson = await claudeRes.json();
    const rawText = claudeJson?.content?.find(c => c.type === 'text')?.text || '';

    let parsed;
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      return res.status(502).json({ error: 'Claude returned non-JSON output', raw: rawText.slice(0, 500) });
    }

    let validation = null;
    if (isEquity && technicals) {
      validation = validateTradeCall(parsed, technicals);
    }

    return res.status(200).json({
      symbol, exchange: exch, segment: seg,
      generatedAt: new Date().toISOString(),
      missingDatasets,
      technicals,
      isTradeCall: isEquity && !!technicals,
      draft: parsed,
      validation,
      disclaimer: 'This is an AI-generated DRAFT for internal analyst review only. It is not a trade recommendation, has not been approved, and must not be published or shown to subscribers without human review and explicit publication.',
    });
  } catch (err) {
    console.error('generate-research error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
