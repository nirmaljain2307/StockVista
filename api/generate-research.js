// StockVista — /api/generate-research.js
// Phase 6: AI Research Orchestrator (partial implementation).
//
// IMPORTANT SCOPE NOTE: this orchestrator only has access to quote data,
// basic fundamentals (Yahoo, unofficial), and news headlines (Google News
// RSS). It does NOT have multi-timeframe technicals, sector/peer comparison,
// FII/DII institutional activity, or derivatives/options data (Phase 5's
// harder half is still blocked on a paid data vendor decision).
//
// Because of that gap, this deliberately does NOT generate entry price,
// targets, or stop-loss — that would be exactly the "recommendation from
// incomplete data" the master prompt prohibits. It produces a qualitative
// research summary only (fundamental view + news context + a directional
// lean with confidence), explicitly listing what's missing. An admin must
// review this before it's used anywhere near a real published call — this
// endpoint never writes to the recommendations table itself.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol, exchange, companyName } = req.body || {};
  if (!symbol) {
    return res.status(400).json({ error: 'symbol is required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured on server. This feature requires adding that env var (Claude API usage — billed per call).' });
  }

  const exch = (exchange || 'NSE').toUpperCase();
  const yhSym = exch === 'BSE' ? `${symbol}.BO` : `${symbol}.NS`;

  try {
    // 1. Gather available structured data in parallel
    const baseUrl = `https://${req.headers.host}`;
    const [quoteRes, fundRes, newsRes] = await Promise.allSettled([
      fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${yhSym}?interval=1d&range=1d`, { headers: { Accept: 'application/json' } }),
      fetch(`${baseUrl}/api/get-fundamentals?symbol=${symbol}&exchange=${exch}`),
      fetch(`${baseUrl}/api/get-news?company=${encodeURIComponent(companyName || symbol)}`),
    ]);

    let quote = null, fundamentals = null, news = null;
    const missingDatasets = [];

    if (quoteRes.status === 'fulfilled' && quoteRes.value.ok) {
      const qj = await quoteRes.value.json();
      const meta = qj?.chart?.result?.[0]?.meta;
      if (meta) quote = { price: meta.regularMarketPrice, previousClose: meta.previousClose || meta.chartPreviousClose };
    }
    if (!quote) missingDatasets.push('live_quote');

    if (fundRes.status === 'fulfilled' && fundRes.value.ok) {
      fundamentals = await fundRes.value.json();
    }
    if (!fundamentals) missingDatasets.push('fundamentals');

    if (newsRes.status === 'fulfilled' && newsRes.value.ok) {
      news = await newsRes.value.json();
    }
    if (!news) missingDatasets.push('news');

    // These are always missing in this v1 implementation — deliberately
    // disclosed rather than silently omitted.
    missingDatasets.push('multi_timeframe_technicals', 'sector_peer_comparison', 'institutional_fii_dii_activity', 'derivatives_options_data');

    const researchPacket = {
      symbol, exchange: exch, companyName: companyName || symbol,
      requestedAt: new Date().toISOString(),
      quote, fundamentals, news: news?.items || [],
      missingDatasets,
    };

    // 2. System prompt — enforces the master doc's core honesty rules
    const systemPrompt = `You are a research assistant analysing NSE/BSE listed Indian equities using ONLY the structured data provided to you in the user message. You must never fabricate prices, financials, news, or any other data point not present in the input.

You do NOT have technical chart analysis (multi-timeframe price structure), sector/peer comparison, institutional (FII/DII) activity, or derivatives/options data for this request — these are listed in "missingDatasets". Because of this, you must NOT produce entry price, target price, stop-loss, or a specific BUY/SELL trade call. That would be a recommendation from incomplete data, which is explicitly prohibited.

Instead, produce a qualitative research summary with:
- A fundamental assessment (valuation, profitability, growth, balance sheet) based only on the fundamentals data given, if present
- A brief summary of the news context, if present, clearly distinguishing fact (what was reported) from your interpretation (what it might mean)
- An overall qualitative stance: one of "Positive", "Negative", "Neutral", or "Watch" (use "Watch" whenever confidence is below 60 or fundamentals/news data is missing)
- A confidence score 0-100
- An explicit list of what data was missing and how that limits the conclusion

Return ONLY valid JSON matching this exact shape, no other text:
{
  "fundamentalView": { "score": number|null, "summary": string, "strengths": string[], "weaknesses": string[] },
  "newsView": { "summary": string, "materialEvents": string[] },
  "verdict": { "stance": "Positive"|"Negative"|"Neutral"|"Watch", "confidence": number, "primaryReason": string, "keyRisk": string },
  "dataLimitations": string
}`;

    // 3. Call Claude
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

    return res.status(200).json({
      symbol, exchange: exch,
      generatedAt: new Date().toISOString(),
      missingDatasets,
      draft: parsed,
      disclaimer: 'This is an AI-generated DRAFT for internal analyst review only. It is not a trade recommendation, has not been approved, and must not be published or shown to subscribers without human review and explicit publication.',
    });
  } catch (err) {
    console.error('generate-research error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
