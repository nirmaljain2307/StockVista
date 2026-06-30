// ─── CHART DATA SERVICE ─────────────────────────────────────────────────────
// Single integration point for all chart/market data used across the app.
// UI components must NEVER fetch or hardcode chart data directly — they call
// the functions below. Today these return mock data. When a paid feed is
// ready (TradingView widget, TrueData, Global Datafeeds, Groww API, or a
// broker API like Kite/Angel One), only the internals of this file change —
// function signatures and return shapes stay the same so the UI is untouched.

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '1d' | '1w';

export interface Candle {
  time: string;   // ISO timestamp
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface VolumeBar {
  time: string;
  volume: number;
}

export interface OptionLeg {
  strike: number;
  ce_oi: number;
  ce_ltp: number;
  ce_iv: number;
  pe_oi: number;
  pe_ltp: number;
  pe_iv: number;
}

export interface OptionChain {
  symbol: string;
  expiry: string;
  underlying_price: number;
  legs: OptionLeg[];
}

export interface SupportResistance {
  symbol: string;
  support: number[];
  resistance: number[];
}

// Deterministic pseudo-random so mock charts don't jump on every render.
function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 4294967296;
  };
}

/**
 * Returns mock OHLC candlestick data for a symbol/timeframe.
 * Swap the body of this function with a real feed call later
 * (e.g. TrueData historical API, Global Datafeeds, broker API).
 */
export async function getCandlestickData(symbol: string, timeframe: Timeframe = '1d'): Promise<Candle[]> {
  const rand = seededRandom(symbol + timeframe);
  const candles: Candle[] = [];
  let price = 1000 + rand() * 2000;
  const now = Date.now();
  const stepMs = { '1m': 60e3, '5m': 5 * 60e3, '15m': 15 * 60e3, '1h': 60 * 60e3, '1d': 24 * 60 * 60e3, '1w': 7 * 24 * 60 * 60e3 }[timeframe];

  for (let i = 50; i >= 0; i--) {
    const open = price;
    const move = (rand() - 0.5) * price * 0.02;
    const close = Math.max(1, open + move);
    const high = Math.max(open, close) + rand() * price * 0.005;
    const low = Math.min(open, close) - rand() * price * 0.005;
    candles.push({
      time: new Date(now - i * stepMs).toISOString(),
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
    });
    price = close;
  }
  return candles;
}

/** Returns mock volume bars for a symbol/timeframe. */
export async function getVolumeData(symbol: string, timeframe: Timeframe = '1d'): Promise<VolumeBar[]> {
  const candles = await getCandlestickData(symbol, timeframe);
  const rand = seededRandom(symbol + timeframe + 'vol');
  return candles.map(c => ({ time: c.time, volume: Math.floor(50000 + rand() * 500000) }));
}

/** Returns a mock option chain for a symbol's nearest expiry. */
export async function getOptionChain(symbol: string): Promise<OptionChain> {
  const rand = seededRandom(symbol + 'oc');
  const underlying = +(1000 + rand() * 2000).toFixed(2);
  const atm = Math.round(underlying / 50) * 50;
  const legs: OptionLeg[] = [];
  for (let i = -5; i <= 5; i++) {
    const strike = atm + i * 50;
    legs.push({
      strike,
      ce_oi: Math.floor(rand() * 500000),
      ce_ltp: +Math.max(0.5, (underlying - strike) * 0.4 + rand() * 20).toFixed(2),
      ce_iv: +(15 + rand() * 20).toFixed(1),
      pe_oi: Math.floor(rand() * 500000),
      pe_ltp: +Math.max(0.5, (strike - underlying) * 0.4 + rand() * 20).toFixed(2),
      pe_iv: +(15 + rand() * 20).toFixed(1),
    });
  }
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + ((4 - expiry.getDay() + 7) % 7 || 7)); // next Thursday
  return { symbol, expiry: expiry.toISOString().slice(0, 10), underlying_price: underlying, legs };
}

/** Returns mock support/resistance levels for a symbol. */
export async function getSupportResistance(symbol: string): Promise<SupportResistance> {
  const candles = await getCandlestickData(symbol, '1d');
  const closes = candles.map(c => c.close).sort((a, b) => a - b);
  const support = [closes[Math.floor(closes.length * 0.1)], closes[Math.floor(closes.length * 0.25)]].map(n => +n.toFixed(2));
  const resistance = [closes[Math.floor(closes.length * 0.75)], closes[Math.floor(closes.length * 0.9)]].map(n => +n.toFixed(2));
  return { symbol, support, resistance };
}
