// StockVista — /api/get-price.js
// Proxies Yahoo Finance chart lookups server-side, so the browser never
// talks to Yahoo directly (Yahoo's endpoint doesn't reliably send CORS
// headers, which caused intermittent "blocked by CORS policy" failures on
// live-price, chart, and watchlist lookups scattered across the app).
// One shared endpoint for all three call sites instead of three copies of
// the same fetch-and-parse logic.
//
// Query params:
//   symbol   — NSE/BSE/MCX ticker, no exchange suffix (required)
//   exchange — "NSE" | "BSE" | "MCX" (default "NSE")
//   range    — Yahoo range string, e.g. "1d", "1mo", "3mo", "1y" (default "1d")
// Returns: { price, previousClose, series, timestamps }
// All fields are null (not an error) when Yahoo has nothing for the symbol,
// so callers can just check for null instead of handling a thrown error.

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { symbol, exchange, range } = req.query;
    const cleanSymbol = (symbol || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanSymbol) {
      return res.status(400).json({ error: 'symbol is required' });
    }
    const exch = (exchange || 'NSE').toUpperCase();
    const suffix = exch === 'BSE' ? '.BO' : exch === 'MCX' ? '.MCX' : '.NS';
    const yhSym = cleanSymbol + suffix;
    const yhRange = /^[0-9a-z]+$/i.test(range || '') ? range : '1d';

    const yhRes = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yhSym}?interval=1d&range=${yhRange}`,
      { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } }
    );

    if (!yhRes.ok) {
      return res.status(200).json({ price: null, previousClose: null, series: null, timestamps: null });
    }

    const data = await yhRes.json();
    const result = data?.chart?.result?.[0];
    const meta = result?.meta;
    const price = meta?.regularMarketPrice ?? null;
    const previousClose = meta?.previousClose ?? meta?.chartPreviousClose ?? null;
    // Deliberately NOT filtering nulls out of closes here — timestamps and
    // closes must stay index-aligned (closes[i] is the price at timestamps[i])
    // so a chart caller can plot them together. Each caller filters nulls
    // itself, in whichever way fits what it's doing with the pair.
    const closes = result?.indicators?.quote?.[0]?.close;
    const timestamps = result?.timestamp;
    const hasSeries = Array.isArray(closes) && Array.isArray(timestamps) && closes.length === timestamps.length;

    res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=40');
    return res.status(200).json({
      price,
      previousClose,
      closes: hasSeries ? closes : null,
      timestamps: hasSeries ? timestamps : null,
    });
  } catch (err) {
    console.error('get-price error:', err);
    return res.status(200).json({ price: null, previousClose: null, series: null, timestamps: null });
  }
}
