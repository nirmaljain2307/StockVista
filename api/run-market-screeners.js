// StockVista — /api/run-market-screeners.js
// Runs once a day (via Vercel Cron — see vercel.json) to compute real market-wide
// screener results across the full official NSE Nifty 500 universe (large + mid
// + small cap, 500 stocks) — sourced directly from the official NSE/niftyindices
// constituent list, not guessed from memory.
//
// TIMEOUT NOTE: scanning 500 stocks via Yahoo Finance takes real time. This
// function supports optional ?offset=&limit= query params so the scan can be
// split across multiple calls (e.g. multiple cron entries) if your Vercel plan's
// function timeout can't complete all 500 in one run. Only the offset=0 call
// clears the previous day's results — later batches append without wiping.

import { createClient } from '@supabase/supabase-js';

const NIFTY500_UNIVERSE = [
  '360ONE','3MINDIA','ABB','ACC','ACMESOLAR','AIAENG','APLAPOLLO','AUBANK','AWL','AADHARHFC',
  'AARTIIND','AAVAS','ABBOTINDIA','ACE','ACUTAAS','ADANIENSOL','ADANIENT','ADANIGREEN','ADANIPORTS','ADANIPOWER',
  'ATGL','ABCAPITAL','ABFRL','ABLBL','ABREL','ABSLAMC','CPPLUS','AEGISLOG','AEGISVOPAK','AFCONS',
  'AFFLE','AJANTPHARM','ALKEM','ABDL','ARE&M','AMBER','AMBUJACEM','ANANDRATHI','ANANTRAJ','ANGELONE',
  'ANTHEM','ANURAS','APARINDS','APOLLOHOSP','APOLLOTYRE','APTUS','ASAHIINDIA','ASHOKLEY','ASIANPAINT','ASTERDM',
  'ASTRAL','ATHERENERG','ATUL','AUROPHARMA','AIIL','DMART','AXISBANK','BEML','BLS','BSE',
  'BAJAJ-AUTO','BAJFINANCE','BAJAJFINSV','BAJAJHLDNG','BAJAJHFL','BALKRISIND','BALRAMCHIN','BANDHANBNK','BANKBARODA','BANKINDIA',
  'MAHABANK','BATAINDIA','BAYERCROP','BELRISE','BERGEPAINT','BDL','BEL','BHARATFORG','BHEL','BPCL',
  'BHARTIARTL','BHARTIHEXA','BIKAJI','GROWW','BIOCON','BSOFT','BLUEDART','BLUEJET','BLUESTARCO','BBTC',
  'BOSCHLTD','FIRSTCRY','BRIGADE','BRITANNIA','MAPMYINDIA','CCL','CESC','CGPOWER','CIEINDIA','CRISIL',
  'CANFINHOME','CANBK','CANHLIFE','CAPLIPOINT','CGCL','CARBORUNIV','CARTRADE','CASTROLIND','CEATLTD','CEMPRO',
  'CENTRALBK','CDSL','CHALET','CHAMBLFERT','CHENNPETRO','CHOICEIN','CHOLAHLDNG','CHOLAFIN','CIPLA','CUB',
  'CLEAN','COALINDIA','COCHINSHIP','COFORGE','COHANCE','COLPAL','CAMS','CONCORDBIO','CONCOR','COROMANDEL',
  'CRAFTSMAN','CREDITACC','CROMPTON','CUMMINSIND','CYIENT','DCMSHRIRAM','DLF','DOMS','DABUR','DALBHARAT',
  'DATAPATTNS','DEEPAKFERT','DEEPAKNTR','DELHIVERY','DEVYANI','DIVISLAB','DIXON','LALPATHLAB','DRREDDY','EIDPARRY',
  'EIHOTEL','EICHERMOT','ELECON','ELGIEQUIP','EMAMILTD','EMCURE','EMMVEE','ENDURANCE','ENGINERSIN','ERIS',
  'ESCORTS','ETERNAL','EXIDEIND','NYKAA','FEDERALBNK','FACT','FINCABLES','FSL','FIVESTAR','FORCEMOT',
  'FORTIS','GAIL','GVT&D','GMRAIRPORT','GABRIEL','GALLANTT','GRSE','GICRE','GILLETTE','GLAND',
  'GLAXO','GLENMARK','MEDANTA','GODIGIT','GPIL','GODFRYPHLP','GODREJCP','GODREJIND','GODREJPROP','GRANULES',
  'GRAPHITE','GRASIM','GRAVITA','GESHIP','FLUOROCHEM','GMDCLTD','HEG','HBLENGINE','HCLTECH','HDBFS',
  'HDFCAMC','HDFCBANK','HDFCLIFE','HFCL','HAVELLS','HEROMOTOCO','HEXT','HSCL','HINDALCO','HAL',
  'HINDCOPPER','HINDPETRO','HINDUNILVR','HINDZINC','POWERINDIA','HOMEFIRST','HONASA','HONAUT','HUDCO','HYUNDAI',
  'ICICIBANK','ICICIGI','ICICIAMC','ICICIPRULI','IDBI','IDFCFIRSTB','IFCI','IIFL','IRB','IRCON',
  'ITCHOTELS','ITC','ITI','INDGN','INDIACEM','INDIAMART','INDIANB','IEX','INDHOTEL','IOC',
  'IOB','IRCTC','IRFC','IREDA','IGL','INDUSTOWER','INDUSINDBK','NAUKRI','INFY','INOXWIND',
  'INTELLECT','INDIGO','IGIL','IKS','IPCALAB','JBCHEPHARM','JKCEMENT','JBMA','JKTYRE','JMFINANCIL',
  'JSWCEMENT','JSWDULUX','JSWENERGY','JSWINFRA','JSWSTEEL','JAINREC','JPPOWER','J&KBANK','JINDALSAW','JSL',
  'JINDALSTEL','JIOFIN','JUBLFOOD','JUBLINGREA','JUBLPHARMA','JWL','JYOTICNC','KPRMILL','KEI','KPITTECH',
  'KAJARIACER','KPIL','KALYANKJIL','KARURVYSYA','KAYNES','KEC','KFINTECH','KIRLOSENG','KOTAKBANK','KIMS',
  'LTF','LTTS','LGEINDIA','LICHSGFIN','LTFOODS','LTM','LT','LATENTVIEW','LAURUSLABS','THELEELA',
  'LEMONTREE','LENSKART','LICI','LINDEINDIA','LLOYDSME','LODHA','LUPIN','MMTC','MRF','MGL',
  'M&MFIN','M&M','MANAPPURAM','MRPL','MANKIND','MARICO','MARUTI','MFSL','MAXHEALTH','MAZDOCK',
  'MEESHO','MINDACORP','MSUMI','MOTILALOFS','MPHASIS','MCX','MUTHOOTFIN','NATCOPHARM','NBCC','NCC',
  'NHPC','NLCINDIA','NMDC','NSLNISP','NTPCGREEN','NTPC','NH','NATIONALUM','NAVA','NAVINFLUOR',
  'NESTLEIND','NETWEB','NEULANDLAB','NEWGEN','NAM-INDIA','NIVABUPA','NUVAMA','NUVOCO','OBEROIRLTY','ONGC',
  'OIL','OLAELEC','OLECTRA','PAYTM','ONESOURCE','OFSS','POLICYBZR','PCBL','PGEL','PIIND',
  'PNBHOUSING','PTCIL','PVRINOX','PAGEIND','PARADEEP','PATANJALI','PERSISTENT','PETRONET','PFIZER','PHOENIXLTD',
  'PWL','PIDILITIND','PINELABS','PIRAMALFIN','PPLPHARMA','POLYMED','POLYCAB','POONAWALLA','PFC','POWERGRID',
  'PREMIERENE','PRESTIGE','PNB','RRKABEL','RBLBANK','RECLTD','RHIM','RITES','RADICO','RVNL',
  'RAILTEL','RAINBOW','RKFORGE','REDINGTON','RELIANCE','RPOWER','SBFC','SBICARD','SBILIFE','SJVN',
  'SRF','SAGILITY','SAILIFE','SAMMAANCAP','MOTHERSON','SAPPHIRE','SARDAEN','SAREGAMA','SCHAEFFLER','SCHNEIDER',
  'SCI','SHREECEM','SHRIRAMFIN','SHYAMMETL','ENRIN','SIEMENS','SIGNATURE','SOBHA','SOLARINDS','SONACOMS',
  'SONATSOFTW','STARHEALTH','SBIN','SAIL','SUMICHEM','SUNPHARMA','SUNTV','SUNDARMFIN','SUPREMEIND','SPLPETRO',
  'SUZLON','SWANCORP','SWIGGY','SYNGENE','SYRMA','TBOTEK','TVSMOTOR','TATACAP','TATACHEM','TATACOMM',
  'TCS','TATACONSUM','TATAELXSI','TATAINVEST','TMCV','TMPV','TATAPOWER','TATASTEEL','TATATECH','TTML',
  'TECHM','TECHNOE','TEGA','TEJASNET','TENNIND','NIACL','RAMCOCEM','THERMAX','TIMKEN','TITAGARH',
  'TITAN','TORNTPHARM','TORNTPOWER','TARIL','TRAVELFOOD','TRENT','TRIDENT','TRITURBINE','TIINDIA','UCOBANK',
  'UNOMINDA','UPL','UTIAMC','ULTRACEMCO','UNIONBANK','UBL','UNITDSPR','URBANCO','USHAMART','VTL',
  'VBL','VEDL','VIJAYA','VMM','IDEA','VOLTAS','WAAREEENER','WELCORP','WELSPUNLIV','WHIRLPOOL',
  'WIPRO','WOCKPHARMA','YESBANK','ZFCVINDIA','ZEEL','ZENTEC','ZENSARTECH','ZYDUSLIFE','ZYDUSWELL','ECLERX',];

const CHUNK_SIZE = 15;

async function fetchSymbolData(symbol) {
  try {
    const cleanSym = symbol.replace('&', '%26'); // Yahoo handles URL-encoded & in tickers like M&M, ARE&M
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${cleanSym}.NS?interval=1d&range=3mo`,
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
    const offset = parseInt(req.query?.offset, 10) || 0;
    const limit = parseInt(req.query?.limit, 10) || NIFTY500_UNIVERSE.length;
    const batch = NIFTY500_UNIVERSE.slice(offset, offset + limit);

    const results = [];
    for (let i = 0; i < batch.length; i += CHUNK_SIZE) {
      const chunk = batch.slice(i, i + CHUNK_SIZE);
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

    // Only the first batch of the day clears yesterday's rows — later batches
    // (when splitting via ?offset=) append instead of wiping each other out.
    if (offset === 0) {
      await supabaseAdmin.from('screener_results').delete().in('category', ['breakouts', 'momentum']);
    }
    if (breakouts.length) await supabaseAdmin.from('screener_results').insert(breakouts);
    if (momentum.length) await supabaseAdmin.from('screener_results').insert(momentum);

    return res.status(200).json({
      success: true,
      universe_size: NIFTY500_UNIVERSE.length,
      batch_offset: offset,
      batch_scanned: batch.length,
      resolved: results.length,
      breakouts_found: breakouts.length,
      momentum_computed: momentum.length,
      as_of_date: today,
    });
  } catch (err) {
    console.error('run-market-screeners error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Allow this function up to 300s (5 min) to scan the full 500-stock universe.
// This requires Vercel Pro or higher — the Hobby plan caps function duration
// lower. If you're on Hobby and see timeouts, either upgrade, or split the
// scan into multiple cron entries using ?offset=&limit= (e.g. 0-249, 250-499).
export const config = { maxDuration: 300 };
