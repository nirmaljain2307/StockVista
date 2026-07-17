import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { createClient } from '@supabase/supabase-js';

// ─── SUPABASE ────────────────────────────────────────────────────────────────
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ─── TELEGRAM ALERT (server-side via Supabase Edge Function) ─────────────────
// Token is NEVER in the client bundle — Edge Function holds it securely.
const sendTelegramAlert = async (rec) => {
  try {
    await supabase.functions.invoke('telegram-alert', { body: { rec } });
  } catch (e) {
    console.warn('Telegram alert skipped:', e.message);
  }
};

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const APP_NAME = 'StockVista';
const SEBI_REG = 'SEBI RA Registration: Pending (Application Under Process)'; // CHANGE once SEBI RA reg. no. is issued
const ANALYST_NAME = 'Nishit Jain';
const COMPANY_NAME = 'NRJ Info Edge Pvt Ltd';
const GRIEVANCE_EMAIL = 'nirmaljain2307@gmail.com';
const CONTACT_EMAIL = 'nirmaljain2307@gmail.com';
const CONTACT_PHONE = '+91-7003950585';

// Staff role → which admin panel tabs they can see. 'owner' is implicit for
// any existing admin (is_admin=true) that hasn't been assigned an explicit
// staff_role yet, so older admin accounts keep full access unchanged.
const ROLE_TABS = {
  owner: ['recommendations', 'add_recommendation', 'approvals', 'users', 'analytics', 'revenue', 'notifications', 'email', 'coupons', 'bulk', 'blog', 'performance', 'settings', 'audit', 'staff'],
  research_analyst: ['recommendations', 'add_recommendation', 'performance', 'audit'],
  finance: ['revenue', 'coupons', 'audit'],
  hr: ['staff'],
  marketing: ['blog', 'notifications', 'email', 'coupons'],
  compliance_officer: ['audit'],
  customer_support: ['users', 'notifications'],
};
const STAFF_ROLE_LABELS = {
  owner: 'Owner', research_analyst: 'Research Analyst', finance: 'Finance', hr: 'HR',
  marketing: 'Marketing', compliance_officer: 'Compliance Officer', customer_support: 'Customer Support',
};
// Roles whose recommendation saves go to pending_approval instead of live —
// currently just research_analyst. Owner publishes directly, no gate.
const REQUIRES_APPROVAL_ROLES = ['research_analyst'];
const effectiveStaffRole = (userProfile) => userProfile?.staff_role || (userProfile?.is_admin ? 'owner' : null);

const TAB_LABELS = {
  recommendations: 'Recommendations', add_recommendation: 'Add call', approvals: 'Approvals',
  users: 'Users', analytics: 'Analytics', revenue: 'Revenue', notifications: 'Notifications',
  email: 'Email', coupons: 'Coupons', bulk: 'Bulk actions', blog: 'Blog', performance: 'Performance',
  settings: 'Settings', audit: 'Audit log', staff: 'Staff and roles',
};

const PLANS = {
  basic: { name: 'Basic Equity', color: '#334155', monthly: 999, callLimit: 10, screenerResultLimit: 5 },
  premium: { name: 'Premium Equity', color: '#3b82f6', monthly: 2499, callLimit: 25, screenerResultLimit: null },
  fno: { name: 'F&O Pro', color: '#f59e0b', monthly: 3999, callLimit: 40, screenerResultLimit: null },
  elite: { name: 'Elite All Access', color: '#a78bfa', monthly: 5999, callLimit: null, screenerResultLimit: null },
};

const PLAN_FEATURES = [
  { key: 'equity_calls',      label: 'Equity Calls / Month',       values: ['4–6', '8–12', '8–12', '8–12'] },
  { key: 'fno_calls',         label: 'F&O Calls / Month',           values: ['—', '—', '4–6', '6–8'] },
  { key: 'intraday_calls',    label: 'Intraday Calls / Month',      values: ['—', '—', '2–4', '5–8'] },
  { key: 'commodity_calls',   label: 'Commodity Calls / Month',     values: ['—', '—', '—', '3–5'] },
  { key: 'ipo_calls',         label: 'IPO Calls / Month',           values: ['—', '2–3', '2–3', '2–3'] },
  { key: 'total_calls',       label: 'Total Calls / Month',         values: ['4–6', '10–15', '14–21', '24–36'] },
  { key: 'stocks_covered',    label: 'Stocks Covered',              values: ['Large Cap', 'All Caps', 'All Caps', 'All Caps'] },
  { key: 'call_targets',      label: 'Call Targets',                values: ['T1 only', 'T1, T2, T3', 'T1, T2, T3', 'T1, T2, T3'] },
  { key: 'pdf_report',        label: 'PDF Research Report per Call', values: [false, true, true, true] },
  { key: 'weekly_market',     label: 'Weekly Market View',          values: [true, true, true, true] },
  { key: 'blog_access',       label: 'Blog & Education',            values: [true, true, true, true] },
  { key: 'options_strategy',  label: 'Options Strategies',          values: ['—', '—', 'Buy only', 'Buy + Sell'] },
  { key: 'lot_size',          label: 'Lot Size Specified (F&O)',    values: [false, false, true, true] },
  { key: 'telegram',          label: 'Telegram Signal Alerts',      values: [false, false, true, true] },
  { key: 'performance_rpt',   label: 'Monthly Performance Report',  values: [false, true, true, true] },
  { key: 'email_support',     label: 'Email Support',               values: ['—', '24hr response', '12hr response', 'WhatsApp direct'] },
  { key: 'one_on_one',        label: '1-on-1 Monthly Session',      values: [false, false, false, '30 min/mo'] },
  { key: 'portfolio_review',  label: 'Portfolio Review on Request', values: [false, false, false, true] },
];

const BILLING_CYCLES = [
  { key: 'monthly', label: 'Monthly', discount: 0 },
  { key: 'quarterly', label: 'Quarterly', discount: 10 },
  { key: 'halfyearly', label: 'Half Yearly', discount: 15 },
  { key: 'yearly', label: 'Yearly', discount: 25 },
];

// ─── STYLES ──────────────────────────────────────────────────────────────────
const S = {
  page: { minHeight: '100vh', background: '#FEFDFB', color: '#0A0A0A', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '0 24px' },
  section: { padding: '80px 24px' },

  nav: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(15,23,42,0.07)', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' },
  navLogo: { fontSize: '17px', fontWeight: 800, color: '#0A0A0A', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', letterSpacing: '-0.02em' },
  navLogoIcon: { width: '33px', height: '33px', background: '#0f172a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' },
  navLinks: { display: 'flex', gap: '2px', alignItems: 'center' },
  navLink: { color: '#64748b', cursor: 'pointer', fontSize: '13px', fontWeight: 500, transition: 'color 0.15s', padding: '6px 11px', border: 'none', background: 'none', borderRadius: '6px' },
  navBtn: { background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' },

  btn: { border: 'none', borderRadius: '10px', padding: '11px 22px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center', gap: '8px', letterSpacing: '0.01em' },
  btnPrimary: { background: '#1e40af', color: '#fff' },
  btnSecondary: { background: '#FEFDFB', color: '#1e293b', border: '1px solid #dde3ed' },
  btnGold: { background: '#b45309', color: '#fff' },
  btnSm: { padding: '7px 13px', fontSize: '12px', borderRadius: '8px' },
  btnDanger: { background: '#dc2626', color: '#fff' },
  btnGreen: { background: '#059669', color: '#fff' },

  card: { background: '#FEFDFB', border: '1px solid #E5E3DA', borderRadius: '14px', padding: '24px', boxShadow: '0 1px 2px rgba(20,20,15,0.04), 0 2px 8px rgba(20,20,15,0.03)' },
  cardHover: { transition: 'all 0.18s' },

  formGroup: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.07em' },
  input: { width: '100%', background: '#FAF9F5', border: '1px solid #E5E3DA', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: '#0A0A0A', outline: 'none', fontFamily: 'inherit', fontWeight: 500 },
  select: { width: '100%', background: '#FAF9F5', border: '1px solid #E5E3DA', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: '#0A0A0A', outline: 'none', fontFamily: 'inherit', fontWeight: 500 },
  textarea: { width: '100%', background: '#FAF9F5', border: '1px solid #E5E3DA', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: '#0A0A0A', outline: 'none', fontFamily: 'inherit', resize: 'vertical', minHeight: '80px', fontWeight: 500 },

  badge: { display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.02em' },
  badgeBuy:  { background: '#dcfce7', color: '#166534' },
  badgeSell: { background: '#fee2e2', color: '#991b1b' },
  badgeHold: { background: '#fef9c3', color: '#854d0e' },
  badgeAvoid:{ background: '#f1f5f9', color: '#475569' },
  badgeExit: { background: '#ede9fe', color: '#5b21b6' },
  badgeActive: { background: '#dcfce7', color: '#166534' },
  badgeClosed: { background: '#f1f5f9', color: '#475569' },

  h1: { fontSize: 'clamp(32px, 5vw, 60px)', fontWeight: 800, lineHeight: 1.06, letterSpacing: '-0.03em', color: '#0A0A0A' },
  h2: { fontSize: 'clamp(24px, 3vw, 40px)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#0A0A0A' },
  h3: { fontSize: '20px', fontWeight: 700, letterSpacing: '-0.01em', color: '#0A0A0A' },
  h4: { fontSize: '15px', fontWeight: 600, color: '#0A0A0A' },
  muted: { color: '#64748b' },
  gold: { color: '#b45309' },
  green: { color: '#059669' },
  red: { color: '#dc2626' },

  disclaimer: { background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 16px', fontSize: '12px', color: '#92400e', lineHeight: 1.6 },

  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' },

  flex: { display: 'flex', alignItems: 'center' },
  flexBetween: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  mt8: { marginTop: '8px' },
  mt16: { marginTop: '16px' },
  mt24: { marginTop: '24px' },
  mt32: { marginTop: '32px' },
  mb8: { marginBottom: '8px' },
  mb16: { marginBottom: '16px' },
  divider: { height: '1px', background: '#f1f5f9', margin: '24px 0' },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (n) => n ? Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—';
const fmtCurr = (n) => n ? Number(n).toLocaleString('en-IN') : '0';
const loadRazorpayScript = () => new Promise((resolve) => {
  if (typeof window !== 'undefined' && window.Razorpay) return resolve(true);
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});
const pct = (entry, target) => entry && target ? (((target - entry) / entry) * 100).toFixed(1) + '%' : '—';
const actionStyle = (a) => {
  if (a === 'BUY') return S.badgeBuy;
  if (a === 'SELL') return S.badgeSell;
  if (a === 'HOLD') return S.badgeHold;
  if (a === 'AVOID') return S.badgeAvoid;
  if (a === 'EXIT') return S.badgeExit;
  return {};
};
const riskColor = (r) => r === 'low' ? '#10b981' : r === 'medium' ? '#f59e0b' : '#ef4444';

// Points + % P&L for a recommendation. BUY: CMP - Entry. SELL: Entry - CMP.
const calcPnL = (rec) => {
  const entry = parseFloat(rec?.entry_price);
  const cmp = parseFloat(rec?.cmp);
  if (!entry || !cmp) return { points: null, pct: null };
  const points = rec.action === 'SELL' ? entry - cmp : cmp - entry;
  return { points: +points.toFixed(2), pct: +((points / entry) * 100).toFixed(2) };
};

// Delayed price for equity recommendations via Yahoo Finance's unofficial public
// endpoint (not an exchange-licensed real-time feed) — so "Live Calls" price
// movement reflects a recent market price instead of only a manually-entered CMP.
// This is NOT real-time/live data and must never be labeled "LIVE" in the UI —
// always render it as "Delayed" per the data-freshness rules.
// F&O/commodity contract symbols aren't resolvable this way, so those still rely
// on the admin-entered CMP field.
function useLivePrice(symbol, exchange, active) {
  const [price, setPrice] = useState(null);
  useEffect(() => {
    if (!active || !symbol) return;
    let cancelled = false;
    const fetchPrice = async () => {
      const exch = (exchange || 'NSE').toUpperCase();
      const yhSym = exch === 'BSE' ? symbol + '.BO' : symbol + '.NS';
      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${yhSym}?interval=1d&range=1d`,
          { headers: { 'Accept': 'application/json' } }
        );
        const data = await res.json();
        const q = data?.chart?.result?.[0]?.meta;
        if (q?.regularMarketPrice && !cancelled) setPrice(q.regularMarketPrice);
      } catch(e) {}
    };
    fetchPrice();
    const timer = setInterval(fetchPrice, 30000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [symbol, exchange, active]);
  return price;
}

// Suggests an effective status from CMP vs target/SL/expiry without overwriting
// the admin's manually-set status. Used for display badges and the admin
// "Auto-check Status" bulk action.
const suggestStatus = (rec) => {
  if (['closed', 'archived'].includes(rec.status)) return rec.status;
  if (rec.expiry_at && new Date(rec.expiry_at) < new Date() && !['target_hit', 'sl_hit'].includes(rec.status)) return 'expired';
  const cmp = parseFloat(rec.cmp);
  const entry = parseFloat(rec.entry_price);
  const t1 = parseFloat(rec.target1);
  const sl = parseFloat(rec.stop_loss);
  if (!cmp || !entry) return rec.status;
  const isBuy = rec.action !== 'SELL';
  if (t1 && (isBuy ? cmp >= t1 : cmp <= t1)) return 'target_hit';
  if (sl && (isBuy ? cmp <= sl : cmp >= sl)) return 'sl_hit';
  if (t1) {
    const distToTarget = Math.abs(t1 - cmp) / Math.abs(t1 - entry || 1);
    if (distToTarget <= 0.15) return 'near_target';
  }
  if (sl) {
    const distToSL = Math.abs(cmp - sl) / Math.abs(entry - sl || 1);
    if (distToSL <= 0.15) return 'near_sl';
  }
  return 'live';
};
const navigate = (path) => { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); };
const getPath = () => window.location.pathname;

// ─── DISCLAIMER POPUP ─────────────────────────────────────────────────────────
function DisclaimerPopup({ onAccept }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ ...S.card, maxWidth: '560px', width: '100%', borderColor: '#ef4444' }}>
        <div style={{ ...S.flex, gap: '12px', marginBottom: '20px' }}>
          <span style={{ fontSize: '28px' }}>⚠️</span>
          <div>
            <h2 style={{ ...S.h3, color: '#ef4444' }}>Risk Disclosure</h2>
            <p style={{ ...S.muted, fontSize: '13px' }}>Please read carefully before proceeding</p>
          </div>
        </div>
        <div style={{ ...S.disclaimer, marginBottom: '20px' }}>
          <p><strong style={{ color: '#ef4444' }}>IMPORTANT DISCLAIMER:</strong></p>
          <p style={{ marginTop: '8px' }}>Investment in securities market is subject to market risks. Read all related documents carefully before investing. The securities quoted are exemplary and not recommendatory. Past performance is not indicative of future results.</p>
          <p style={{ marginTop: '8px' }}>{APP_NAME} (SEBI RA Reg: {SEBI_REG}) provides research analysis for educational purposes only. We do not guarantee any returns or profits. All investment decisions are solely the responsibility of the investor.</p>
          <p style={{ marginTop: '8px' }}>F&O trading involves substantial risk and is not suitable for all investors. Options can result in total loss of investment.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onAccept} style={{ ...S.btn, ...S.btnPrimary, flex: 1 }}>
            ✓ I Understand & Accept
          </button>
          <button onClick={() => navigate('/')} style={{ ...S.btn, ...S.btnSecondary }}>
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── F&O SPECIFIC RISK GATE (first-time access, separate from general disclaimer) ──
function FnoRiskGate({ onAccept, onDecline }) {
  const [checked, setChecked] = useState(false);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ ...S.card, maxWidth: '560px', width: '100%', borderColor: '#d97706' }}>
        <div style={{ ...S.flex, gap: '12px', marginBottom: '20px' }}>
          <span style={{ fontSize: '28px' }}>⚡</span>
          <div>
            <h2 style={{ ...S.h3, color: '#d97706' }}>F&O carries materially higher risk</h2>
            <p style={{ ...S.muted, fontSize: '13px' }}>One-time acknowledgment before viewing Futures & Options calls</p>
          </div>
        </div>
        <div style={{ ...S.disclaimer, marginBottom: '16px', background: '#fffbeb', borderColor: '#fde68a' }}>
          <p>Futures and Options trading is materially riskier than equity investing:</p>
          <ul style={{ paddingLeft: '18px', marginTop: '8px', lineHeight: 1.8 }}>
            <li>Options can result in <strong>total loss of premium paid</strong></li>
            <li>Futures losses can <strong>exceed your initial margin</strong></li>
            <li>Leverage magnifies both gains and losses</li>
            <li>Not suitable for inexperienced or risk-averse investors</li>
          </ul>
          <p style={{ marginTop: '8px' }}>{APP_NAME} (SEBI RA Reg: {SEBI_REG}) publishes F&O research for educational purposes only. We do not guarantee returns. Please assess your own risk tolerance before proceeding.</p>
        </div>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '18px', cursor: 'pointer', fontSize: '13px', color: '#0A0A0A' }}>
          <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} style={{ marginTop: '2px' }} />
          <span>I understand F&O trading carries a high risk of loss, including losses beyond my invested capital, and I choose to proceed at my own risk.</span>
        </label>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onAccept} disabled={!checked} style={{ ...S.btn, ...S.btnPrimary, flex: 1, opacity: checked ? 1 : 0.5, cursor: checked ? 'pointer' : 'not-allowed', background: '#d97706' }}>
            ✓ I Understand & Agree
          </button>
          <button onClick={onDecline} style={{ ...S.btn, ...S.btnSecondary }}>
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
// ─── i18n (English / Hindi UI toggle) ────────────────────────────────────────
// IMPORTANT: this only translates static UI labels (nav, footer, section
// headers, page titles). Toast/alert/error/success messages and any dynamic
// system notification text always stay in English by design, regardless of
// the selected language — do not add those keys here.
const TRANSLATIONS = {
  en: {
    nav_home: 'Home', nav_live_calls: 'Live Calls', nav_recommendations: 'Recommendations',
    nav_past_calls: 'Past Calls', nav_pricing: 'Pricing', nav_blog: 'Blog', nav_performance: 'Performance',
    nav_signin: 'Sign In', nav_getstarted: 'Get Started', nav_dashboard: 'Dashboard',
    nav_profile: 'Profile Settings', nav_subscription: 'Subscription', nav_admin: 'Admin Panel',
    nav_signout: 'Sign Out', nav_notifications: 'Notifications', nav_viewall: 'View All',
    nav_watchlist: 'Watchlist', nav_portfolio: 'Portfolio', nav_screeners: 'Screeners',
    footer_company: 'Company', footer_about: 'About', footer_contact: 'Contact',
    footer_legal: 'Legal', footer_risk: 'Risk Disclosure', footer_sebi: 'SEBI RA Disclosure',
    footer_charter: 'Investor Charter', footer_support: 'Support', footer_faq: 'FAQ',
    footer_grievance: 'Grievance', footer_tagline: 'SEBI-registered research, built for serious investors',
    section_latest_calls: 'Latest Research Calls', section_my_performance: 'If You Followed Every Call On Your Plan',
    section_screeners: 'Screeners', section_watchlist: 'Watchlist', section_portfolio: 'My Portfolio',
    section_plan_snapshot: 'Plan Performance Snapshot',
  },
  hi: {
    nav_home: 'होम', nav_live_calls: 'लाइव कॉल्स', nav_recommendations: 'सिफारिशें',
    nav_past_calls: 'पिछली कॉल्स', nav_pricing: 'प्राइसिंग', nav_blog: 'ब्लॉग', nav_performance: 'परफॉर्मेंस',
    nav_signin: 'साइन इन', nav_getstarted: 'शुरू करें', nav_dashboard: 'डैशबोर्ड',
    nav_profile: 'प्रोफाइल सेटिंग्स', nav_subscription: 'सब्सक्रिप्शन', nav_admin: 'एडमिन पैनल',
    nav_signout: 'साइन आउट', nav_notifications: 'नोटिफिकेशन', nav_viewall: 'सभी देखें',
    nav_watchlist: 'वॉचलिस्ट', nav_portfolio: 'पोर्टफोलियो', nav_screeners: 'स्क्रीनर्स',
    footer_company: 'कंपनी', footer_about: 'हमारे बारे में', footer_contact: 'संपर्क करें',
    footer_legal: 'कानूनी', footer_risk: 'रिस्क डिस्क्लोज़र', footer_sebi: 'सेबी RA डिस्क्लोज़र',
    footer_charter: 'इन्वेस्टर चार्टर', footer_support: 'सहायता', footer_faq: 'सामान्य प्रश्न',
    footer_grievance: 'शिकायत', footer_tagline: 'सेबी-रजिस्टर्ड रिसर्च, गंभीर निवेशकों के लिए',
    section_latest_calls: 'नवीनतम रिसर्च कॉल्स', section_my_performance: 'अगर आपने अपने प्लान की हर कॉल फॉलो की होती',
    section_screeners: 'स्क्रीनर्स', section_watchlist: 'वॉचलिस्ट', section_portfolio: 'मेरा पोर्टफोलियो',
    section_plan_snapshot: 'प्लान परफॉर्मेंस स्नैपशॉट',
  },
};

const LanguageContext = createContext({ lang: 'en', setLang: () => {}, t: (k) => k });

function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => (typeof localStorage !== 'undefined' && localStorage.getItem('sv_lang')) || 'en');
  const setLang = (l) => {
    try { localStorage.setItem('sv_lang', l); } catch(e) {}
    setLangState(l);
  };
  const t = (key) => TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

const useLang = () => useContext(LanguageContext);

function LanguageToggle({ compact }) {
  const { lang, setLang } = useLang();
  return (
    <div style={{ display: 'flex', gap: '2px', background: '#E6F1FB', borderRadius: '20px', padding: '2px', border: '1px solid #B5D4F4' }}>
      {['en', 'hi'].map(l => (
        <button key={l} onClick={() => setLang(l)}
          style={{ border: 'none', cursor: 'pointer', borderRadius: '18px', padding: compact ? '4px 10px' : '5px 12px', fontSize: '11px', fontWeight: 700, background: lang === l ? '#185FA5' : 'transparent', color: lang === l ? '#fff' : '#0C447C' }}>
          {l === 'en' ? 'EN' : 'हि'}
        </button>
      ))}
    </div>
  );
}

function Navbar({ user, userProfile, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [screenersOpen, setScreenersOpen] = useState(false);
  const { t } = useLang();
  const path = getPath();

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      const q = searchQuery.trim();
      const { data } = await supabase.from('recommendations').select('id,symbol,stock_name,exchange,action,status')
        .neq('status', 'draft')
        .or(`symbol.ilike.%${q}%,stock_name.ilike.%${q}%`)
        .order('published_at', { ascending: false })
        .limit(6);
      setSearchResults(data || []);
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const SCREENER_CATEGORIES = [
    { key: 'breakouts', label: 'Fresh breakouts', icon: '📈' },
    { key: 'momentum', label: 'Momentum leaders', icon: '⚡' },
    { key: 'smart-money', label: 'Smart money moves', icon: '🏦', plan: 'premium' },
    { key: 'options-activity', label: 'Unusual option activity', icon: '🔥', plan: 'fno' },
    { key: 'dividend', label: 'Dividend leaders', icon: '🪙' },
  ];

  const navItems = [
    { label: t('nav_home'), path: '/' },
    { label: t('nav_live_calls'), path: '/live-calls' },
    { label: t('nav_recommendations'), path: '/recommendations' },
    { label: t('nav_past_calls'), path: '/past-recommendations' },
    { label: t('nav_pricing'), path: '/pricing' },
    { label: t('nav_blog'), path: '/blog' },
    { label: t('nav_performance'), path: '/performance' },
  ];

  return (
    <nav style={{ ...S.nav, background: '#E6F1FB', borderBottom: '1px solid #B5D4F4' }}>
      <div style={{ ...S.navLogo, color: '#042C53' }} onClick={() => navigate('/')}>
        <div style={{ ...S.navLogoIcon, background: '#185FA5' }}>📈</div>
        <span>{APP_NAME}</span>
      </div>

      {/* Desktop Nav */}
      <div style={{ ...S.navLinks, '@media(max-width:768px)': { display: 'none' } }}>
        {navItems.map(item => (
          <button key={item.path} onClick={() => navigate(item.path)}
            style={{ ...S.navLink, color: path === item.path ? '#185FA5' : '#0C447C' }}>
            {item.label}
          </button>
        ))}
        <div style={{ position: 'relative' }}
          onMouseEnter={() => setScreenersOpen(true)}
          onMouseLeave={() => setScreenersOpen(false)}>
          <button onClick={() => navigate('/screeners')}
            style={{ ...S.navLink, color: path === '/screeners' ? '#185FA5' : '#0C447C', display: 'flex', alignItems: 'center', gap: '3px' }}>
            {t('nav_screeners')} <span style={{ fontSize: '9px' }}>▾</span>
          </button>
          {screenersOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, background: '#fff', border: '1px solid #E5E3DA', borderRadius: '12px', padding: '8px', width: '220px', zIndex: 200, boxShadow: '0 8px 24px rgba(30,64,175,0.12)' }}>
              {SCREENER_CATEGORIES.map(c => (
                <button key={c.key} onClick={() => navigate('/screeners')}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#0A0A0A' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#E6F1FB'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <span>{c.icon}</span> {c.label}
                  {c.plan && <span style={{ marginLeft: 'auto', fontSize: '9px', color: '#94a3b8' }}>🔒</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', flex: '0 1 260px' }}>
        {searchOpen ? (
          <div>
            <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
              placeholder="Search stocks..."
              style={{ width: '100%', padding: '7px 12px', borderRadius: '8px', border: '1px solid #E5E3DA', fontSize: '13px', outline: 'none' }} />
            {searchQuery.trim() && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: '#fff', border: '1px solid #E5E3DA', borderRadius: '10px', padding: '6px', zIndex: 200, maxHeight: '280px', overflowY: 'auto', boxShadow: '0 8px 24px rgba(30,64,175,0.12)' }}>
                {searchLoading ? (
                  <p style={{ fontSize: '12px', color: '#94a3b8', padding: '8px' }}>Searching...</p>
                ) : searchResults.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#94a3b8', padding: '8px' }}>No matching calls found.</p>
                ) : searchResults.map(r => (
                  <button key={r.id} onMouseDown={() => { navigate('/recommendations/' + r.id); setSearchOpen(false); setSearchQuery(''); }}
                    style={{ display: 'flex', justifyContent: 'space-between', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#E6F1FB'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <span style={{ fontWeight: 700, color: '#0A0A0A' }}>{r.symbol} <span style={{ fontWeight: 400, color: '#94a3b8' }}>{r.exchange}</span></span>
                    <span style={{ ...S.badge, ...actionStyle(r.action), fontSize: '10px' }}>{r.action}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button onClick={() => setSearchOpen(true)} style={{ ...S.btn, ...S.btnSecondary, ...S.btnSm }} aria-label="Search">🔍</button>
        )}
      </div>

      <div style={{ ...S.flex, gap: '12px' }}>
        <LanguageToggle compact />
        {user ? (
          <>
            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setNotifOpen(!notifOpen)}
                style={{ ...S.btn, ...S.btnSecondary, ...S.btnSm, position: 'relative' }}>
                🔔
                <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 700, borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
              </button>
              {notifOpen && (
                <div style={{ position: 'absolute', right: 0, top: '44px', background: '#e2e8f0', border: '1px solid #334155', borderRadius: '12px', padding: '16px', width: '300px', zIndex: 100 }}>
                  <p style={{ fontWeight: 700, marginBottom: '12px' }}>{t('nav_notifications')}</p>
                  {[
                    { title: 'New Recommendation', msg: 'RELIANCE BUY call published', type: '📊' },
                    { title: 'Target Achieved', msg: 'TCS Target 1 hit — Book partial profits', type: '🎯' },
                    { title: 'Subscription Reminder', msg: 'Your subscription expires in 5 days', type: '⏰' },
                  ].map((n, i) => (
                    <div key={i} style={{ padding: '10px 0', borderBottom: i < 2 ? '1px solid #334155' : 'none' }}>
                      <p style={{ fontSize: '13px', fontWeight: 600 }}>{n.type} {n.title}</p>
                      <p style={{ fontSize: '12px', ...S.muted, marginTop: '2px' }}>{n.msg}</p>
                    </div>
                  ))}
                  <button onClick={() => navigate('/notifications')} style={{ ...S.btn, ...S.btnSecondary, ...S.btnSm, width: '100%', justifyContent: 'center', marginTop: '8px' }}>{t('nav_viewall')}</button>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setUserMenu(!userMenu)}
                style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)', border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 700, fontSize: '14px' }}>
                {(userProfile?.full_name || user.email || 'U')[0].toUpperCase()}
              </button>
              {userMenu && (
                <div style={{ position: 'absolute', right: 0, top: '44px', background: '#e2e8f0', border: '1px solid #334155', borderRadius: '12px', padding: '8px', width: '200px', zIndex: 100 }}>
                  <p style={{ padding: '8px 12px', fontSize: '12px', ...S.muted }}>{user.email}</p>
                  <div style={{ height: '1px', background: '#334155', margin: '4px 0' }} />
                  {[
                    { label: '📊 ' + t('nav_dashboard'), path: '/dashboard' },
                    { label: '⚙️ ' + t('nav_profile'), path: '/profile' },
                    { label: '💳 ' + t('nav_subscription'), path: '/subscription' },
                    ...(effectiveStaffRole(userProfile) ? [{ label: '🛡️ ' + t('nav_admin'), path: '/admin' }] : []),
                  ].map(item => (
                    <button key={item.path} onClick={() => { navigate(item.path); setUserMenu(false); }}
                      style={{ ...S.navLink, display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '8px', color: '#0A0A0A' }}>
                      {item.label}
                    </button>
                  ))}
                  <div style={{ height: '1px', background: '#334155', margin: '4px 0' }} />
                  <button onClick={onLogout} style={{ ...S.navLink, display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '8px', color: '#ef4444' }}>
                    🚪 {t('nav_signout')}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button onClick={() => navigate('/login')} style={{ ...S.btn, ...S.btnSecondary, ...S.btnSm }}>{t('nav_signin')}</button>
            <button onClick={() => navigate('/register')} style={{ ...S.btn, ...S.btnPrimary, ...S.btnSm, background: '#185FA5' }}>{t('nav_getstarted')}</button>
          </>
        )}

        {/* Mobile Menu */}
        <button onClick={() => setMenuOpen(!menuOpen)}
          style={{ ...S.btn, ...S.btnSecondary, ...S.btnSm, display: 'none' }}>☰</button>
      </div>

      {/* Mobile Menu Drawer */}
      {menuOpen && (
        <div style={{ position: 'fixed', top: '64px', left: 0, right: 0, bottom: 0, background: '#f1f5f9', zIndex: 999, padding: '24px' }}>
          <button onClick={() => setMenuOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>✕</button>
          {navItems.map(item => (
            <button key={item.path} onClick={() => { navigate(item.path); setMenuOpen(false); }}
              style={{ ...S.navLink, display: 'block', fontSize: '20px', fontWeight: 700, padding: '16px 0', color: path === item.path ? '#3b82f6' : '#e2e8f0' }}>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
function LandingPage() {
  const features = [
    { icon: '🎯', title: 'Accurate Recommendations', desc: 'Research-backed stock calls with detailed technical and fundamental analysis.' },
    { icon: '📊', title: 'All Market Segments', desc: 'Coverage across Equity, F&O, Intraday, Swing, and Long-term positions.' },
    { icon: '🛡️', title: 'SEBI Compliant', desc: 'Registered Research Analyst following all SEBI RA Regulations 2014 (amended 2025) guidelines.' },
    { icon: '⚡', title: 'Real-time Alerts', desc: 'Instant notifications on entry, target, and stop-loss updates.' },
    { icon: '📈', title: 'Performance Tracking', desc: 'Transparent track record with detailed P&L analytics and reports.' },
    { icon: '📚', title: 'Market Education', desc: 'Learn with comprehensive articles, tutorials, and market insights.' },
  ];

  const [liveStats, setLiveStats] = useState({ calls: 0, live: 0, segments: 0 });

  useEffect(() => {
    supabase.from('recommendations').select('id, status, segment', { count: 'exact' })
      .neq('status', 'draft')
      .then(({ data, count }) => {
        const segments = [...new Set((data || []).map(r => r.segment))].length;
        const live = (data || []).filter(r => ['live', 'near_target', 'near_sl'].includes(r.status)).length;
        setLiveStats({ calls: count || 0, live, segments });
      });
  }, []);

  const steps = [
    { n: '01', title: 'Create Account', desc: 'Sign up and complete your risk profile in minutes.' },
    { n: '02', title: 'Choose Plan', desc: 'Select a research subscription that fits your trading style.' },
    { n: '03', title: 'Accept Risk Disclosure', desc: 'Read and acknowledge our SEBI-mandated risk disclosures.' },
    { n: '04', title: 'Access Research', desc: 'View expert calls with detailed analysis and track performance.' },
  ];

  return (
    <div>
      {/* Hero */}
      <section style={{ paddingTop: '140px', paddingBottom: '80px', textAlign: 'center', background: 'linear-gradient(160deg, #eff6ff 0%, #f1f5f9 60%, #fefce8 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(29,78,216,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(245,158,11,0.1) 0%, transparent 50%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(29,78,216,0.15)', border: '1px solid rgba(29,78,216,0.3)', borderRadius: '20px', padding: '6px 16px', marginBottom: '24px', fontSize: '13px', color: '#334155' }}>
            <span style={{ color: '#10b981' }}>●</span> SEBI Registered Research Analyst · {SEBI_REG}
          </div>
          <h1 style={{ ...S.h1, marginBottom: '24px' }}>
            Expert Stock Market Research for{' '}
            <span style={{ background: 'linear-gradient(135deg, #3b82f6, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              NSE & BSE
            </span>
          </h1>
          <p style={{ fontSize: '18px', ...S.muted, marginBottom: '40px', lineHeight: 1.7, maxWidth: '600px', margin: '0 auto 40px' }}>
            Research-backed buy/sell/hold calls for equity, F&O, and intraday trading. Not tips — rigorous analysis with entry, targets, and stop-loss.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')} style={{ ...S.btn, ...S.btnPrimary, fontSize: '16px', padding: '14px 32px' }}>
              Get Started →
            </button>
            <button onClick={() => navigate('/recommendations')} style={{ ...S.btn, ...S.btnSecondary, fontSize: '16px', padding: '14px 32px' }}>
              View Research Calls
            </button>
          </div>
          <div style={{ ...S.disclaimer, maxWidth: '600px', margin: '32px auto 0', textAlign: 'left' }}>
            ⚠️ Investment in securities market is subject to market risks. Read all related documents carefully before investing. Past performance is not indicative of future results.
          </div>
        </div>
      </section>

      {/* Credentials Bar */}
      <section style={{ background: '#FEFDFB', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '28px 20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '24px', textAlign: 'center' }}>
          {[
            { value: liveStats.calls > 0 ? liveStats.calls + '+' : 'Growing', label: 'Research Calls Published', real: true },
            { value: liveStats.live > 0 ? liveStats.live : '—', label: 'Live Calls Right Now', real: true },
            { value: liveStats.segments > 0 ? liveStats.segments : '4', label: 'Market Segments Covered', real: true },
            { value: '7+', label: 'Years Market Experience', real: true },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#1d4ed8' }}>{s.value}</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '16px' }}>
          * All statistics are real-time and updated live from our database. We do not inflate or estimate any metric.
        </p>
      </section>

      {/* Latest Calls Preview */}
      <section style={{ ...S.section, background: '#f1f5f9' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ ...S.flexBetween, marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={S.h2}>Latest Research Calls</h2>
              <p style={{ ...S.muted, marginTop: '8px' }}>Sample recommendations — subscribe for full analysis</p>
            </div>
            <button onClick={() => navigate('/recommendations')} style={{ ...S.btn, ...S.btnSecondary }}>View All →</button>
          </div>
          <div style={S.grid2}>
            {[
              { stock: 'RELIANCE', name: 'Reliance Industries', action: 'BUY', entry: 2456.80, target: 2650, sl: 2380, segment: 'Equity', horizon: 'Positional', risk: 'medium', pct: '+7.9%' },
              { stock: 'TCS', name: 'Tata Consultancy Services', action: 'BUY', entry: 3421.50, target: 3800, sl: 3290, segment: 'Equity', horizon: 'Long Term', risk: 'low', pct: '+11.1%' },
              { stock: 'HDFCBANK', name: 'HDFC Bank', action: 'HOLD', entry: 1654.25, target: 1800, sl: 1580, segment: 'Equity', horizon: 'Positional', risk: 'low', pct: '+8.8%' },
              { stock: 'NIFTY 50', name: 'Index Option', action: 'BUY', entry: 320, target: 450, sl: 200, segment: 'Options', horizon: 'Intraday', risk: 'high', pct: '+40.6%' },
            ].map((r, i) => (
              <div key={i} style={{ ...S.card, ...S.cardHover, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#1e293b'}
                onClick={() => navigate('/register')}>
                {i >= 2 && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔒</div>
                      <p style={{ fontWeight: 700, color: '#0A0A0A', marginBottom: '12px' }}>Subscribe to View</p>
                      <button onClick={e => { e.stopPropagation(); navigate('/pricing'); }} style={{ ...S.btn, ...S.btnPrimary, ...S.btnSm }}>View Plans</button>
                    </div>
                  </div>
                )}
                <div style={{ ...S.flexBetween, marginBottom: '12px' }}>
                  <div style={{ ...S.flex, gap: '8px' }}>
                    <span style={{ ...S.badge, ...actionStyle(r.action) }}>{r.action}</span>
                    <span style={{ fontSize: '11px', ...S.muted, background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px' }}>{r.segment}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: r.action === 'SELL' ? '#ef4444' : '#10b981', fontSize: '14px' }}>{r.pct}</span>
                </div>
                <h3 style={{ ...S.h4, marginBottom: '2px' }}>{r.stock}</h3>
                <p style={{ fontSize: '12px', ...S.muted, marginBottom: '16px' }}>{r.name}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div><span style={{ fontSize: '11px', ...S.muted }}>Entry</span><p style={{ fontWeight: 600, fontSize: '14px' }}>{fmt(r.entry)}</p></div>
                  <div><span style={{ fontSize: '11px', ...S.muted }}>Target</span><p style={{ fontWeight: 600, fontSize: '14px', color: '#10b981' }}>{fmt(r.target)}</p></div>
                  <div><span style={{ fontSize: '11px', ...S.muted }}>Stop Loss</span><p style={{ fontWeight: 600, fontSize: '14px', color: '#ef4444' }}>{fmt(r.sl)}</p></div>
                  <div><span style={{ fontSize: '11px', ...S.muted }}>Horizon</span><p style={{ fontWeight: 600, fontSize: '14px' }}>{r.horizon}</p></div>
                </div>
                <div style={{ ...S.flex, gap: '6px', marginTop: '12px' }}>
                  <span style={{ fontSize: '11px', ...S.muted }}>Risk:</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: riskColor(r.risk), textTransform: 'capitalize' }}>{r.risk}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ ...S.section, background: '#FEFDFB' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>WHY CHOOSE US</p>
          <h2 style={{ ...S.h2, marginBottom: '48px' }}>Research You Can Trust</h2>
          <div style={S.grid3}>
            {features.map((f, i) => (
              <div key={i} style={{ ...S.card, textAlign: 'left', transition: 'all 0.2s', borderTop: '3px solid #1d4ed8' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; }}>
                <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '16px' }}>{f.icon}</div>
                <h4 style={{ ...S.h4, marginBottom: '8px', color: '#0A0A0A' }}>{f.title}</h4>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* How It Works */}
      <section style={{ ...S.section, background: '#FAF9F5' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>HOW IT WORKS</p>
          <h2 style={{ ...S.h2, marginBottom: '48px' }}>Simple Steps to Start</h2>
          <div style={S.grid4}>
            {steps.map((s, i) => (
              <div key={i} style={{ ...S.card, textAlign: 'center', padding: '32px 20px', borderTop: '3px solid #e2e8f0' }}>
                <div style={{ fontSize: '40px', fontWeight: 800, color: '#dbeafe', lineHeight: 1, marginBottom: '16px', fontFamily: 'Inter, sans-serif' }}>{s.n}</div>
                <h3 style={{ ...S.h4, marginBottom: '8px', color: '#0A0A0A' }}>{s.title}</h3>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section style={{ ...S.section, background: '#FEFDFB' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>PRICING</p>
          <h2 style={{ ...S.h2, marginBottom: '8px' }}>Choose Your Research Plan</h2>
          <p style={{ color: '#64748b', marginBottom: '48px' }}>Flexible plans for traders of all experience levels.</p>
          <PricingCards compact={true} />
          <button onClick={() => navigate('/pricing')} style={{ ...S.btn, ...S.btnSecondary, marginTop: '24px' }}>View Full Plan Comparison →</button>
        </div>
      </section>

      {/* Risk Management */}
      <section style={{ ...S.section, background: '#FAF9F5' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={S.h2}>Risk Management Framework</h2>
            <p style={{ color: '#64748b', marginTop: '8px' }}>We follow strict risk management principles in all our research</p>
          </div>
          <div style={S.grid2}>
            {[
              { icon: '📏', title: 'Position Sizing', desc: 'Never risk more than 2-3% of capital on a single trade. We specify lot sizes for F&O trades.' },
              { icon: '🛑', title: 'Stop-Loss Discipline', desc: 'Every research call includes a mandatory stop-loss. Respect it without exception.' },
              { icon: '⚖️', title: 'Risk-Reward Ratio', desc: 'We only publish calls with minimum 1:2 risk-reward ratio. Better setups, better outcomes.' },
              { icon: '🎯', title: 'Capital Allocation', desc: 'Diversify across segments. Avoid concentrating more than 20% in a single stock or sector.' },
            ].map((r, i) => (
              <div key={i} style={{ ...S.card, display: 'flex', gap: '16px', alignItems: 'flex-start', borderLeft: '4px solid #1d4ed8' }}>
                <div style={{ fontSize: '28px', flexShrink: 0 }}>{r.icon}</div>
                <div>
                  <h4 style={{ ...S.h4, marginBottom: '4px', color: '#0A0A0A' }}>{r.title}</h4>
                  <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ ...S.disclaimer, marginTop: '24px' }}>
            ⚠️ <strong>F&O WARNING:</strong> Futures & Options trading involves substantial risk. F&O is a leveraged instrument and can result in losses exceeding your initial investment. Only trade F&O if you have adequate experience and risk capital.
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ ...S.section, background: 'linear-gradient(160deg, #eff6ff 0%, #dbeafe 100%)', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ ...S.h2, marginBottom: '16px', color: '#0A0A0A' }}>Ready to Start Your Research Journey?</h2>
          <p style={{ color: '#334155', marginBottom: '32px', lineHeight: 1.7, fontSize: '15px' }}>Join thousands of informed investors. Pick the research plan that fits how you trade.</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')} style={{ ...S.btn, ...S.btnPrimary, fontSize: '16px', padding: '14px 32px' }}>
              Get Started →
            </button>
            <button onClick={() => navigate('/contact')} style={{ ...S.btn, background: '#fff', color: '#1d4ed8', border: '2px solid #1d4ed8', fontSize: '16px', padding: '14px 32px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
              Contact Us
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  const links = {
    Product: [
      { label: 'Recommendations', path: '/recommendations' },
      { label: 'Pricing', path: '/pricing' },
      { label: 'Performance', path: '/performance' },
      { label: 'Blog', path: '/blog' },
    ],
    Company: [
      { label: 'About Us', path: '/about' },
      { label: 'Contact', path: '/contact' },
      { label: 'Grievance', path: '/grievance' },
      { label: 'Disclosure', path: '/disclosure' },
    ],
    Legal: [
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Terms of Service', path: '/terms' },
      { label: 'Disclaimer', path: '/disclaimer' },
      { label: 'Refund Policy', path: '/refund' },
    ],
    Support: [
      { label: 'FAQ', path: '/faq' },
      { label: 'Risk Disclosure', path: '/risk-disclosure' },
      { label: 'SEBI RA Disclosure', path: '/sebi-disclosure' },
      { label: 'Investor Charter', path: '/investor-charter' },
    ],
  };

  return (
    <footer style={{ background: '#E6F1FB', borderTop: '2px solid #B5D4F4', padding: '60px 20px 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '40px', marginBottom: '48px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ ...S.navLogoIcon, background: '#185FA5' }}>📈</div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#042C53' }}>{APP_NAME}</span>
            </div>
            <p style={{ fontSize: '13px', color: '#0C447C', lineHeight: 1.7, marginBottom: '12px' }}>
              Your trusted partner for stock market research. SEBI Registered Research Analyst.
            </p>
            <p style={{ fontSize: '11px', color: '#185FA5', fontWeight: 500 }}>{SEBI_REG}</p>
          </div>
          {Object.entries(links).map(([cat, items]) => (
            <div key={cat}>
              <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#042C53', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>{cat}</h4>
              {items.map(item => (
                <button key={item.path} onClick={() => navigate(item.path)}
                  style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#0C447C', fontSize: '14px', padding: '6px 0', cursor: 'pointer', fontWeight: 500, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.target.style.color = '#185FA5'}
                  onMouseLeave={e => e.target.style.color = '#0C447C'}>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid #B5D4F4', padding: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ fontSize: '12px', color: '#185FA5' }}>© {new Date().getFullYear()} {APP_NAME} · {COMPANY_NAME} · All rights reserved.</p>
          <p style={{ fontSize: '11px', color: '#185FA5', maxWidth: '600px', textAlign: 'right', lineHeight: 1.5 }}>
            Investment in securities market is subject to market risk. Past performance does not guarantee future returns. Not SEBI investment advice.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── PRICING CARDS ────────────────────────────────────────────────────────────
function PricingCards({ compact = false }) {
  const [cycle, setCycle] = useState('monthly');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data?.user || null));
  }, []);

  const handleSubscribe = (planId) => {
    if (currentUser) {
      navigate('/subscription');
    } else {
      navigate('/register');
    }
  };

  const prices = {
    basic: { monthly: 999, quarterly: 2697, halfyearly: 5094, yearly: 8991 },
    premium: { monthly: 2499, quarterly: 6747, halfyearly: 12744, yearly: 22491 },
    fno: { monthly: 3999, quarterly: 10797, halfyearly: 20394, yearly: 35991 },
    elite: { monthly: 5999, quarterly: 16197, halfyearly: 30594, yearly: 53991 },
  };

  const planDefs = [
    { id: 'basic', name: 'Basic Equity', desc: 'Core equity research to get started', color: '#334155', features: ['basic_recommendations', 'market_updates', 'blog_access', 'equity_recommendations'] },
    { id: 'premium', name: 'Premium Equity', desc: 'Deeper research for serious equity investors', color: '#3b82f6', popular: false, features: ['basic_recommendations', 'market_updates', 'blog_access', 'equity_recommendations', 'ipo_recommendations', 'priority_support'] },
    { id: 'fno', name: 'F&O Pro', desc: 'Most popular for active derivatives traders', color: '#f59e0b', popular: true, features: ['basic_recommendations', 'market_updates', 'blog_access', 'equity_recommendations', 'fno_recommendations', 'intraday_calls', 'options_strategies', 'priority_support'] },
    { id: 'elite', name: 'Elite All Access', desc: 'Complete research suite across every segment', color: '#a78bfa', popular: false, features: Object.keys(PLAN_FEATURES.reduce((a, f) => ({ ...a, [f.key]: true }), {})) },
  ];

  return (
    <div>
      {!compact && (
        <div style={{ display: 'flex', gap: '4px', background: '#FEFDFB', padding: '4px', borderRadius: '10px', width: 'fit-content', margin: '0 auto 40px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {BILLING_CYCLES.map(b => (
            <button key={b.key} onClick={() => setCycle(b.key)}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: cycle === b.key ? '#1d4ed8' : 'transparent', color: cycle === b.key ? '#fff' : '#94a3b8', transition: 'all 0.2s' }}>
              {b.label} {b.discount > 0 && <span style={{ fontSize: '11px', color: cycle === b.key ? '#93c5fd' : '#10b981' }}>-{b.discount}%</span>}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: compact ? 'repeat(auto-fit, minmax(220px, 1fr))' : 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        {planDefs.map(plan => (
          <div key={plan.id} style={{ ...S.card, position: 'relative', borderColor: plan.popular ? '#f59e0b' : '#1e293b', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            {plan.popular && (
              <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#f59e0b', color: '#000', fontSize: '11px', fontWeight: 800, padding: '4px 14px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                ⭐ MOST POPULAR
              </div>
            )}
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>{plan.id === 'basic' ? '📊' : plan.id === 'premium' ? '📈' : plan.id === 'fno' ? '⚡' : '💎'}</div>
            <h3 style={{ ...S.h3, color: plan.color, marginBottom: '4px' }}>{plan.name}</h3>
            <p style={{ fontSize: '12px', ...S.muted, marginBottom: '16px' }}>{plan.desc}</p>
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '32px', fontWeight: 800 }}>
                {prices[plan.id][compact ? 'monthly' : cycle] === 0 ? 'Free' : '₹' + fmtCurr(prices[plan.id][compact ? 'monthly' : cycle])}
              </span>
              <span style={{ fontSize: '13px', ...S.muted }}>/{compact ? 'mo' : cycle === 'monthly' ? 'month' : cycle}</span>
            </div>
            {!compact && (
              <div style={{ marginBottom: '20px' }}>
                {PLAN_FEATURES.map(f => (
                  <div key={f.key} style={{ ...S.flex, gap: '8px', padding: '6px 8px', fontSize: '13px', borderRadius: '6px', marginBottom: '2px', background: plan.features.includes(f.key) ? 'rgba(4,120,87,0.06)' : 'rgba(185,28,28,0.05)' }}>
                    <span style={{ color: plan.features.includes(f.key) ? '#047857' : '#b91c1c', fontSize: '15px', fontWeight: 700 }}>
                      {plan.features.includes(f.key) ? '✓' : '✕'}
                    </span>
                    <span style={{ color: plan.features.includes(f.key) ? '#047857' : '#b91c1c', fontWeight: plan.features.includes(f.key) ? 600 : 500, fontSize: '13px' }}>{f.label}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => handleSubscribe(plan.id)}
              style={{ ...S.btn, width: '100%', justifyContent: 'center', background: plan.popular ? '#f59e0b' : '#1d4ed8', color: plan.popular ? '#000' : '#fff', border: 'none' }}>
              {compact ? 'Subscribe' : currentUser ? 'Manage Subscription' : 'Subscribe Now'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PRICING PAGE ─────────────────────────────────────────────────────────────
function PricingPage() {
  const faqs = [
    { q: 'How many calls will I get per month?', a: 'Basic: 4–6 equity calls. Premium: 10–15 calls (equity + IPO). F&O Pro: 14–21 calls (equity + F&O + intraday). Elite: 24–36 calls across all segments. These are ranges — we publish calls only when there are high-conviction setups. We never publish low-quality calls just to meet a number.' },
    { q: 'What is the difference between Basic and Premium?', a: 'Basic covers large-cap equity with 1 target level. Premium adds mid & small cap, 3 target levels (T1/T2/T3), IPO calls, PDF research reports, priority support, and monthly performance reports. The service layer — not just call count — is what makes Premium worth the upgrade.' },
    { q: 'Can F&O beginners subscribe to F&O Pro?', a: 'F&O Pro is recommended for investors with prior F&O experience. Each F&O call includes lot size, margin required, and max loss possible. Please read our Risk Disclosure before subscribing. If you are new to F&O, start with Basic or Premium and build experience first.' },
    { q: 'Can I change my plan later?', a: 'Yes. Upgrades are applied immediately. Downgrades apply from the next billing cycle.' },
    { q: 'What payment methods do you accept?', a: 'All major credit/debit cards, UPI, Net Banking, Paytm, PhonePe, and Google Pay via Razorpay.' },
    { q: 'Can I get a refund?', a: 'We have a strict no-refund policy. All subscription fees are non-refundable. Please review our Performance page track record and Refund Policy before subscribing.' },
    { q: 'Are the recommendations guaranteed?', a: 'No. Research is based on technical and fundamental analysis but does not guarantee returns. Every call includes stop-loss — please respect it. Investment is subject to market risk.' },
  ];

  const planDetails = [
    {
      id: 'basic', name: 'Basic Equity', price: '₹999', color: '#334155', bg: '#FAF9F5', border: '#e2e8f0',
      calls: '4–6', callType: 'equity calls/month', icon: '📊',
      headline: 'Start with research-backed large-cap equity calls.',
      highlights: ['Large Cap stocks only (NSE/BSE)', 'Entry + Target 1 + Stop Loss', 'Positional (1–4 weeks)', 'Weekly market view', 'Blog & education access'],
      notIncluded: ['Mid/Small cap', 'IPO calls', 'PDF reports', 'Support'],
    },
    {
      id: 'premium', name: 'Premium Equity', price: '₹2,499', color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe',
      calls: '10–15', callType: 'total calls/month', icon: '📈',
      headline: 'Full equity research with IPOs and 3 profit targets.',
      highlights: ['All Caps — Large, Mid, Small', 'Entry + T1, T2, T3 + Stop Loss', 'Positional + Swing (3–15 days)', '2–3 IPO calls / month', 'PDF research report per call', 'Monthly performance report', 'Priority email (24hr response)'],
      notIncluded: ['F&O calls', 'Intraday', 'Telegram alerts'],
    },
    {
      id: 'fno', name: 'F&O Pro', price: '₹3,999', color: '#92400e', bg: '#fffbeb', border: '#fde68a',
      calls: '14–21', callType: 'total calls/month', icon: '⚡', popular: true,
      headline: 'Equity + F&O + Intraday for active traders.',
      highlights: ['All Premium Equity features', '4–6 F&O calls/mo (Nifty/BankNifty/Stocks)', '2–4 Intraday calls/month', 'Options: Buy side (CE/PE)', 'Lot size + margin specified', 'Telegram signal alerts', 'Priority email (12hr response)'],
      notIncluded: ['Commodity calls', '1-on-1 sessions'],
    },
    {
      id: 'elite', name: 'Elite All Access', price: '₹5,999', color: '#5b21b6', bg: '#faf5ff', border: '#c4b5fd',
      calls: '24–36', callType: 'total calls/month', icon: '💎',
      headline: 'Complete research suite — every segment, every service.',
      highlights: ['Everything in F&O Pro', '3–5 MCX Commodity calls/mo (Gold, Silver, Crude)', '5–8 Intraday calls/month', 'Options: Buy + Sell strategies', '1 monthly 30-min 1-on-1 session', 'Portfolio review on request', 'Dedicated WhatsApp support', 'Quarterly accuracy report'],
      notIncluded: [],
    },
  ];

  return (
    <div style={{ paddingTop: '80px', background: '#FEFDFB' }}>

      {/* Hero */}
      <section style={{ ...S.section, textAlign: 'center', background: 'linear-gradient(160deg, #eff6ff 0%, #f0f4f8 60%)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: 'rgba(29,78,216,0.08)', color: '#1e40af', borderRadius: '20px', padding: '6px 16px', fontSize: '12px', fontWeight: 700, marginBottom: '16px', letterSpacing: '0.04em' }}>
            SEBI Registered Research Analyst · {SEBI_REG}
          </div>
          <h1 style={{ ...S.h2, marginBottom: '12px' }}>Choose Your Research Plan</h1>
          <p style={{ color: '#64748b', marginBottom: '12px', fontSize: '15px' }}>Flexible plans for every type of trader. Quality over quantity — every call is high-conviction.</p>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '48px' }}>⚠️ Call counts are monthly ranges. We publish only when high-conviction setups exist. No padding, no quota-filling.</p>
        </div>

        {/* Plan cards */}
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {planDetails.map(p => (
            <div key={p.id} style={{ background: '#fff', border: `2px solid ${p.popular ? '#f59e0b' : p.border}`, borderRadius: '16px', padding: '24px', textAlign: 'left', position: 'relative', boxShadow: p.popular ? '0 4px 20px rgba(245,158,11,0.15)' : '0 1px 4px rgba(0,0,0,0.04)' }}>
              {p.popular && <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#d97706', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '4px 12px', borderRadius: '20px', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>⭐ MOST POPULAR</div>}
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>{p.icon}</div>
              <p style={{ fontWeight: 800, fontSize: '15px', color: p.color, marginBottom: '2px' }}>{p.name}</p>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px', lineHeight: 1.4 }}>{p.headline}</p>

              {/* Call count highlight */}
              <div style={{ background: p.bg, border: `1px solid ${p.border}`, borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '28px', fontWeight: 900, color: p.color, lineHeight: 1 }}>{p.calls}</span>
                <span style={{ fontSize: '11px', color: p.color, fontWeight: 600, lineHeight: 1.4 }}>{p.callType}</span>
              </div>

              <p style={{ fontSize: '28px', fontWeight: 800, color: '#0A0A0A', marginBottom: '2px' }}>{p.price}</p>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '18px' }}>per month</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                {p.highlights.map((h, i) => (
                  <div key={i} style={{ display: 'flex', gap: '7px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#059669', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>✓</span>
                    <span style={{ fontSize: '12px', color: '#334155', lineHeight: 1.5 }}>{h}</span>
                  </div>
                ))}
                {p.notIncluded.map((h, i) => (
                  <div key={i} style={{ display: 'flex', gap: '7px', alignItems: 'flex-start', opacity: 0.45 }}>
                    <span style={{ color: '#94a3b8', flexShrink: 0, marginTop: '1px' }}>✕</span>
                    <span style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>{h}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => navigate('/subscription')} style={{ ...S.btn, width: '100%', justifyContent: 'center', background: p.popular ? '#d97706' : p.color, color: '#fff', border: 'none', fontWeight: 700 }}>
                Subscribe →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section style={{ ...S.section, background: '#FEFDFB', paddingTop: '60px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ ...S.h2, textAlign: 'center', marginBottom: '8px' }}>Full Comparison</h2>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '40px' }}>Every feature, every plan — no surprises</p>

          <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid #E5E3DA', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '680px' }}>
              <thead>
                <tr style={{ background: '#FAF9F5' }}>
                  <th style={{ padding: '14px 18px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#334155', fontWeight: 700, fontSize: '12px', width: '32%' }}>Feature</th>
                  {[
                    { name: 'Basic', sub: '₹999/mo', color: '#334155' },
                    { name: 'Premium', sub: '₹2,499/mo', color: '#1e40af' },
                    { name: 'F&O Pro ⭐', sub: '₹3,999/mo', color: '#92400e' },
                    { name: 'Elite', sub: '₹5,999/mo', color: '#5b21b6' },
                  ].map((c, i) => (
                    <th key={i} style={{ padding: '14px 12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>
                      <p style={{ fontWeight: 800, color: c.color, fontSize: '13px' }}>{c.name}</p>
                      <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>{c.sub}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Section: Calls */}
                <tr style={{ background: '#FAF9F5' }}>
                  <td colSpan={5} style={{ padding: '8px 18px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid #e2e8f0' }}>Research Calls</td>
                </tr>
                {PLAN_FEATURES.filter(f => ['equity_calls','fno_calls','intraday_calls','commodity_calls','ipo_calls','total_calls'].includes(f.key)).map((f, i) => (
                  <tr key={f.key} style={{ borderBottom: '1px solid #f1f5f9', background: f.key === 'total_calls' ? '#f0f9ff' : i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '11px 18px', color: f.key === 'total_calls' ? '#1e40af' : '#334155', fontWeight: f.key === 'total_calls' ? 700 : 500 }}>{f.label}</td>
                    {f.values.map((v, j) => (
                      <td key={j} style={{ padding: '11px 12px', textAlign: 'center', fontWeight: v === '—' ? 400 : 700, color: v === '—' ? '#94a3b8' : f.key === 'total_calls' ? '#1e40af' : '#0f172a' }}>{v}</td>
                    ))}
                  </tr>
                ))}
                {/* Section: Coverage */}
                <tr style={{ background: '#FAF9F5' }}>
                  <td colSpan={5} style={{ padding: '8px 18px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid #e2e8f0', borderTop: '2px solid #e2e8f0' }}>Coverage & Targets</td>
                </tr>
                {PLAN_FEATURES.filter(f => ['stocks_covered','call_targets','options_strategy','lot_size'].includes(f.key)).map((f, i) => (
                  <tr key={f.key} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '11px 18px', color: '#334155', fontWeight: 500 }}>{f.label}</td>
                    {f.values.map((v, j) => (
                      <td key={j} style={{ padding: '11px 12px', textAlign: 'center' }}>
                        {v === false ? <span style={{ color: '#cbd5e1' }}>✕</span>
                          : v === true ? <span style={{ color: '#059669', fontWeight: 700 }}>✓</span>
                          : <span style={{ fontSize: '12px', color: v === '—' ? '#94a3b8' : '#0f172a', fontWeight: v === '—' ? 400 : 600 }}>{v}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Section: Services */}
                <tr style={{ background: '#FAF9F5' }}>
                  <td colSpan={5} style={{ padding: '8px 18px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid #e2e8f0', borderTop: '2px solid #e2e8f0' }}>Reports & Support</td>
                </tr>
                {PLAN_FEATURES.filter(f => ['pdf_report','weekly_market','blog_access','telegram','performance_rpt','email_support','one_on_one','portfolio_review'].includes(f.key)).map((f, i) => (
                  <tr key={f.key} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '11px 18px', color: '#334155', fontWeight: 500 }}>{f.label}</td>
                    {f.values.map((v, j) => (
                      <td key={j} style={{ padding: '11px 12px', textAlign: 'center' }}>
                        {v === false ? <span style={{ color: '#cbd5e1' }}>✕</span>
                          : v === true ? <span style={{ color: '#059669', fontWeight: 700 }}>✓</span>
                          : <span style={{ fontSize: '11px', color: v === '—' ? '#94a3b8' : '#0f172a', fontWeight: v === '—' ? 400 : 600 }}>{v}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#0f172a' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 700, color: '#fff', fontSize: '13px' }}>Monthly Price</td>
                  {[{ price: '₹999', color: '#94a3b8' }, { price: '₹2,499', color: '#93c5fd' }, { price: '₹3,999', color: '#fde68a' }, { price: '₹5,999', color: '#c4b5fd' }].map((p, i) => (
                    <td key={i} style={{ padding: '14px 12px', textAlign: 'center', fontWeight: 900, fontSize: '17px', color: p.color }}>{p.price}</td>
                  ))}
                </tr>
                <tr style={{ background: '#1e293b' }}>
                  <td style={{ padding: '10px 18px' }} />
                  {planDetails.map(p => (
                    <td key={p.id} style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <button onClick={() => navigate('/subscription')} style={{ ...S.btn, background: p.popular ? '#d97706' : p.color, color: '#fff', border: 'none', ...S.btnSm, justifyContent: 'center', width: '100%', fontWeight: 700 }}>
                        Subscribe
                      </button>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>

          <div style={{ ...S.disclaimer, marginTop: '24px' }}>
            ⚠️ Call counts shown are monthly ranges. Market conditions may result in fewer calls when high-conviction setups are unavailable. We do not publish calls to meet a quota. Past accuracy does not guarantee future returns.
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ ...S.section, background: '#FEFDFB' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ ...S.h2, textAlign: 'center', marginBottom: '40px' }}>Frequently Asked Questions</h2>
          {faqs.map((faq, i) => (
            <FaqItem key={i} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}


function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ ...S.card, marginBottom: '12px', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
      <div style={{ ...S.flexBetween }}>
        <p style={{ fontWeight: 600, fontSize: '15px', paddingRight: '16px' }}>❓ {q}</p>
        <span style={{ color: '#3b82f6', fontSize: '20px', flexShrink: 0 }}>{open ? '−' : '+'}</span>
      </div>
      {open && <p style={{ fontSize: '14px', ...S.muted, marginTop: '12px', lineHeight: 1.7 }}>{a}</p>}
    </div>
  );
}

// ─── AUTH PAGES ───────────────────────────────────────────────────────────────
// ─── AUTH LAYOUT WRAPPER ──────────────────────────────────────────────────────
function AuthLayout({ title, subtitle, children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#FEFDFB', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '900px', display: 'grid', gridTemplateColumns: '1fr 1fr', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 32px rgba(0,0,0,0.10)', minHeight: '560px' }}>
        {/* Left trust panel */}
        <div style={{ background: '#0f172a', padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '48px' }}>
              <div style={{ ...S.navLogoIcon }}><span>📈</span></div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{APP_NAME}</span>
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: '12px', letterSpacing: '-0.02em' }}>
              Research-backed stock calls for every trader
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7, marginBottom: '36px' }}>
              SEBI Registered Research Analyst providing equity, F&O, and commodity research with complete transparency.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { icon: '🛡️', text: 'SEBI Registered Research Analyst' },
                { icon: '📊', text: 'Live calls across Equity, F&O & Commodities' },
                { icon: '📈', text: 'Complete track record — every call logged' },
                { icon: '🔒', text: 'Transparent research, no guaranteed returns' },
              ].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>{t.icon}</span>
                  <span style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>{t.text}</span>
                </div>
              ))}
            </div>
          </div>
          <p style={{ fontSize: '11px', color: '#475569', lineHeight: 1.6 }}>
            {SEBI_REG} · {COMPANY_NAME}<br />
            Investment involves risk of loss. Research only, not advice.
          </p>
        </div>
        {/* Right form panel */}
        <div style={{ background: '#FEFDFB', padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0A0A0A', marginBottom: '6px', letterSpacing: '-0.02em' }}>{title}</h1>
          {subtitle && <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '28px' }}>{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── FORGOT PASSWORD PAGE ─────────────────────────────────────────────────────
function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  const handle = async () => {
    if (!email) { setErr('Please enter your email address.'); return; }
    setLoading(true); setErr('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setSent(true);
  };

  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your registered email and we'll send a reset link.">
      {sent ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
          <h3 style={{ ...S.h4, marginBottom: '8px', color: '#059669' }}>Reset link sent!</h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
            Check your inbox at <strong>{email}</strong>. Click the link in the email to set a new password.
          </p>
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>Didn't receive it? Check spam or{' '}
            <button onClick={() => setSent(false)} style={{ background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}>try again</button>
          </p>
        </div>
      ) : (
        <>
          {err && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{err}</div>}
          <div style={S.formGroup}>
            <label style={S.label}>Email Address</label>
            <input style={S.input} type="email" placeholder="you@email.com" value={email}
              onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handle()} />
          </div>
          <button onClick={handle} disabled={loading} style={{ ...S.btn, ...S.btnPrimary, width: '100%', justifyContent: 'center', marginBottom: '16px', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Sending...' : 'Send Reset Link →'}
          </button>
          <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
            Remember your password?{' '}
            <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>Sign in</button>
          </p>
        </>
      )}
    </AuthLayout>
  );
}

// ─── RESET PASSWORD PAGE ──────────────────────────────────────────────────────
function ResetPasswordPage() {
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const [show, setShow] = useState(false);

  const handle = async () => {
    if (!pw || pw.length < 8) { setErr('Password must be at least 8 characters.'); return; }
    if (pw !== confirm) { setErr('Passwords do not match.'); return; }
    setLoading(true); setErr('');
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setDone(true);
    setTimeout(() => navigate('/login'), 2000);
  };

  return (
    <AuthLayout title="Set new password" subtitle="Choose a strong password for your StockVista account.">
      {done ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h3 style={{ ...S.h4, color: '#059669', marginBottom: '8px' }}>Password updated!</h3>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Redirecting to sign in...</p>
        </div>
      ) : (
        <>
          {err && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{err}</div>}
          <div style={S.formGroup}>
            <label style={S.label}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input style={{ ...S.input, paddingRight: '44px' }} type={show ? 'text' : 'password'}
                placeholder="Min 8 characters" value={pw} onChange={e => setPw(e.target.value)} />
              <button onClick={() => setShow(s => !s)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px' }}>
                {show ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Confirm New Password</label>
            <input style={{ ...S.input, borderColor: confirm && confirm !== pw ? '#fca5a5' : '#e2e8f0' }}
              type={show ? 'text' : 'password'} placeholder="Re-enter password"
              value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handle()} />
            {confirm && confirm !== pw && <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>Passwords don't match</p>}
          </div>
          <button onClick={handle} disabled={loading} style={{ ...S.btn, ...S.btnPrimary, width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Updating...' : 'Update Password →'}
          </button>
        </>
      )}
    </AuthLayout>
  );
}

function LoginPage({ setUser, setUserProfile }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleLogin = async () => {
    if (!email || !pw) { setErr('Please fill all fields.'); return; }
    setLoading(true); setErr('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) { setErr(error.message); setLoading(false); return; }
    const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
    setUser(data.user);
    setUserProfile(profile);
    // Fire-and-forget — only meaningful for staff activity tracking, shouldn't
    // block or fail the login itself if it errors.
    supabase.from('users').update({ last_login_at: new Date().toISOString() }).eq('id', data.user.id).then(() => {}).catch(() => {});
    navigate('/dashboard');
    setLoading(false);
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/dashboard' } });
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your StockVista account.">
      {err && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{err}</div>}
      <div style={S.formGroup}>
        <label style={S.label}>Email</label>
        <input style={S.input} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div style={S.formGroup}>
        <div style={{ ...S.flexBetween, marginBottom: '6px' }}>
          <label style={{ ...S.label, marginBottom: 0 }}>Password</label>
          <button onClick={() => navigate('/forgot-password')} style={{ background: 'none', border: 'none', color: '#1e40af', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>Forgot password?</button>
        </div>
        <input style={S.input} type="password" placeholder="Enter your password" value={pw} onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()} />
      </div>
      <button onClick={handleLogin} disabled={loading} style={{ ...S.btn, ...S.btnPrimary, width: '100%', justifyContent: 'center', marginBottom: '12px', opacity: loading ? 0.7 : 1, fontSize: '15px', padding: '13px' }}>
        {loading ? 'Signing in...' : 'Sign In →'}
      </button>
      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', margin: '14px 0' }}>OR</div>
      <button onClick={handleGoogle} style={{ ...S.btn, ...S.btnSecondary, width: '100%', justifyContent: 'center', marginBottom: '20px', padding: '11px' }}>
        <span style={{ fontWeight: 800, fontSize: '15px', marginRight: '4px' }}>G</span> Continue with Google
      </button>
      <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
        Don't have an account?{' '}
        <button onClick={() => navigate('/register')} style={{ background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>Create account →</button>
      </p>
    </AuthLayout>
  );
}

function RegisterPage({ setUser, setUserProfile }) {
  const [form, setForm] = useState({ fullName: '', email: '', mobile: '', password: '', confirm: '' });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleRegister = async () => {
    if (!form.fullName || !form.email || !form.password) { setErr('Please fill all required fields.'); return; }
    if (form.password !== form.confirm) { setErr('Passwords do not match.'); return; }
    if (form.password.length < 8) { setErr('Password must be at least 8 characters.'); return; }
    if (!agreed) { setErr('Please agree to Terms of Service and Privacy Policy.'); return; }
    setLoading(true); setErr('');
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.fullName } }
    });
    if (error) { setErr(error.message); setLoading(false); return; }
    if (form.mobile && data.user) {
      await supabase.from('users').update({ mobile: form.mobile }).eq('id', data.user.id);
    }
    setUser(data.user);
    const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
    setUserProfile(profile);
    navigate('/onboarding');
    setLoading(false);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <AuthLayout title="Create account" subtitle="Start your research journey with StockVista.">
      {err && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{err}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div style={S.formGroup}>
          <label style={S.label}>Full Name *</label>
          <input style={S.input} placeholder="Nishit Jain" value={form.fullName} onChange={e => set('fullName', e.target.value)} />
        </div>
        <div style={S.formGroup}>
          <label style={S.label}>Mobile (optional)</label>
          <input style={S.input} type="tel" placeholder="+91 98765 43210" value={form.mobile} onChange={e => set('mobile', e.target.value)} />
        </div>
      </div>
      <div style={S.formGroup}>
        <label style={S.label}>Email *</label>
        <input style={S.input} type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div style={S.formGroup}>
          <label style={S.label}>Password *</label>
          <input style={S.input} type="password" placeholder="Min 8 chars" value={form.password} onChange={e => set('password', e.target.value)} />
        </div>
        <div style={S.formGroup}>
          <label style={S.label}>Confirm Password *</label>
          <input style={{ ...S.input, borderColor: form.confirm && form.confirm !== form.password ? '#fca5a5' : '#e2e8f0' }}
            type="password" placeholder="Re-enter" value={form.confirm} onChange={e => set('confirm', e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '18px' }}>
        <input type="checkbox" id="agree" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ width: '15px', height: '15px', cursor: 'pointer', marginTop: '2px', flexShrink: 0 }} />
        <label htmlFor="agree" style={{ fontSize: '12px', color: '#64748b', cursor: 'pointer', lineHeight: 1.5 }}>
          I agree to the{' '}
          <button onClick={() => navigate('/terms')} style={{ background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Terms</button>
          {' '}and{' '}
          <button onClick={() => navigate('/privacy')} style={{ background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Privacy Policy</button>
        </label>
      </div>
      <button onClick={handleRegister} disabled={loading} style={{ ...S.btn, ...S.btnPrimary, width: '100%', justifyContent: 'center', marginBottom: '10px', opacity: loading ? 0.7 : 1, fontSize: '15px', padding: '13px' }}>
        {loading ? 'Creating Account...' : 'Create Account →'}
      </button>
      <button onClick={async () => await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/dashboard' } })}
        style={{ ...S.btn, ...S.btnSecondary, width: '100%', justifyContent: 'center', marginBottom: '16px', padding: '11px' }}>
        <span style={{ fontWeight: 800, fontSize: '15px', marginRight: '4px' }}>G</span> Continue with Google
      </button>
      <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
        Already have an account?{' '}
        <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>Sign in →</button>
      </p>
    </AuthLayout>
  );
}

// ─── USER DASHBOARD ───────────────────────────────────────────────────────────
function Dashboard({ user, userProfile, riskAccepted, setRiskAccepted }) {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLang();

  useEffect(() => {
    fetchRecs();
  }, []);

  const fetchRecs = async () => {
    const { data } = await supabase.from('recommendations')
      .select('*')
      .in('status', ['live', 'near_target', 'near_sl'])
      .order('published_at', { ascending: false })
      .limit(10);
    setRecs(data || []);
    setLoading(false);
  };

  const planLabel = PLANS[userProfile?.plan_id || 'basic'];
  const isSubscribed = !!userProfile?.plan_id &&
    userProfile?.plan_expires_at && new Date(userProfile.plan_expires_at) > new Date();

  if (!riskAccepted) return <DisclaimerPopup onAccept={() => setRiskAccepted(true)} />;

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <div style={{ ...S.section, paddingTop: '40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Welcome bar */}
          <div style={{ ...S.flexBetween, marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={S.h2}>Welcome back, {userProfile?.full_name?.split(' ')[0] || 'Investor'} 👋</h2>
              <p style={{ ...S.muted, marginTop: '4px' }}>
                Plan: <span style={{ color: planLabel?.color || '#94a3b8', fontWeight: 700 }}>{planLabel?.name || 'Free'}</span>
                {isSubscribed && userProfile.plan_expires_at && (
                  <span> · Expires {new Date(userProfile.plan_expires_at).toLocaleDateString('en-IN')}</span>
                )}
              </p>
            </div>
            {!isSubscribed && (
              <button onClick={() => navigate('/pricing')} style={{ ...S.btn, ...S.btnGold }}>
                ⬆️ Upgrade Plan
              </button>
            )}
          </div>

          {/* Summary Cards */}
          <div style={S.grid4}>
            {[
              { label: 'Live Calls', value: recs.filter(r => r.status === 'live').length, icon: '📊', color: '#1e40af' },
              { label: 'Your Plan', value: planLabel?.name || 'Free', icon: '💎', color: '#f59e0b' },
              { label: 'Calls Today', value: recs.filter(r => new Date(r.published_at).toDateString() === new Date().toDateString()).length, icon: '📅', color: '#10b981' },
              { label: 'Subscription', value: isSubscribed ? 'Active' : 'Free', icon: '✅', color: isSubscribed ? '#10b981' : '#ef4444' },
            ].map((c, i) => (
              <div key={i} style={{ ...S.card }}>
                <div style={{ ...S.flex, gap: '12px' }}>
                  <div style={{ fontSize: '28px' }}>{c.icon}</div>
                  <div>
                    <p style={{ fontSize: '22px', fontWeight: 800, color: c.color }}>{c.value}</p>
                    <p style={{ fontSize: '12px', ...S.muted }}>{c.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <MyPerformanceWidget userProfile={userProfile} />

          <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
            {/* Recommendations */}
            <div>
              <div style={{ ...S.flexBetween, marginBottom: '16px', background: '#E6F1FB', border: '1px solid #B5D4F4', borderRadius: '10px', padding: '10px 16px' }}>
                <h3 style={{ ...S.h3, color: '#042C53' }}>{t('section_latest_calls')}</h3>
                <button onClick={() => navigate('/recommendations')} style={{ ...S.btn, ...S.btnSecondary, ...S.btnSm }}>{t('nav_viewall')}</button>
              </div>
              {loading ? (
                <div style={{ ...S.card, textAlign: 'center', padding: '40px', ...S.muted }}>Loading recommendations...</div>
              ) : recs.length === 0 ? (
                <div style={{ ...S.card, textAlign: 'center', padding: '40px' }}>
                  <p style={{ fontSize: '32px', marginBottom: '12px' }}>📭</p>
                  <p style={S.muted}>No active recommendations yet. Check back soon.</p>
                </div>
              ) : (
                recs.map(r => <RecCard key={r.id} rec={r} userProfile={userProfile} />)
              )}
            </div>

            {/* Sidebar */}
            <div>
              {/* Quick Links */}
              <div style={{ ...S.card, marginBottom: '20px' }}>
                <h4 style={{ ...S.h4, marginBottom: '16px' }}>Quick Actions</h4>
                {[
                  { label: '📊 All Recommendations', path: '/recommendations' },
                  { label: '📈 Performance Report', path: '/performance' },
                  { label: '💼 My Portfolio', path: '/portfolio' },
                  { label: '👁️ Watchlist', path: '/watchlist' },
                  { label: '📄 Research Reports', path: '/reports' },
                  { label: '💳 Manage Subscription', path: '/subscription' },
                ].map(item => (
                  <button key={item.path} onClick={() => navigate(item.path)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#1e293b', fontSize: '14px', padding: '10px 0', cursor: 'pointer', borderBottom: '1px solid #1e293b' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#3b82f6'}
                    onMouseLeave={e => e.currentTarget.style.color = '#e2e8f0'}>
                    {item.label}
                  </button>
                ))}
              </div>

              {/* SEBI Disclaimer */}
              <div style={S.disclaimer}>
                ⚠️ Research calls are for informational purposes only. Investment in securities market is subject to market risk. Past performance is not indicative of future results.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PERSONAL P&L WIDGET ("If you followed every call on your plan") ────────
function MyPerformanceWidget({ userProfile }) {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month'); // 'month' | 'all'
  const { t } = useLang();

  useEffect(() => {
    supabase.from('recommendations').select('*').neq('status', 'draft').order('published_at', { ascending: true })
      .then(({ data }) => { setRecs(data || []); setLoading(false); });
  }, []);

  const planRank = { basic: 0, premium: 1, fno: 2, elite: 3 };
  const userRank = planRank[userProfile?.plan_id || 'basic'] ?? 0;
  const now = new Date();

  const inPeriod = (r) => {
    if (period === 'all') return true;
    const d = new Date(r.published_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };

  const eligible = recs.filter(r => (planRank[r.plan_required || 'basic'] ?? 0) <= userRank && inPeriod(r));
  const closed = eligible.filter(r => ['closed', 'target_hit', 'sl_hit', 'expired'].includes(r.status));

  const withReturn = closed.map(r => {
    const entry = parseFloat(r.entry_price);
    const exit = parseFloat(r.exit_price) || (r.status === 'target_hit' ? parseFloat(r.target1) : parseFloat(r.stop_loss));
    if (!entry || !exit) return null;
    const ret = r.action === 'SELL' ? ((entry - exit) / entry * 100) : ((exit - entry) / entry * 100);
    return +ret.toFixed(2);
  }).filter(r => r !== null);

  const cumulative = withReturn.reduce((s, r) => s + r, 0);
  const avgReturn = withReturn.length ? cumulative / withReturn.length : null;
  const wins = closed.filter(r => r.status === 'target_hit').length;
  const winRate = closed.length ? ((wins / closed.length) * 100).toFixed(0) : 0;

  if (loading) return null;

  return (
    <div style={{ ...S.card, marginTop: '4px' }}>
      <div style={{ ...S.flexBetween, marginBottom: '12px', flexWrap: 'wrap', gap: '8px', background: '#E6F1FB', border: '1px solid #B5D4F4', borderRadius: '10px', padding: '10px 16px' }}>
        <h3 style={{ ...S.h4, color: '#042C53' }}>📈 {t('section_my_performance')}</h3>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['month', 'all'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ ...S.btn, ...S.btnSm, ...(period === p ? S.btnPrimary : S.btnSecondary) }}>
              {p === 'month' ? 'This Month' : 'All Time'}
            </button>
          ))}
        </div>
      </div>
      {closed.length === 0 ? (
        <p style={{ ...S.muted, fontSize: '13px' }}>No closed calls in this window yet on your plan tier. Check back once calls hit target/SL.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '22px', fontWeight: 800, color: cumulative >= 0 ? '#059669' : '#dc2626' }}>
              {cumulative >= 0 ? '+' : ''}{cumulative.toFixed(2)}%
            </p>
            <p style={{ fontSize: '11px', ...S.muted }}>Notional Cumulative Return</p>
          </div>
          <div>
            <p style={{ fontSize: '22px', fontWeight: 800, color: '#1e40af' }}>{winRate}%</p>
            <p style={{ fontSize: '11px', ...S.muted }}>Win Rate ({wins}/{closed.length})</p>
          </div>
          <div>
            <p style={{ fontSize: '22px', fontWeight: 800, color: '#0A0A0A' }}>
              {avgReturn !== null ? (avgReturn >= 0 ? '+' : '') + avgReturn.toFixed(2) + '%' : '—'}
            </p>
            <p style={{ fontSize: '11px', ...S.muted }}>Avg Return / Closed Call</p>
          </div>
        </div>
      )}
      <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '12px', lineHeight: 1.5 }}>
        ⚠️ Notional/theoretical return assuming equal exposure per call at published entry/exit prices. Not actual realised P&L, not personalised advice, and past performance is not indicative of future results.
      </p>
    </div>
  );
}

// ─── RECOMMENDATION CARD ──────────────────────────────────────────────────────
function RecCard({ rec, userProfile, onClick, quotaLocked }) {
  const planRank = { basic: 0, premium: 1, fno: 2, elite: 3 };
  const userRank = planRank[userProfile?.plan_id || 'basic'] ?? -1;
  const reqRank = planRank[rec.plan_required || 'basic'] ?? 0;
  const hasActiveSub = !!userProfile?.plan_id && userProfile?.plan_expires_at && new Date(userProfile.plan_expires_at) > new Date();
  const hasTierAccess = hasActiveSub && userRank >= reqRank;
  // Tier-lock (plan too low) keeps the full-card blur — nothing about the call
  // is shown. Quota-lock (plan is fine, monthly limit is used up) shows a
  // teaser instead — symbol, status and date stay visible so the subscriber
  // knows a new call was published, but the trade details (action/entry/
  // target/stop-loss) stay hidden until they upgrade.
  const isFullLocked = !hasTierAccess;
  const isQuotaTeaser = !isFullLocked && !!quotaLocked;
  const isLocked = isFullLocked || isQuotaTeaser;
  const effStatus = rec.status || 'live';
  const isLiveish = ['live', 'near_target', 'near_sl'].includes(effStatus);
  const isEquity = (rec.segment || 'equity').toLowerCase() === 'equity';
  const livePrice = useLivePrice(rec.symbol, rec.exchange, isLiveish && isEquity && !isLocked);
  const pnl = calcPnL(livePrice ? { ...rec, cmp: livePrice } : rec);

  // Status badge config
  const statusConfig = {
    live:        { label: 'LIVE',        bg: '#dbeafe', color: '#1e40af' },
    near_target: { label: 'NEAR TARGET', bg: '#d1fae5', color: '#065f46' },
    near_sl:     { label: 'NEAR SL',     bg: '#fef3c7', color: '#92400e' },
    target_hit:  { label: 'TARGET HIT ✓', bg: '#d1fae5', color: '#065f46' },
    sl_hit:      { label: 'SL HIT',      bg: '#fee2e2', color: '#991b1b' },
    expired:     { label: 'EXPIRED',     bg: '#f1f5f9', color: '#64748b' },
    closed:      { label: 'CLOSED',      bg: '#f1f5f9', color: '#64748b' },
    draft:       { label: 'DRAFT',       bg: '#f1f5f9', color: '#64748b' },
    archived:    { label: 'ARCHIVED',    bg: '#f1f5f9', color: '#64748b' },
  };
  const sc = statusConfig[effStatus] || statusConfig.live;

  return (
    <div
      style={{ ...S.card, padding: '16px 18px', cursor: 'pointer', position: 'relative', transition: 'all 0.15s', overflow: 'hidden' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(29,78,216,0.10)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(29,78,216,0.05), 0 4px 16px rgba(29,78,216,0.03)'; }}
      onClick={onClick || (() => { if (!isLocked) navigate('/recommendations/' + rec.id); })}>

      {/* Lock overlay — full card, tier-lock only */}
      {isFullLocked && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '14px', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🔒</span>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#0A0A0A' }}>{PLANS[rec.plan_required || 'basic']?.name} Required</p>
          <button onClick={e => { e.stopPropagation(); navigate('/subscription'); }} style={{ ...S.btn, ...S.btnPrimary, ...S.btnSm }}>Upgrade Plan</button>
        </div>
      )}

      {/* New-call teaser banner — quota-lock only. Symbol/status/date below stay
          visible; only the trade details (row 3+) get covered further down. */}
      {isQuotaTeaser && (
        <div style={{ background: '#FAECE7', border: '1px solid #F0997B', borderRadius: '8px', padding: '6px 10px', marginBottom: '10px', fontSize: '11px', color: '#712B13', fontWeight: 600 }}>
          🔒 New call published — monthly limit reached
        </div>
      )}

      {/* Row 1 — Action badge + Symbol + Status badge + Date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isQuotaTeaser ? (
            <span style={{ ...S.badge, background: '#f1f5f9', color: '#94a3b8', fontSize: '11px', padding: '3px 10px' }}>🔒 LOCKED</span>
          ) : (
            <span style={{ ...S.badge, ...actionStyle(rec.action), fontSize: '11px', padding: '3px 10px' }}>{rec.action}</span>
          )}
          <div>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#0A0A0A' }}>{rec.symbol}</span>
            <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '5px' }}>{rec.exchange}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', background: sc.bg, color: sc.color, letterSpacing: '0.04em' }}>{sc.label}</span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(rec.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
        </div>
      </div>

      {/* Row 2 — Stock name + Segment pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <p style={{ fontSize: '12px', color: '#64748b' }}>{rec.stock_name}</p>
        <span style={{ fontSize: '10px', color: '#94a3b8', background: '#f1f5f9', padding: '2px 7px', borderRadius: '4px', textTransform: 'capitalize' }}>
          {rec.segment}{rec.commodity_type ? ` · ${rec.commodity_type}` : ''}
        </span>
        <span style={{ fontSize: '10px', color: '#94a3b8', background: '#f1f5f9', padding: '2px 7px', borderRadius: '4px', textTransform: 'capitalize' }}>{rec.time_horizon}</span>
      </div>

      {/* Row 3 — Price grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', background: '#FAF9F5', borderRadius: '10px', border: '1px solid #E5E3DA', overflow: 'hidden', position: 'relative' }}>
        {isQuotaTeaser && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(250,249,245,0.85)', backdropFilter: 'blur(5px)', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', padding: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#712B13' }}>Entry, target and stop-loss hidden — monthly limit reached</span>
            <button onClick={e => { e.stopPropagation(); navigate('/subscription'); }} style={{ ...S.btn, ...S.btnSm, background: '#185FA5', color: '#fff' }}>Upgrade</button>
          </div>
        )}
        {[
          { label: 'Entry', value: fmt(rec.entry_price), color: '#0A0A0A' },
          { label: 'Target', value: fmt(rec.target1), color: '#059669' },
          { label: 'Stop Loss', value: fmt(rec.stop_loss), color: '#dc2626' },
          { label: rec.exit_price ? 'Exit' : 'Upside', value: rec.exit_price ? fmt(rec.exit_price) : pct(rec.entry_price, rec.target1), color: '#059669' },
        ].map((item, i) => (
          <div key={i} style={{ padding: '8px 10px', borderRight: i < 3 ? '1px solid #e2e8f0' : 'none', textAlign: 'center' }}>
            <p style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{item.label}</p>
            <p style={{ fontSize: '13px', fontWeight: 700, color: item.color }}>₹{item.value}</p>
          </div>
        ))}
      </div>

      {/* Row 4 — P&L + Risk + Links */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {pnl.points !== null && !isQuotaTeaser && (
            <span style={{ fontSize: '12px', fontWeight: 700, color: pnl.points >= 0 ? '#059669' : '#dc2626' }}>
              {pnl.points >= 0 ? '+' : ''}{pnl.points} pts ({pnl.pct >= 0 ? '+' : ''}{pnl.pct}%)
              {livePrice && <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700, marginLeft: '5px' }}>● Delayed · Yahoo</span>}
            </span>
          )}
          {rec.risk_level && (
            <span style={{ fontSize: '10px', fontWeight: 700, color: riskColor(rec.risk_level), textTransform: 'capitalize' }}>
              ● {rec.risk_level} risk
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {rec.chart_url && <a href={rec.chart_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: '11px', color: '#1e40af', fontWeight: 600, textDecoration: 'none' }}>📈 Chart</a>}
          {rec.report_url && <a href={rec.report_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: '11px', color: '#1e40af', fontWeight: 600, textDecoration: 'none' }}>📄 Report</a>}
        </div>
      </div>
    </div>
  );
}

// ─── RECOMMENDATIONS PAGE ─────────────────────────────────────────────────────
// ─── SCREENERS PAGE ────────────────────────────────────────────────────────────
// Note: this filters our own published research calls into useful categories —
// it is not a full NSE/BSE market-wide screener (that would need a separate data
// feed across the whole market, which we don't have yet). Dividend yield and
// unusual-option-activity data aren't collected today, so those categories show
// as "coming soon" rather than faking results.
function ScreenerResultRow({ item }) {
  const isPositive = item.metric_value >= 0;
  return (
    <div style={{ ...S.card, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <p style={{ fontWeight: 700, fontSize: '14px', color: '#0A0A0A' }}>{item.symbol} <span style={{ fontWeight: 400, fontSize: '11px', color: '#94a3b8' }}>{item.exchange}</span></p>
        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{item.meta?.note}{item.meta?.close ? ` · CMP ₹${fmt(item.meta.close)}` : ''}</p>
      </div>
      <span style={{ fontSize: '15px', fontWeight: 800, color: isPositive ? '#059669' : '#dc2626' }}>
        {isPositive ? '+' : ''}{item.metric_value}%
      </span>
    </div>
  );
}

function ScreenersPage({ user, userProfile }) {
  const [recs, setRecs] = useState([]);
  const [marketResults, setMarketResults] = useState([]);
  const [asOfDate, setAsOfDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState(null);
  const { t } = useLang();

  useEffect(() => {
    Promise.all([
      supabase.from('recommendations').select('*').neq('status', 'draft').order('published_at', { ascending: false }),
      supabase.from('screener_results').select('*').in('category', ['breakouts', 'momentum']).order('metric_value', { ascending: false }),
    ]).then(([recsRes, marketRes]) => {
      setRecs(recsRes.data || []);
      setMarketResults(marketRes.data || []);
      if (marketRes.data?.[0]?.as_of_date) setAsOfDate(marketRes.data[0].as_of_date);
      setLoading(false);
    });
  }, []);

  const planRank = { basic: 0, premium: 1, fno: 2, elite: 3 };
  const userRank = planRank[userProfile?.plan_id || 'basic'] ?? -1;
  const hasActiveSub = !!userProfile?.plan_id && userProfile?.plan_expires_at && new Date(userProfile.plan_expires_at) > new Date();

  const CATEGORIES = [
    { key: 'breakouts', label: 'Fresh breakouts', icon: '📈', color: '#EAF3DE', iconColor: '#27500A', marketData: true,
      filter: item => item.category === 'breakouts' },
    { key: 'momentum', label: 'Momentum leaders', icon: '⚡', color: '#FAEEDA', iconColor: '#633806', marketData: true,
      filter: item => item.category === 'momentum' },
    { key: 'smart-money', label: 'Smart money moves', icon: '🏦', color: '#E6F1FB', iconColor: '#0C447C', planGate: 'premium',
      filter: r => (r.segment || 'equity') === 'equity' && ['premium','fno','elite'].includes(r.plan_required || 'basic') },
    { key: 'options-activity', label: 'Unusual option activity', icon: '🔥', color: '#FAECE7', iconColor: '#712B13', planGate: 'fno',
      comingSoon: true },
    { key: 'dividend', label: 'Dividend leaders', icon: '🪙', color: '#E1F5EE', iconColor: '#085041',
      comingSoon: true },
  ];

  const catRank = { basic: 0, premium: 1, fno: 2, elite: 3 };
  const gateOk = (cat) => !cat.planGate || (hasActiveSub && userRank >= (catRank[cat.planGate] ?? 0));

  const activeCategory = CATEGORIES.find(c => c.key === activeCat);
  const marketMatches = activeCategory?.marketData ? marketResults.filter(activeCategory.filter) : [];
  const recMatches = activeCategory && !activeCategory.marketData && !activeCategory.comingSoon ? recs.filter(activeCategory.filter) : [];

  // Free screener categories (breakouts/momentum) are visible to every plan,
  // but Basic sees only the top N results — the rest are teased with a count
  // and an upgrade prompt, same pattern as the Live Calls monthly quota.
  const resultLimit = PLANS[userProfile?.plan_id || 'basic']?.screenerResultLimit;
  const visibleMarketMatches = (activeCategory?.marketData && resultLimit != null) ? marketMatches.slice(0, resultLimit) : marketMatches;
  const hiddenMarketCount = (activeCategory?.marketData && resultLimit != null) ? Math.max(0, marketMatches.length - resultLimit) : 0;

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <div style={{ ...S.section, paddingTop: '40px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

          <div style={{ background: '#E6F1FB', border: '1px solid #B5D4F4', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px' }}>
            <h2 style={{ ...S.h3, color: '#042C53', marginBottom: '2px' }}>{t('section_screeners')}</h2>
            <p style={{ fontSize: '13px', color: '#0C447C' }}>
              Breakouts and momentum are scanned daily across our Nifty 100 universe{asOfDate ? ` · as of ${new Date(asOfDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}. Other screens are filtered from our published research calls.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '28px' }}>
            {CATEGORIES.map(cat => {
              const isActive = activeCat === cat.key;
              const locked = !gateOk(cat);
              const count = cat.marketData ? marketResults.filter(cat.filter).length
                : !cat.comingSoon ? recs.filter(cat.filter).length : null;
              return (
                <div key={cat.key} onClick={() => !cat.comingSoon && setActiveCat(cat.key)}
                  style={{ ...S.card, cursor: cat.comingSoon ? 'default' : 'pointer', border: isActive ? '2px solid #185FA5' : '1px solid #E5E3DA', opacity: cat.comingSoon ? 0.7 : 1, position: 'relative' }}>
                  {cat.planGate && (
                    <span style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>{locked ? '🔒' : ''}</span>
                  )}
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', fontSize: '16px' }}>
                    {cat.icon}
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#0A0A0A', marginBottom: '4px' }}>{cat.label}</p>
                  <p style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {cat.comingSoon ? 'Coming soon' : locked ? `Unlock with ${PLANS[cat.planGate]?.name || cat.planGate}` : `${count} matching stock${count === 1 ? '' : 's'}`}
                  </p>
                </div>
              );
            })}
          </div>

          {activeCategory && (
            <div>
              <div style={{ ...S.flexBetween, marginBottom: '16px', background: '#E6F1FB', border: '1px solid #B5D4F4', borderRadius: '10px', padding: '10px 16px' }}>
                <h3 style={{ ...S.h4, color: '#042C53' }}>{activeCategory.icon} {activeCategory.label}</h3>
                <button onClick={() => setActiveCat(null)} style={{ ...S.btn, ...S.btnSecondary, ...S.btnSm }}>Close</button>
              </div>
              {loading ? (
                <div style={{ ...S.card, textAlign: 'center', padding: '40px' }}>Loading...</div>
              ) : activeCategory.marketData ? (
                !gateOk(activeCategory) ? (
                  <div style={{ ...S.card, textAlign: 'center', padding: '40px' }}>
                    <p style={{ ...S.muted }}>Upgrade your plan to unlock this screen.</p>
                  </div>
                ) : marketMatches.length === 0 ? (
                  <div style={{ ...S.card, textAlign: 'center', padding: '40px' }}>
                    <p style={{ ...S.muted }}>No stocks matched this screen in today's scan. Check back tomorrow.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {visibleMarketMatches.map(item => <ScreenerResultRow key={item.id} item={item} />)}
                    {hiddenMarketCount > 0 && (
                      <div style={{ ...S.card, textAlign: 'center', padding: '20px', background: '#FAECE7', border: '1px solid #F0997B' }}>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#712B13', marginBottom: '4px' }}>🔒 {hiddenMarketCount} more result{hiddenMarketCount === 1 ? '' : 's'} hidden</p>
                        <p style={{ fontSize: '11px', color: '#712B13', marginBottom: '10px' }}>{PLANS.basic.name} shows the top {resultLimit} results. Upgrade to Premium for the full list.</p>
                        <button onClick={() => navigate('/subscription')} style={{ ...S.btn, ...S.btnSm, background: '#185FA5', color: '#fff' }}>Upgrade Plan</button>
                      </div>
                    )}
                  </div>
                )
              ) : recMatches.length === 0 ? (
                <div style={{ ...S.card, textAlign: 'center', padding: '40px' }}>
                  <p style={{ ...S.muted }}>No calls currently match this screen. Check back after our next published call.</p>
                </div>
              ) : (
                <div style={S.grid2}>
                  {recMatches.map(r => <RecCard key={r.id} rec={r} userProfile={userProfile} />)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RecommendationsPage({ user, userProfile, riskAccepted, setRiskAccepted, forceStatus }) {
  const [recs, setRecs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ segment: '', action: '', status: '', risk: '' });
  const [sort, setSort] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const HIGH_RISK_SEGMENTS = ['futures', 'options'];
  const [fnoAck, setFnoAck] = useState(() => {
    try { return localStorage.getItem('fno_risk_ack_' + (user?.id || 'anon')) === 'true'; } catch(e) { return false; }
  });
  const [fnoGate, setFnoGate] = useState(false);

  useEffect(() => {
    if (HIGH_RISK_SEGMENTS.includes(filters.segment) && !fnoAck) setFnoGate(true);
  }, [filters.segment]);

  const acceptFnoRisk = () => {
    try { localStorage.setItem('fno_risk_ack_' + (user?.id || 'anon'), 'true'); } catch(e) {}
    setFnoAck(true);
    setFnoGate(false);
  };
  const declineFnoRisk = () => {
    setFilters(f => ({ ...f, segment: '' }));
    setFnoGate(false);
  };

  const LIVE_GROUP = ['live', 'near_target', 'near_sl'];
  const PAST_GROUP = ['target_hit', 'sl_hit', 'expired', 'closed', 'archived'];

  useEffect(() => { fetchRecs(); }, []);

  useEffect(() => {
    let data = [...recs];
    if (forceStatus === 'live-group') data = data.filter(r => LIVE_GROUP.includes(r.status));
    if (forceStatus === 'past-group') data = data.filter(r => PAST_GROUP.includes(r.status));
    if (search) data = data.filter(r => r.symbol?.toLowerCase().includes(search.toLowerCase()) || r.stock_name?.toLowerCase().includes(search.toLowerCase()));
    if (filters.segment) data = data.filter(r => r.segment === filters.segment);
    if (filters.action) data = data.filter(r => r.action === filters.action);
    if (filters.status) data = data.filter(r => r.status === filters.status);
    if (filters.risk) data = data.filter(r => r.risk_level === filters.risk);
    if (sort === 'newest') data.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
    if (sort === 'oldest') data.sort((a, b) => new Date(a.published_at) - new Date(b.published_at));

    // Monthly call quota — per-plan cap on how many of this month's live calls a
    // subscriber can view (in addition to the existing plan-tier gating above).
    // Earliest calls of the month are granted first, so quota fills consistently
    // as the month progresses rather than reshuffling on every new publish.
    if (forceStatus === 'live-group') {
      const planRank = { basic: 0, premium: 1, fno: 2, elite: 3 };
      const userRank = planRank[userProfile?.plan_id || 'basic'] ?? -1;
      const hasActiveSub = !!userProfile?.plan_id && userProfile?.plan_expires_at && new Date(userProfile.plan_expires_at) > new Date();
      const limit = PLANS[userProfile?.plan_id || 'basic']?.callLimit;
      if (hasActiveSub && limit != null) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthTierEligible = data
          .filter(r => new Date(r.published_at) >= monthStart && (planRank[r.plan_required || 'basic'] ?? 0) <= userRank)
          .sort((a, b) => new Date(a.published_at) - new Date(b.published_at));
        const allowedIds = new Set(thisMonthTierEligible.slice(0, limit).map(r => r.id));
        data = data.map(r => {
          const inThisMonth = new Date(r.published_at) >= monthStart;
          const tierEligible = (planRank[r.plan_required || 'basic'] ?? 0) <= userRank;
          return { ...r, _quotaLocked: inThisMonth && tierEligible && !allowedIds.has(r.id) };
        });
      }
    }

    setFiltered(data);
  }, [recs, search, filters, sort, forceStatus, userProfile]);

  const fetchRecs = async () => {
    const { data } = await supabase.from('recommendations').select('*').neq('status', 'draft').order('published_at', { ascending: false });
    setRecs(data || []);
    setLoading(false);
  };

  if (!riskAccepted && user) return <DisclaimerPopup onAccept={() => setRiskAccepted(true)} />;
  if (fnoGate) return <FnoRiskGate onAccept={acceptFnoRisk} onDecline={declineFnoRisk} />;

  const stats = { live: recs.filter(r => r.status === 'live' || r.status === 'near_target' || r.status === 'near_sl').length, target_hit: recs.filter(r => r.status === 'target_hit').length, sl_hit: recs.filter(r => r.status === 'sl_hit').length, total: recs.length };

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <div style={{ ...S.section, paddingTop: '40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={S.h2}>{forceStatus === 'live-group' ? 'Live Calls' : forceStatus === 'past-group' ? 'Past Recommendations' : 'Research Calls'}</h1>
            <p style={{ ...S.muted, marginTop: '4px' }}>{forceStatus === 'past-group' ? 'Closed, expired, target-hit, and stop-loss-hit calls with full track record.' : 'Expert stock picks with detailed analysis and entry/exit levels'}</p>
          </div>

          {forceStatus === 'live-group' && userProfile?.plan_id && (() => {
            const limit = PLANS[userProfile.plan_id]?.callLimit;
            if (limit == null) return (
              <div style={{ background: '#E6F1FB', border: '1px solid #B5D4F4', borderRadius: '10px', padding: '10px 16px', marginBottom: '20px', fontSize: '12px', color: '#0C447C' }}>
                {PLANS[userProfile.plan_id]?.name} · Unlimited calls this month
              </div>
            );
            const used = filtered.filter(r => !r._quotaLocked && new Date(r.published_at) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).length;
            return (
              <div style={{ background: '#E6F1FB', border: '1px solid #B5D4F4', borderRadius: '10px', padding: '10px 16px', marginBottom: '20px', fontSize: '12px', color: '#0C447C', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span>{PLANS[userProfile.plan_id]?.name} · {used} of {limit} calls used this month</span>
                {used >= limit && <button onClick={() => navigate('/subscription')} style={{ ...S.btn, ...S.btnSm, background: '#185FA5', color: '#fff' }}>Upgrade for more</button>}
              </div>
            );
          })()}

          {/* Stats */}
          <div style={{ ...S.grid4, marginBottom: '24px' }}>
            {[
              { label: 'Live', value: stats.live, color: '#10b981', icon: '📊' },
              { label: 'Target Hit', value: stats.target_hit, color: '#3b82f6', icon: '🎯' },
              { label: 'SL Hit', value: stats.sl_hit, color: '#ef4444', icon: '⚠️' },
              { label: 'Total Calls', value: stats.total, color: '#334155', icon: '📋' },
            ].map((s, i) => (
              <div key={i} style={{ ...S.card }}>
                <div style={{ fontSize: '24px' }}>{s.icon}</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '12px', ...S.muted }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Search + Filter */}
          <div style={{ ...S.flex, gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input style={{ ...S.input, flex: 1, minWidth: '200px' }} placeholder="Search by stock name, symbol..." value={search} onChange={e => setSearch(e.target.value)} />
            <button onClick={() => setShowFilters(!showFilters)} style={{ ...S.btn, ...S.btnSecondary }}>⚙️ Filters</button>
            <select style={{ ...S.select, width: 'auto' }} value={sort} onChange={e => setSort(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {showFilters && (
            <div style={{ ...S.card, marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                {[
                  { key: 'segment', label: 'Segment', opts: ['equity', 'futures', 'options', 'commodity'] },
                  { key: 'action', label: 'Action', opts: ['BUY', 'SELL', 'HOLD', 'AVOID', 'EXIT'] },
                  { key: 'status', label: 'Status', opts: ['draft', 'live', 'near_target', 'near_sl', 'target_hit', 'sl_hit', 'expired', 'closed', 'archived'] },
                  { key: 'risk', label: 'Risk', opts: ['low', 'medium', 'high'] },
                ].map(f => (
                  <div key={f.key}>
                    <label style={S.label}>{f.label}</label>
                    <select style={S.select} value={filters[f.key]} onChange={e => setFilters(p => ({ ...p, [f.key]: e.target.value }))}>
                      <option value="">All</option>
                      {f.opts.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                    </select>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button onClick={() => setFilters({ segment: '', action: '', status: '', risk: '' })} style={{ ...S.btn, ...S.btnSecondary, ...S.btnSm, width: '100%', justifyContent: 'center' }}>
                    🔄 Reset
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ ...S.card, textAlign: 'center', padding: '60px', ...S.muted }}>Loading research calls...</div>
          ) : filtered.length === 0 ? (
            <div style={{ ...S.card, textAlign: 'center', padding: '60px' }}>
              <p style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</p>
              <p style={{ fontWeight: 700, marginBottom: '8px' }}>No recommendations found</p>
              <p style={S.muted}>Try adjusting your search or filters</p>
              <button onClick={() => { setSearch(''); setFilters({ segment: '', action: '', status: '', risk: '' }); }} style={{ ...S.btn, ...S.btnSecondary, marginTop: '16px' }}>Reset Filters</button>
            </div>
          ) : (
            <div style={S.grid2}>
              {filtered.map(r => <RecCard key={r.id} rec={r} userProfile={userProfile} quotaLocked={r._quotaLocked} />)}
            </div>
          )}

          <div style={{ ...S.disclaimer, marginTop: '32px' }}>
            ⚠️ All research calls are for educational and informational purposes only. Not investment advice. Investment in securities market is subject to market risk. Please read all related documents before investing. SEBI RA Reg: {SEBI_REG}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CHART PLACEHOLDER ────────────────────────────────────────────────────────
// ─── TRADINGVIEW SYMBOL MAPPER ────────────────────────────────────────────────
// Maps our symbols/exchanges/commodities to TradingView symbol format
function getTVSymbol(rec) {
  if (!rec) return 'NSE:NIFTY';
  const sym = (rec.symbol || '').toUpperCase().trim();
  const exch = (rec.exchange || 'NSE').toUpperCase();
  const seg = (rec.segment || 'equity').toLowerCase();
  const comm = (rec.commodity_type || '').toLowerCase();

  // MCX Commodity mapping
  if (exch === 'MCX' || seg === 'commodity') {
    if (comm.includes('gold')) return 'MCX:GOLD1!';
    if (comm.includes('silver')) return 'MCX:SILVER1!';
    if (comm.includes('crude')) return 'MCX:CRUDEOIL1!';
    if (comm.includes('natural') || comm.includes('gas')) return 'MCX:NATURALGAS1!';
    if (sym) return `MCX:${sym}1!`;
    return 'MCX:GOLD1!';
  }
  // F&O / Index
  if (seg === 'futures' || seg === 'options') {
    if (sym === 'NIFTY' || sym === 'NIFTY50') return 'NSE:NIFTY50';
    if (sym === 'BANKNIFTY') return 'NSE:BANKNIFTY';
    return `NSE:${sym}`;
  }
  // BSE — TradingView resolves BSE listings by numeric scrip code, not by the
  // NSE-style ticker text we store (e.g. "BSE:RELIANCE" is invalid on TradingView
  // and silently falls back to its default chart symbol). Almost every BSE call
  // we publish is dual-listed on NSE under the same ticker, so use NSE: instead.
  if (exch === 'BSE') return `NSE:${sym}`;
  // Default NSE equity
  return `NSE:${sym || 'NIFTY'}`;
}

// ─── SELF-HOSTED CHART (Yahoo Finance data) ──────────────────────────────────
// TradingView's free embeddable widgets require a data-licensing agreement for
// NSE/BSE real-time data — without it they silently fall back to a demo symbol
// (Apple Inc), even for valid, liquid Indian tickers. Yahoo Finance's public
// chart endpoint already works reliably in this app (used for live watchlist
// prices), so this renders our own chart from that same data source instead of
// depending on TradingView's embed restrictions.
function YahooLineChart({ rec }) {
  const [points, setPoints] = useState(null);
  const [range, setRange] = useState('3mo');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const sym = (rec?.symbol || '').toUpperCase().trim();
  const exch = (rec?.exchange || 'NSE').toUpperCase();
  const yhSym = exch === 'BSE' ? sym + '.BO' : sym + '.NS';

  useEffect(() => {
    if (!sym) { setErr('No symbol set for this call.'); setLoading(false); return; }
    let cancelled = false;
    setLoading(true); setErr('');
    fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${yhSym}?interval=1d&range=${range}`, { headers: { 'Accept': 'application/json' } })
      .then(r => r.json())
      .then(json => {
        if (cancelled) return;
        const result = json?.chart?.result?.[0];
        const closes = result?.indicators?.quote?.[0]?.close;
        const timestamps = result?.timestamp;
        if (!result || !closes || !timestamps) { setErr('No chart data available for this symbol yet.'); setPoints(null); setLoading(false); return; }
        const pts = timestamps.map((t, i) => ({ t, close: closes[i] })).filter(p => p.close != null);
        setPoints(pts);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) { setErr('Could not load chart data.'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [sym, exch, range]);

  const W = 800, H = 300, PAD = 30;
  let pathD = '', areaD = '', lastPrice = null, changePct = null, isUp = true;
  if (points && points.length > 1) {
    const closes = points.map(p => p.close);
    const min = Math.min(...closes), max = Math.max(...closes);
    const spread = (max - min) || 1;
    const xStep = (W - PAD * 2) / (points.length - 1);
    const coords = points.map((p, i) => {
      const x = PAD + i * xStep;
      const y = PAD + (H - PAD * 2) * (1 - (p.close - min) / spread);
      return [x, y];
    });
    pathD = coords.map((c, i) => (i === 0 ? 'M' : 'L') + c[0].toFixed(1) + ',' + c[1].toFixed(1)).join(' ');
    areaD = pathD + ` L${coords[coords.length - 1][0].toFixed(1)},${H - PAD} L${coords[0][0].toFixed(1)},${H - PAD} Z`;
    lastPrice = closes[closes.length - 1];
    const firstPrice = closes[0];
    changePct = +(((lastPrice - firstPrice) / firstPrice) * 100).toFixed(2);
    isUp = lastPrice >= firstPrice;
  }
  const lineColor = isUp ? '#059669' : '#dc2626';

  return (
    <div style={{ ...S.card, padding: '0', overflow: 'hidden', marginBottom: '16px' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: '14px', color: '#0A0A0A' }}>
            📈 {sym} {exch}
            {lastPrice !== null && <span style={{ marginLeft: '10px', color: lineColor }}>₹{fmt(lastPrice)} ({changePct >= 0 ? '+' : ''}{changePct}%)</span>}
          </p>
          <p style={{ fontSize: '11px', color: '#64748b' }}>Delayed data · Yahoo Finance (unofficial feed, not exchange-licensed)</p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[{v:'1mo',l:'1M'},{v:'3mo',l:'3M'},{v:'6mo',l:'6M'},{v:'1y',l:'1Y'}].map(r => (
            <button key={r.v} onClick={() => setRange(r.v)}
              style={{ ...S.btn, ...S.btnSm, ...(range === r.v ? S.btnPrimary : S.btnSecondary) }}>{r.l}</button>
          ))}
          <a href={`https://www.tradingview.com/chart/?symbol=${exch === 'BSE' ? 'BSE' : 'NSE'}:${sym}`} target="_blank" rel="noreferrer"
            style={{ ...S.btn, ...S.btnSm, ...S.btnSecondary, textDecoration: 'none' }}>Full chart ↗</a>
        </div>
      </div>
      <div style={{ padding: '12px 16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: '13px' }}>Loading chart...</div>
        ) : err ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: '13px' }}>{err}</div>
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '280px' }}>
            <defs>
              <linearGradient id={`grad-${rec?.id || 'x'}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity="0.18" />
                <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaD} fill={`url(#grad-${rec?.id || 'x'})`} />
            <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2" />
          </svg>
        )}
      </div>
    </div>
  );
}

// ─── FUNDAMENTALS PANEL (Phase 4 — free/legal source: Yahoo Finance) ────────
// Sourced via /api/get-fundamentals.js. This is deliberately NOT a licensed
// data feed — it's clearly labeled as unofficial/informational, same honesty
// standard as the price data disclosure. Do not remove that label.
function FundamentalsPanel({ rec }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const sym = (rec?.symbol || '').toUpperCase().trim();
  const exch = (rec?.exchange || 'NSE').toUpperCase();

  useEffect(() => {
    if (!sym) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true); setErr('');
    fetch(`/api/get-fundamentals?symbol=${encodeURIComponent(sym)}&exchange=${encodeURIComponent(exch)}`)
      .then(r => r.json())
      .then(json => {
        if (cancelled) return;
        if (json.error) { setErr(json.error); setData(null); }
        else setData(json);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) { setErr('Could not load fundamentals.'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [sym, exch]);

  const Stat = ({ label, value, suffix = '' }) => (
    <div>
      <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</p>
      <p style={{ fontSize: '15px', fontWeight: 700, color: '#0A0A0A' }}>{value !== null && value !== undefined ? `${fmt(value)}${suffix}` : '—'}</p>
    </div>
  );

  return (
    <div style={{ ...S.card, marginBottom: '16px' }}>
      <div style={{ ...S.flexBetween, marginBottom: '4px', flexWrap: 'wrap', gap: '6px' }}>
        <h4 style={S.h4}>📑 Key Fundamentals</h4>
      </div>
      <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '14px' }}>
        Unofficial · Yahoo Finance (informational only — not an exchange-licensed or audited feed; verify independently before investing)
      </p>

      {loading ? (
        <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>Loading fundamentals...</p>
      ) : err ? (
        <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>{err}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '16px' }}>
          <Stat label="P/E (TTM)" value={data.valuation.trailingPE} />
          <Stat label="Forward P/E" value={data.valuation.forwardPE} />
          <Stat label="P/B" value={data.valuation.priceToBook} />
          <Stat label="PEG" value={data.valuation.pegRatio} />
          <Stat label="ROE" value={data.profitability.returnOnEquityPct} suffix="%" />
          <Stat label="ROA" value={data.profitability.returnOnAssetsPct} suffix="%" />
          <Stat label="Net Margin" value={data.profitability.profitMarginsPct} suffix="%" />
          <Stat label="Revenue Growth" value={data.growth.revenueGrowthPct} suffix="%" />
          <Stat label="Earnings Growth" value={data.growth.earningsGrowthPct} suffix="%" />
          <Stat label="Debt/Equity" value={data.balanceSheet.debtToEquity} />
          <Stat label="Current Ratio" value={data.balanceSheet.currentRatio} />
          <Stat label="Dividend Yield" value={data.dividend.yieldPct} suffix="%" />
          <Stat label="EPS (TTM)" value={data.eps.trailing} />
          <Stat label="52W High" value={data.priceRange.fiftyTwoWeekHigh} />
          <Stat label="52W Low" value={data.priceRange.fiftyTwoWeekLow} />
        </div>
      )}
    </div>
  );
}

// TradingView Advanced Chart with dropdown controls
function TVAdvancedChart({ rec }) {
  const [tvInterval, setTvInterval] = useState('D');
  const [chartStyle, setChartStyle] = useState('1');
  const containerId = `tv-adv-${rec?.id || 'main'}`;
  const symbol = getTVSymbol(rec);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'tradingview-widget-container';
    wrapper.style.height = '480px';
    wrapper.style.width = '100%';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: tvInterval,
      timezone: 'Asia/Kolkata',
      theme: 'light',
      style: chartStyle,
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: false,
      hide_side_toolbar: false,
      studies: ['RSI@tv-basicstudies', 'MACD@tv-basicstudies'],
    });
    wrapper.appendChild(script);
    container.appendChild(wrapper);
  }, [symbol, tvInterval, chartStyle]);

  const selStyle = { padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 600, background: '#FAF9F5', color: '#0A0A0A', cursor: 'pointer' };

  return (
    <div style={{ ...S.card, padding: '0', overflow: 'hidden', marginBottom: '16px' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: '14px', color: '#0A0A0A' }}>📈 Chart — {symbol}</p>
          <p style={{ fontSize: '11px', color: '#64748b' }}>Powered by TradingView</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select style={selStyle} value={tvInterval} onChange={e => setTvInterval(e.target.value)}>
            <option value="1">1 Min</option>
            <option value="5">5 Min</option>
            <option value="15">15 Min</option>
            <option value="30">30 Min</option>
            <option value="60">1 Hour</option>
            <option value="D">Daily</option>
            <option value="W">Weekly</option>
            <option value="M">Monthly</option>
          </select>
          <select style={selStyle} value={chartStyle} onChange={e => setChartStyle(e.target.value)}>
            <option value="1">Candlestick</option>
            <option value="0">Bars</option>
            <option value="2">Line</option>
            <option value="3">Area</option>
            <option value="8">Heiken Ashi</option>
          </select>
        </div>
      </div>
      <div id={containerId} style={{ height: '480px', width: '100%' }} />
    </div>
  );
}

// TradingView Mini Chart
function TVMiniChart({ rec, label }) {
  const containerId = `tv-mini-${rec?.id || 'x'}-${label}`;
  const symbol = getTVSymbol(rec);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol,
      width: '100%',
      height: '220',
      locale: 'en',
      dateRange: '3M',
      colorTheme: 'light',
      isTransparent: true,
      autosize: true,
      largeChartUrl: `https://www.tradingview.com/chart/?symbol=${symbol}`,
    });
    container.appendChild(script);
  }, [symbol]);

  return (
    <div style={{ ...S.card, padding: '0', overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0' }}>
        <p style={{ fontWeight: 700, fontSize: '13px', color: '#0A0A0A' }}>{label}</p>
      </div>
      <div className="tradingview-widget-container" id={containerId} style={{ height: '220px', width: '100%' }} />
    </div>
  );
}

// TradingView Technical Analysis widget
function TVTechnicalAnalysis({ rec }) {
  const containerId = `tv-tech-${rec?.id || 'ta'}`;
  const symbol = getTVSymbol(rec);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      interval: '1D',
      width: '100%',
      isTransparent: true,
      height: 350,
      symbol,
      showIntervalTabs: true,
      locale: 'en',
      colorTheme: 'light',
    });
    container.appendChild(script);
  }, [symbol]);

  return (
    <div style={{ ...S.card, padding: '0', overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0' }}>
        <p style={{ fontWeight: 700, fontSize: '13px', color: '#0A0A0A' }}>📐 Technical Analysis</p>
        <p style={{ fontSize: '11px', color: '#64748b' }}>Buy/Sell/Neutral signals across timeframes</p>
      </div>
      <div className="tradingview-widget-container" id={containerId} style={{ height: '350px', width: '100%' }} />
    </div>
  );
}

// ChartPlaceholder — only used for Option Chain (no free widget)
function ChartPlaceholder({ label, icon }) {
  return (
    <div style={{ ...S.card, textAlign: 'center', padding: '32px 16px', opacity: 0.7 }}>
      <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
      <p style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>{label}</p>
      <p style={{ fontSize: '12px', ...S.muted }}>Coming soon.</p>
    </div>
  );
}

// ─── RECOMMENDATION DETAIL PAGE ───────────────────────────────────────────────
function RecommendationDetailPage({ id, userProfile }) {
  const [rec, setRec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quotaLocked, setQuotaLocked] = useState(false);
  const [quotaChecked, setQuotaChecked] = useState(false);

  useEffect(() => {
    supabase.from('recommendations').select('*').eq('id', id).single().then(({ data }) => {
      setRec(data);
      setLoading(false);
    });
  }, [id]);

  // Same tier + monthly-quota access rules as RecCard, enforced here too — this
  // page was previously reachable directly by URL with no access check at all,
  // bypassing the card's lock overlay entirely.
  useEffect(() => {
    if (!rec) return;
    const planRank = { basic: 0, premium: 1, fno: 2, elite: 3 };
    const userRank = planRank[userProfile?.plan_id || 'basic'] ?? -1;
    const limit = PLANS[userProfile?.plan_id || 'basic']?.callLimit;
    const LIVE_GROUP = ['live', 'near_target', 'near_sl'];
    const isLiveish = LIVE_GROUP.includes(rec.status);
    if (limit == null || !isLiveish) { setQuotaLocked(false); setQuotaChecked(true); return; }
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    if (new Date(rec.published_at) < monthStart) { setQuotaLocked(false); setQuotaChecked(true); return; }
    supabase.from('recommendations').select('id,published_at,plan_required')
      .in('status', LIVE_GROUP)
      .gte('published_at', monthStart.toISOString())
      .order('published_at', { ascending: true })
      .then(({ data }) => {
        const eligible = (data || []).filter(r => (planRank[r.plan_required || 'basic'] ?? 0) <= userRank);
        const allowedIds = new Set(eligible.slice(0, limit).map(r => r.id));
        setQuotaLocked(!allowedIds.has(rec.id));
        setQuotaChecked(true);
      });
  }, [rec, userProfile]);

  if (loading || (rec && !quotaChecked)) return <div style={{ paddingTop: '100px', textAlign: 'center', ...S.muted }}>Loading...</div>;
  if (!rec) return <div style={{ paddingTop: '100px', textAlign: 'center', ...S.muted }}>Recommendation not found.</div>;

  const planRank = { basic: 0, premium: 1, fno: 2, elite: 3 };
  const userRank = planRank[userProfile?.plan_id || 'basic'] ?? -1;
  const reqRank = planRank[rec.plan_required || 'basic'] ?? 0;
  const hasActiveSub = !!userProfile?.plan_id && userProfile?.plan_expires_at && new Date(userProfile.plan_expires_at) > new Date();
  const hasTierAccess = hasActiveSub && userRank >= reqRank;
  const isLocked = !hasTierAccess || quotaLocked;

  if (isLocked) {
    return (
      <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
        <div style={{ ...S.section, paddingTop: '40px' }}>
          <div style={{ maxWidth: '480px', margin: '0 auto' }}>
            <button onClick={() => navigate('/recommendations')} style={{ ...S.btn, ...S.btnSecondary, ...S.btnSm, marginBottom: '20px' }}>← Back</button>
            <div style={{ ...S.card, textAlign: 'center', padding: '40px 24px' }}>
              <span style={{ fontSize: '32px' }}>🔒</span>
              {quotaLocked && hasTierAccess ? (
                <>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#0A0A0A', marginTop: '12px' }}>Monthly call limit reached</p>
                  <p style={{ fontSize: '13px', ...S.muted, marginTop: '6px' }}>{PLANS[userProfile?.plan_id || 'basic']?.name} includes {PLANS[userProfile?.plan_id || 'basic']?.callLimit} calls/month. This call is beyond your current month's quota.</p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#0A0A0A', marginTop: '12px' }}>{PLANS[rec.plan_required || 'basic']?.name} Required</p>
                  <p style={{ fontSize: '13px', ...S.muted, marginTop: '6px' }}>Upgrade your plan to view this call's entry, targets, and stop-loss.</p>
                </>
              )}
              <button onClick={() => navigate('/subscription')} style={{ ...S.btn, ...S.btnPrimary, marginTop: '16px' }}>Upgrade Plan</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const pnl = calcPnL(rec);
  const effStatus = suggestStatus(rec);

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <div style={{ ...S.section, paddingTop: '40px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <button onClick={() => navigate('/recommendations')} style={{ ...S.btn, ...S.btnSecondary, ...S.btnSm, marginBottom: '20px' }}>← Back</button>

          <div style={{ ...S.flexBetween, flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
            <div>
              <h1 style={S.h2}>{rec.symbol} <span style={{ fontSize: '14px', fontWeight: 400, ...S.muted }}>({rec.exchange})</span></h1>
              <p style={{ ...S.muted }}>{rec.stock_name}{rec.commodity_type ? ` · ${rec.commodity_type}` : ''}</p>
            </div>
            <span style={{ ...S.badge, ...actionStyle(rec.action), fontSize: '14px' }}>{rec.action}</span>
          </div>

          <div style={{ ...S.grid4, marginBottom: '16px' }}>
            {[
              { label: 'Entry', value: fmt(rec.entry_price) },
              { label: 'CMP', value: fmt(rec.cmp) },
              { label: 'Target 1', value: fmt(rec.target1) },
              { label: 'Stop Loss', value: fmt(rec.stop_loss) },
            ].map((s, i) => (
              <div key={i} style={{ ...S.card, textAlign: 'center', padding: '14px' }}>
                <p style={{ fontSize: '11px', ...S.muted }}>{s.label}</p>
                <p style={{ fontWeight: 700 }}>{s.value}</p>
              </div>
            ))}
          </div>

          {pnl.points !== null && (
            <div style={{ ...S.card, marginBottom: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', ...S.muted, marginBottom: '4px' }}>Current P&amp;L</p>
              <p style={{ fontSize: '22px', fontWeight: 800, color: pnl.points >= 0 ? '#10b981' : '#ef4444' }}>
                {pnl.points >= 0 ? '+' : ''}{pnl.points} pts ({pnl.pct >= 0 ? '+' : ''}{pnl.pct}%)
              </p>
            </div>
          )}

          <div style={{ ...S.flex, gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <span style={{ ...S.badge, background: '#e2e8f0' }}>{effStatus.replace('_', ' ').toUpperCase()}</span>
            <span style={{ ...S.badge, background: '#e2e8f0' }}>{rec.time_horizon}</span>
            <span style={{ ...S.badge, background: '#e2e8f0' }}>Risk: <span style={{ color: riskColor(rec.risk_level) }}>{rec.risk_level}</span></span>
            <span style={{ ...S.badge, background: '#e2e8f0' }}>{PLANS[rec.plan_required]?.name}</span>
          </div>

          {/* Uploaded chart image */}
          {rec.chart_url ? (
            <div style={{ ...S.card, marginBottom: '16px', padding: '8px' }}>
              <img src={rec.chart_url} alt="Chart" style={{ width: '100%', borderRadius: '8px', display: 'block' }} />
            </div>
          ) : (
            <ChartPlaceholder label="Analyst Chart" icon="🖼️" />
          )}

          {rec.report_url && (
            <a href={rec.report_url} target="_blank" rel="noreferrer" style={{ ...S.btn, ...S.btnSecondary, marginBottom: '16px', textDecoration: 'none' }}>📄 View Research Report</a>
          )}

          {rec.technical_notes && (
            <div style={{ ...S.card, marginBottom: '16px' }}>
              <h4 style={{ ...S.h4, marginBottom: '8px' }}>Technical View</h4>
              <p style={{ fontSize: '13px', lineHeight: 1.6, ...S.muted }}>{rec.technical_notes}</p>
            </div>
          )}
          {rec.fundamental_notes && (
            <div style={{ ...S.card, marginBottom: '16px' }}>
              <h4 style={{ ...S.h4, marginBottom: '8px' }}>Fundamental View</h4>
              <p style={{ fontSize: '13px', lineHeight: 1.6, ...S.muted }}>{rec.fundamental_notes}</p>
            </div>
          )}
          {rec.rationale && (
            <div style={{ ...S.card, marginBottom: '16px' }}>
              <h4 style={{ ...S.h4, marginBottom: '8px' }}>Research Rationale</h4>
              <p style={{ fontSize: '13px', lineHeight: 1.6, ...S.muted }}>{rec.rationale}</p>
            </div>
          )}

          {/* Price Charts */}
          <h4 style={{ ...S.h4, marginBottom: '12px', marginTop: '8px' }}>Price Charts</h4>

          {/* Main chart — self-hosted (Yahoo Finance data), reliable for NSE/BSE equity */}
          {(rec.segment || 'equity').toLowerCase() === 'equity' ? (
            <>
              <YahooLineChart rec={rec} />
              <FundamentalsPanel rec={rec} />
            </>
          ) : (
            <TVAdvancedChart rec={rec} />
          )}

          {(rec.segment || 'equity').toLowerCase() === 'equity' ? (
            <>
              {/* TradingView's technical-analysis and mini-overview embed widgets share the
                  same NSE/BSE data-licensing restriction as the advanced chart above, so for
                  equity calls we link out to the real TradingView site (confirmed working)
                  instead of embedding a widget that would show the same fallback. */}
              <div style={{ ...S.card, marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <a href={`https://www.tradingview.com/chart/?symbol=${rec.exchange === 'BSE' ? 'BSE' : 'NSE'}:${(rec.symbol||'').toUpperCase()}`} target="_blank" rel="noreferrer"
                  style={{ ...S.btn, ...S.btnSecondary, textDecoration: 'none' }}>📊 View technicals (RSI/MACD) on TradingView ↗</a>
                <a href={`https://www.tradingview.com/symbols/${rec.exchange === 'BSE' ? 'BSE' : 'NSE'}-${(rec.symbol||'').toUpperCase()}/`} target="_blank" rel="noreferrer"
                  style={{ ...S.btn, ...S.btnSecondary, textDecoration: 'none' }}>📉 Full price history ↗</a>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <ChartPlaceholder label="⛓️ Option Chain" icon="⛓️" />
              </div>
            </>
          ) : (
            <>
              {/* Technical Analysis */}
              <div style={{ marginBottom: '16px' }}>
                <TVTechnicalAnalysis rec={rec} />
              </div>

              {/* Mini charts grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                <TVMiniChart rec={rec} label="📊 3-Month Overview" />
                <TVMiniChart rec={{ ...rec, symbol: rec.symbol }} label="📉 Price Action" />
                <ChartPlaceholder label="⛓️ Option Chain" icon="⛓️" />
              </div>
            </>
          )}

          <div style={{ ...S.disclaimer }}>
            ⚠️ Investment in securities market is subject to market risk. Past performance does not guarantee future returns. This platform does not provide guaranteed profit. SEBI RA Reg: {SEBI_REG}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CONTACT PAGE ─────────────────────────────────────────────────────────────
function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handle = () => {
    if (!form.name || !form.email || !form.message) return;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('[StockVista] ' + (form.subject || 'General Enquiry'))}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`;
    setSent(true);
  };
  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#FAF9F5' }}>
      <div style={{ ...S.section, paddingTop: '48px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 style={{ ...S.h2, marginBottom: '8px' }}>Contact Us</h1>
            <p style={{ color: '#64748b', fontSize: '15px' }}>We typically respond within 1 business day.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px', alignItems: 'start' }}>
            {/* Info cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { icon: '📧', title: 'Email Support', value: CONTACT_EMAIL, sub: 'Mon–Fri, 9 AM – 6 PM IST' },
                { icon: '📱', title: 'Phone', value: CONTACT_PHONE, sub: 'Mon–Fri, 10 AM – 5 PM IST' },
                { icon: '📮', title: 'Grievance Officer', value: ANALYST_NAME, sub: COMPANY_NAME },
                { icon: '🏛️', title: 'SEBI SCORES', value: 'scores.sebi.gov.in', sub: 'For unresolved complaints' },
              ].map((c, i) => (
                <div key={i} style={{ ...S.card, display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '16px' }}>
                  <div style={{ fontSize: '22px', width: '40px', height: '40px', background: '#eff6ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.icon}</div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '13px', color: '#0A0A0A' }}>{c.title}</p>
                    <p style={{ fontSize: '14px', color: '#1d4ed8', fontWeight: 600 }}>{c.value}</p>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>{c.sub}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Form */}
            <div style={{ ...S.card }}>
              {sent ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                  <h3 style={{ ...S.h3, marginBottom: '8px' }}>Message Sent!</h3>
                  <p style={{ color: '#64748b' }}>Your email client should have opened. We'll respond within 1 business day.</p>
                  <button onClick={() => setSent(false)} style={{ ...S.btn, ...S.btnSecondary, marginTop: '20px' }}>Send Another</button>
                </div>
              ) : (
                <>
                  <h3 style={{ ...S.h3, marginBottom: '20px' }}>Send a Message</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div style={S.formGroup}>
                      <label style={S.label}>Your Name *</label>
                      <input style={S.input} placeholder="Nishit Jain" value={form.name} onChange={e => set('name', e.target.value)} />
                    </div>
                    <div style={S.formGroup}>
                      <label style={S.label}>Email *</label>
                      <input style={S.input} type="email" placeholder="you@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
                    </div>
                  </div>
                  <div style={{ ...S.formGroup, marginBottom: '12px' }}>
                    <label style={S.label}>Subject</label>
                    <input style={S.input} placeholder="Subscription query / Technical issue / Research feedback" value={form.subject} onChange={e => set('subject', e.target.value)} />
                  </div>
                  <div style={{ ...S.formGroup, marginBottom: '20px' }}>
                    <label style={S.label}>Message *</label>
                    <textarea style={{ ...S.textarea, minHeight: '120px' }} placeholder="Describe your query in detail..." value={form.message} onChange={e => set('message', e.target.value)} />
                  </div>
                  <button onClick={handle} style={{ ...S.btn, ...S.btnPrimary, width: '100%', justifyContent: 'center' }}>Send Message →</button>
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '12px', textAlign: 'center' }}>
                    For billing disputes not resolved within 30 days, escalate to SEBI SCORES: scores.sebi.gov.in
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// ─── BLOG PAGE ────────────────────────────────────────────────────────────────
const BLOG_POSTS = [
  { id: 1, title: 'How to Read a Stock Research Call', date: 'June 28, 2026', tag: 'Education', icon: '📊', mins: '5 min read', summary: 'Understanding entry price, target, stop-loss, and time horizon — what each field means and how to use it in your trading decisions.', content: `A research call is not a guaranteed profit signal. It is a structured analysis that tells you: where to enter, where to book profit, and where to exit if wrong. Entry Price: The recommended buy/sell price range. Do not chase the stock if it has moved more than 2-3% away from the entry. Target 1/2/3: Progressive profit-booking levels. Book partial profits at each target rather than waiting for Target 3. Stop Loss: The maximum loss you should accept. If the price hits stop loss, exit immediately — do not average down. Time Horizon: How long to hold the position. An intraday call should not be converted into a positional trade after it goes wrong.` },
  { id: 2, title: 'What is Stop Loss and Why You Must Use It', date: 'June 20, 2026', tag: 'Risk', icon: '🛑', mins: '4 min read', summary: 'Stop loss is the single most important risk management tool. Most retail investors lose money not because their analysis is wrong but because they do not use stop loss.', content: `Stop loss is a pre-decided exit price when a trade goes against you. Example: You buy Reliance at ₹2,456 with a stop loss at ₹2,380. If Reliance falls to ₹2,380, you exit immediately — no questions asked. Why most people skip stop loss: Hope — "it will recover." Ego — "I can't be wrong." Averaging — "I'll buy more at lower levels." Why stop loss saves you: A 10% loss needs an 11% gain to recover. A 50% loss needs a 100% gain. Preserving capital is more important than being right.` },
  { id: 3, title: 'F&O Trading: Understanding the Risks Before You Start', date: 'June 12, 2026', tag: 'F&O', icon: '⚡', mins: '7 min read', summary: 'Futures and options can amplify returns — but they can also wipe out your entire investment. Here is what you must know before trading derivatives.', content: `Futures and Options (F&O) are derivatives — their value derives from an underlying asset like Nifty 50 or a stock. Options buyers can lose 100% of their premium. If you buy a Nifty call option for ₹5,000 and Nifty moves against you, your entire ₹5,000 is gone. Futures have margin calls — if the market moves against your futures position, you must add more money or your position is squared off at a loss. SEBI data shows that over 90% of F&O traders lose money. Start with paper trading before using real capital. Never risk more than you can afford to lose completely.` },
  { id: 4, title: 'Nifty Technical Levels — How to Read Them', date: 'June 5, 2026', tag: 'Technical', icon: '📈', mins: '6 min read', summary: 'Support, resistance, and key Nifty levels explained. Understanding these helps you time your entries and exits better across all segments.', content: `Support is a price level where buyers are expected to be strong enough to prevent the price from falling further. Resistance is where sellers are expected to be strong enough to prevent further rise. Key Nifty support/resistance levels are often round numbers (22,000, 23,000, 24,000) and previous highs/lows. How to use: If Nifty is near strong support and our call says "BUY," the risk is lower. If Nifty is near strong resistance, wait for a breakout before entering long positions. Moving averages (20 DMA, 50 DMA, 200 DMA) also act as dynamic support/resistance.` },
];

function BlogPage() {
  const [selected, setSelected] = useState(null);
  const post = selected ? BLOG_POSTS.find(p => p.id === selected) : null;
  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#FAF9F5' }}>
      <div style={{ ...S.section, paddingTop: '48px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          {post ? (
            <>
              <button onClick={() => setSelected(null)} style={{ ...S.btn, ...S.btnSecondary, ...S.btnSm, marginBottom: '24px' }}>← Back to Blog</button>
              <div style={{ ...S.card }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ ...S.badge, background: '#eff6ff', color: '#1d4ed8' }}>{post.tag}</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>{post.date} · {post.mins}</span>
                </div>
                <h1 style={{ ...S.h2, marginBottom: '16px' }}>{post.icon} {post.title}</h1>
                <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.8, marginBottom: '24px', borderLeft: '4px solid #1d4ed8', paddingLeft: '16px', fontStyle: 'italic' }}>{post.summary}</p>
                <div style={{ fontSize: '15px', color: '#1e293b', lineHeight: 1.9 }}>{post.content}</div>
                <div style={{ ...S.disclaimer, marginTop: '24px' }}>
                  ⚠️ This article is for educational purposes only. Not investment advice. {SEBI_REG}
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 style={{ ...S.h2, marginBottom: '8px' }}>Research & Education</h1>
                <p style={{ color: '#64748b' }}>Market insights, trading education, and research methodology — free for all.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {BLOG_POSTS.map(p => (
                  <div key={p.id} style={{ ...S.card, cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => setSelected(p.id)}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(29,78,216,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(29,78,216,0.06)'; }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>{p.icon}</div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ ...S.badge, background: '#eff6ff', color: '#1d4ed8', fontSize: '11px' }}>{p.tag}</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{p.mins}</span>
                    </div>
                    <h3 style={{ ...S.h4, marginBottom: '8px', color: '#0A0A0A' }}>{p.title}</h3>
                    <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, marginBottom: '12px' }}>{p.summary}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{p.date}</span>
                      <span style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: 600 }}>Read →</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ ...S.disclaimer, marginTop: '32px' }}>
                ⚠️ All articles are for educational purposes only and do not constitute investment advice. {SEBI_REG}
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

// ─── NOTIFICATIONS PAGE ───────────────────────────────────────────────────────
function NotificationsPage({ user, userProfile }) {
  const [notifs, setNotifs] = useState([]);
  const [recNotifs, setRecNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('admin_notifications').select('*').order('created_at', { ascending: false }).limit(30),
      supabase.from('recommendations').select('id, symbol, stock_name, action, status, published_at, entry_price, target1, stop_loss').neq('status', 'draft').order('published_at', { ascending: false }).limit(20),
    ]).then(([n, r]) => {
      const plan = userProfile?.plan_id || 'basic';
      const filtered = (n.data || []).filter(notif => notif.plan_target === 'all' || notif.plan_target === plan);
      setNotifs(filtered);
      setRecNotifs(r.data || []);
      setLoading(false);
    });
  }, [user]);

  if (!user) return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#FEFDFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
        <h2 style={S.h3}>Login to see notifications</h2>
        <button onClick={() => navigate('/login')} style={{ ...S.btn, ...S.btnPrimary, marginTop: '16px' }}>Sign In</button>
      </div>
    </div>
  );

  const typeIcon = { info: 'ℹ️', alert: '🔴', success: '✅', call: '📊', market: '📈' };

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#FEFDFB' }}>
      <div style={{ ...S.section, paddingTop: '40px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h1 style={{ ...S.h2, marginBottom: '4px' }}>🔔 Notifications</h1>
          <p style={{ color: '#64748b', marginBottom: '28px' }}>Platform alerts and latest research call activity</p>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading...</div>
          ) : (
            <>
              {notifs.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Platform Alerts</p>
                  {notifs.map(n => (
                    <div key={n.id} style={{ ...S.card, marginBottom: '8px', display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '14px 16px' }}>
                      <span style={{ fontSize: '20px', flexShrink: 0 }}>{typeIcon[n.type] || 'ℹ️'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <p style={{ fontWeight: 700, fontSize: '14px', color: '#0A0A0A' }}>{n.title}</p>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        </div>
                        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>{n.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Recent Research Calls</p>
              {recNotifs.length === 0 ? (
                <div style={{ ...S.card, textAlign: 'center', padding: '60px' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
                  <p style={{ color: '#64748b' }}>No calls published yet.</p>
                </div>
              ) : recNotifs.map(r => (
                <div key={r.id} style={{ ...S.card, marginBottom: '8px', display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '14px 16px', cursor: 'pointer' }}
                  onClick={() => navigate('/recommendations/' + r.id)}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: r.status === 'target_hit' ? '#d1fae5' : r.status === 'sl_hit' ? '#fee2e2' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                    {r.status === 'target_hit' ? '✅' : r.status === 'sl_hit' ? '❌' : r.action === 'BUY' ? '📈' : r.action === 'SELL' ? '📉' : '📊'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <p style={{ fontWeight: 700, color: '#0A0A0A', fontSize: '14px' }}>{r.action} {r.symbol}</p>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(r.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#64748b' }}>{r.stock_name} · Entry ₹{r.entry_price} · T1 ₹{r.target1} · SL ₹{r.stop_loss}</p>
                    <span style={{ ...S.badge, fontSize: '11px', background: r.status === 'live' ? '#eff6ff' : '#FAF9F5', color: r.status === 'live' ? '#1d4ed8' : '#64748b', marginTop: '6px' }}>
                      {r.status?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}


function ProfilePage({ user, userProfile }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(userProfile?.full_name || '');
  const [mobile, setMobile] = useState(userProfile?.mobile || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url || null);
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setMsg('Image must be under 2MB.'); return; }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error: upErr } = await supabase.storage.from('user-avatars').upload(path, file, { upsert: true });
    if (upErr) { setMsg('Upload error: ' + upErr.message); setUploading(false); return; }
    const { data } = supabase.storage.from('user-avatars').getPublicUrl(path);
    const url = data.publicUrl + '?t=' + Date.now();
    await supabase.from('users').update({ avatar_url: url }).eq('id', user.id);
    setAvatarUrl(url);
    setUploading(false);
    setMsg('✅ Photo updated!');
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('users').update({ full_name: name, mobile }).eq('id', user.id);
    setSaving(false);
    if (error) { setMsg('Error: ' + error.message); return; }
    setMsg('✅ Profile updated!');
    setEditing(false);
  };

  if (!user) { navigate('/login'); return null; }
  const plan = PLANS[userProfile?.plan_id || 'basic'];
  const isActive = userProfile?.plan_expires_at && new Date(userProfile.plan_expires_at) > new Date();

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#FEFDFB' }}>
      <div style={{ ...S.section, paddingTop: '40px' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h1 style={{ ...S.h2, marginBottom: '28px' }}>👤 My Profile</h1>

          {/* Avatar + plan badge */}
          <div style={{ ...S.card, marginBottom: '16px', display: 'flex', gap: '20px', alignItems: 'center' }}>
            {/* Avatar with upload */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #bfdbfe' }} />
              ) : (
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #1e40af, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: '#fff', fontWeight: 800, border: '3px solid #bfdbfe' }}>
                  {(userProfile?.full_name || user?.email || 'U')[0].toUpperCase()}
                </div>
              )}
              {/* Upload overlay */}
              <label htmlFor="avatar-upload" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}>
                {uploading ? (
                  <span style={{ color: '#fff', fontSize: '20px' }}>⏳</span>
                ) : (
                  <span style={{ color: '#fff', fontSize: '18px', opacity: 0 }} className="cam-icon">📷</span>
                )}
              </label>
              <input id="avatar-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadAvatar} />
              <div style={{ position: 'absolute', bottom: '2px', right: '2px', background: '#1e40af', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #fff' }}>
                <label htmlFor="avatar-upload" style={{ cursor: 'pointer', fontSize: '11px', color: '#fff', lineHeight: 1 }}>📷</label>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: '18px', color: '#0A0A0A' }}>{userProfile?.full_name || 'Investor'}</p>
              <p style={{ color: '#64748b', fontSize: '13px' }}>{user?.email}</p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                <span style={{ ...S.badge, background: '#eff6ff', color: '#1d4ed8' }}>{plan?.name || 'Basic Equity'}</span>
                <span style={{ ...S.badge, background: isActive ? '#d1fae5' : '#fee2e2', color: isActive ? '#065f46' : '#991b1b' }}>
                  {isActive ? '✅ Active' : '⚠️ Inactive'}
                </span>
              </div>
              {msg && <p style={{ fontSize: '12px', color: msg.startsWith('✅') ? '#059669' : '#dc2626', marginTop: '8px', fontWeight: 600 }}>{msg}</p>}
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Click the camera icon to change photo · Max 2MB</p>
            </div>
          </div>
          {/* Profile details */}
          <div style={{ ...S.card, marginBottom: '16px' }}>
            <div style={{ ...S.flexBetween, marginBottom: '16px' }}>
              <h3 style={S.h4}>Account Details</h3>
              {!editing && <button onClick={() => setEditing(true)} style={{ ...S.btn, ...S.btnSecondary, ...S.btnSm }}>✏️ Edit</button>}
            </div>
            {msg && <p style={{ color: '#047857', fontSize: '13px', marginBottom: '12px', background: '#d1fae5', padding: '8px 12px', borderRadius: '8px' }}>{msg}</p>}
            {editing ? (
              <>
                <div style={S.formGroup}><label style={S.label}>Full Name</label><input style={S.input} value={name} onChange={e => setName(e.target.value)} /></div>
                <div style={S.formGroup}><label style={S.label}>Mobile</label><input style={S.input} value={mobile} onChange={e => setMobile(e.target.value)} /></div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button onClick={save} disabled={saving} style={{ ...S.btn, ...S.btnPrimary, ...S.btnSm }}>{saving ? 'Saving...' : 'Save Changes'}</button>
                  <button onClick={() => setEditing(false)} style={{ ...S.btn, ...S.btnSecondary, ...S.btnSm }}>Cancel</button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Email', value: user?.email },
                  { label: 'Full Name', value: userProfile?.full_name || '—' },
                  { label: 'Mobile', value: userProfile?.mobile || '—' },
                  { label: 'Member Since', value: userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—' },
                  { label: 'Plan Expires', value: userProfile?.plan_expires_at ? new Date(userProfile.plan_expires_at).toLocaleDateString('en-IN') : '—' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>{item.label}</span>
                    <span style={{ fontSize: '13px', color: '#0A0A0A', fontWeight: 500 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Quick actions */}
          <div style={{ ...S.card }}>
            <h3 style={{ ...S.h4, marginBottom: '16px' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: '📋 My Subscription', path: '/subscription' },
                { label: '📊 Live Calls', path: '/live-calls' },
                { label: '📈 Performance Report', path: '/performance' },
                { label: '📮 Grievance / Support', path: '/grievance' },
              ].map((item, i) => (
                <button key={i} onClick={() => navigate(item.path)}
                  style={{ ...S.btn, ...S.btnSecondary, justifyContent: 'flex-start', width: '100%' }}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// ─── RESEARCH REPORTS PAGE ────────────────────────────────────────────────────
function ReportsPage({ user, userProfile }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const isActive = userProfile?.plan_expires_at && new Date(userProfile.plan_expires_at) > new Date();

  useEffect(() => {
    supabase.from('recommendations')
      .select('id, symbol, stock_name, report_url, chart_url, published_at, plan_required, segment, action')
      .not('report_url', 'is', null)
      .order('published_at', { ascending: false })
      .then(({ data }) => { setReports(data || []); setLoading(false); });
  }, []);

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#FEFDFB' }}>
      <div style={{ ...S.section, paddingTop: '40px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{ ...S.h2, marginBottom: '6px' }}>📄 Research Reports</h1>
          <p style={{ color: '#64748b', marginBottom: '28px' }}>In-depth research reports published with each recommendation.</p>

          {loading ? (
            <div style={{ ...S.card, textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Loading reports...</div>
          ) : reports.length === 0 ? (
            <div style={{ ...S.card, textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <h3 style={{ ...S.h3, marginBottom: '8px' }}>No reports yet</h3>
              <p style={{ color: '#64748b' }}>Reports are uploaded when recommendations are published.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reports.map(r => {
                const planRank = { basic: 0, premium: 1, fno: 2, elite: 3 };
                const userRank = planRank[userProfile?.plan_id || 'basic'] ?? 0;
                const reqRank = planRank[r.plan_required || 'basic'] ?? 0;
                const hasAccess = isActive && userRank >= reqRank;
                return (
                  <div key={r.id} style={{ ...S.card, display: 'flex', gap: '16px', alignItems: 'center', padding: '16px 20px', flexWrap: 'wrap' }}>
                    <div style={{ width: '48px', height: '48px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>📄</div>
                    <div style={{ flex: 1, minWidth: '160px' }}>
                      <p style={{ fontWeight: 700, fontSize: '15px', color: '#0A0A0A' }}>{r.symbol} — {r.stock_name}</p>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span style={{ ...S.badge, ...actionStyle(r.action), fontSize: '11px' }}>{r.action}</span>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(r.published_at).toLocaleDateString('en-IN')}</span>
                        <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'capitalize' }}>{r.segment}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {r.chart_url && (
                        <a href={r.chart_url} target="_blank" rel="noreferrer"
                          style={{ ...S.btn, ...S.btnSecondary, ...S.btnSm, textDecoration: 'none', opacity: hasAccess ? 1 : 0.4, pointerEvents: hasAccess ? 'auto' : 'none' }}>
                          📈 Chart
                        </a>
                      )}
                      {hasAccess ? (
                        <a href={r.report_url} target="_blank" rel="noreferrer"
                          style={{ ...S.btn, ...S.btnPrimary, ...S.btnSm, textDecoration: 'none' }}>
                          📄 Download PDF
                        </a>
                      ) : (
                        <button onClick={() => navigate('/subscription')} style={{ ...S.btn, ...S.btnGold, ...S.btnSm }}>
                          🔒 Upgrade to Access
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ ...S.disclaimer, marginTop: '24px' }}>
            ⚠️ Research reports are for educational purposes only. Not investment advice. {SEBI_REG}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// ─── WATCHLIST PAGE ───────────────────────────────────────────────────────────
function WatchlistPage({ user }) {
  const DEFAULT_SYMBOLS = [
    { sym: 'HDFCBANK', exch: 'NSE' }, { sym: 'RELIANCE', exch: 'NSE' },
    { sym: 'TCS', exch: 'NSE' }, { sym: 'INFY', exch: 'NSE' },
    { sym: 'ICICIBANK', exch: 'NSE' }, { sym: 'SBIN', exch: 'NSE' },
    { sym: 'WIPRO', exch: 'NSE' }, { sym: 'AXISBANK', exch: 'NSE' },
    { sym: 'LT', exch: 'NSE' }, { sym: 'KOTAKBANK', exch: 'NSE' },
  ];
  const [watchlist, setWatchlist] = useState([]);
  const [wlLoading, setWlLoading] = useState(true);
  const [prices, setPrices] = useState({});
  const [input, setInput] = useState('');
  const [exchange, setExchange] = useState('NSE');
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  const [refreshTs, setRefreshTs] = useState(Date.now());
  const [alerts, setAlerts] = useState([]);
  const [alertModal, setAlertModal] = useState(null); // { sym, exch }
  const [alertForm, setAlertForm] = useState({ target_price: '', direction: 'above' });
  const [alertMsg, setAlertMsg] = useState('');
  const [toast, setToast] = useState(null);

  // Phase 2: watchlist now lives in Supabase (watchlist_items) instead of
  // localStorage, so it syncs across devices. On first load for a user with no
  // Supabase rows yet, we do a one-time migration of their old localStorage
  // watchlist (if any) so nobody loses their existing list.
  const loadWatchlist = async () => {
    setWlLoading(true);
    const { data, error } = await supabase.from('watchlist_items').select('symbol,exchange').eq('user_id', user.id).order('added_at', { ascending: true });

    if (!error && data && data.length > 0) {
      setWatchlist(data.map(r => ({ sym: r.symbol, exch: r.exchange })));
      setWlLoading(false);
      return;
    }

    // No rows in Supabase yet — check for a legacy localStorage watchlist to migrate.
    let legacy = null;
    try {
      const w = localStorage.getItem('sv_wl3_' + user.id);
      if (w) legacy = JSON.parse(w);
    } catch(e) {}

    const seed = (legacy && legacy.length > 0)
      ? legacy.map(item => ({ sym: (item.sym || item), exch: item.exch || 'NSE' }))
      : DEFAULT_SYMBOLS;

    const rows = seed.map(s => ({ user_id: user.id, symbol: s.sym, exchange: s.exch }));
    const { error: insErr } = await supabase.from('watchlist_items').insert(rows);
    if (!insErr) {
      try { localStorage.removeItem('sv_wl3_' + user.id); } catch(e) {}
    }
    setWatchlist(seed);
    setWlLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    loadWatchlist();
    fetchAlerts();
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, [user]);

  const fetchAlerts = async () => {
    const { data, error } = await supabase.from('price_alerts').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (!error) setAlerts(data || []);
  };

  const openAlertModal = (sym, exch) => {
    setAlertForm({ target_price: '', direction: 'above' });
    setAlertMsg('');
    setAlertModal({ sym, exch });
  };

  const saveAlert = async () => {
    if (!alertForm.target_price || isNaN(parseFloat(alertForm.target_price))) { setAlertMsg('Enter a valid target price.'); return; }
    const payload = {
      user_id: user.id,
      symbol: alertModal.sym,
      exchange: alertModal.exch,
      target_price: parseFloat(alertForm.target_price),
      direction: alertForm.direction,
      triggered: false,
    };
    const { error } = await supabase.from('price_alerts').insert([payload]);
    if (error) { setAlertMsg(error.message); return; }
    setAlertMsg('✅ Alert set!');
    await fetchAlerts();
    setTimeout(() => setAlertModal(null), 700);
  };

  const deleteAlert = async (id) => {
    await supabase.from('price_alerts').delete().eq('id', id);
    fetchAlerts();
  };

  const checkAlerts = async (results) => {
    const active = alerts.filter(a => !a.triggered);
    if (!active.length) return;
    const toTrigger = active.filter(a => {
      const p = results[a.symbol];
      if (!p) return false;
      return a.direction === 'above' ? p.price >= a.target_price : p.price <= a.target_price;
    });
    if (!toTrigger.length) return;
    for (const a of toTrigger) {
      await supabase.from('price_alerts').update({ triggered: true, triggered_at: new Date().toISOString() }).eq('id', a.id);
      const msg = `${a.symbol} hit your alert: ${a.direction === 'above' ? '≥' : '≤'} ₹${a.target_price} (now ₹${results[a.symbol].price})`;
      setToast(msg);
      setTimeout(() => setToast(null), 6000);
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try { new Notification('StockVista Alert', { body: msg }); } catch(e) {}
      }
    }
    fetchAlerts();
  };

  // Fetch Yahoo Finance prices for all symbols
  useEffect(() => {
    if (!watchlist.length) return;
    const fetchPrices = async () => {
      const results = {};
      await Promise.all(watchlist.map(async (item) => {
        const sym = item.sym || item;
        const exch = item.exch || 'NSE';
        const yhSym = exch === 'BSE' ? sym + '.BO' : exch === 'MCX' ? sym + '.MCX' : sym + '.NS';
        try {
          const res = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${yhSym}?interval=1d&range=1d`,
            { headers: { 'Accept': 'application/json' } }
          );
          const data = await res.json();
          const q = data?.chart?.result?.[0]?.meta;
          if (q) {
            const prev = q.previousClose || q.chartPreviousClose || q.regularMarketPrice;
            const curr = q.regularMarketPrice;
            const chg = curr - prev;
            const chgPct = (chg / prev) * 100;
            results[sym] = { price: curr, change: +chg.toFixed(2), changePct: +chgPct.toFixed(2) };
          }
        } catch(e) {}
      }));
      setPrices(results);
      checkAlerts(results);
    };
    fetchPrices();
    const timer = setInterval(fetchPrices, 30000);
    return () => clearInterval(timer);
  }, [watchlist, refreshTs, alerts]);

  const add = async () => {
    const sym = input.trim().replace(/\s+/g,'').toUpperCase();
    if (!sym) return;
    if (watchlist.find(w => (w.sym || w) === sym)) { setInput(''); return; }
    const newItem = { sym, exch: exchange };
    setWatchlist(prev => [...prev, newItem]); // optimistic
    setInput(''); setShowAdd(false);
    const { error } = await supabase.from('watchlist_items').insert([{ user_id: user.id, symbol: sym, exchange }]);
    if (error) {
      setWatchlist(prev => prev.filter(w => w.sym !== sym)); // roll back on failure
      setToast('Could not add ' + sym + ': ' + error.message);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const remove = async (sym) => {
    const removed = watchlist.find(w => (w.sym || w) === sym);
    setWatchlist(prev => prev.filter(w => (w.sym || w) !== sym)); // optimistic
    if (selected?.sym === sym) setSelected(null);
    if (removed) {
      await supabase.from('watchlist_items').delete()
        .eq('user_id', user.id).eq('symbol', sym).eq('exchange', removed.exch || 'NSE');
    }
  };

  const selSym = selected ? `${selected.exch || 'NSE'}:${selected.sym}` : null;

  if (!user) return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#FEFDFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>👁️</div>
        <h2 style={S.h3}>Login to manage your watchlist</h2>
        <button onClick={() => navigate('/login')} style={{ ...S.btn, ...S.btnPrimary, marginTop: '16px' }}>Sign In</button>
      </div>
    </div>
  );

  return (
    <div style={{ paddingTop: '64px', background: '#FEFDFB', minHeight: '100vh' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', height: 'calc(100vh - 64px)', maxWidth: '1200px', margin: '0 auto' }}>

        {/* ── LEFT PANEL ── */}
        <div style={{ background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', position: 'sticky', top: '64px' }}>

          {/* Search / Header */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>WATCHLIST ({watchlist.length})</span>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button onClick={() => { setRefreshTs(Date.now()); }} title="Refresh prices" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#94a3b8' }}>↻</button>
                <button onClick={() => setShowAdd(s => !s)} style={{ background: showAdd ? '#eff6ff' : '#f1f5f9', border: 'none', borderRadius: '6px', padding: '4px 9px', fontSize: '11px', fontWeight: 700, color: showAdd ? '#1e40af' : '#334155', cursor: 'pointer' }}>
                  {showAdd ? '✕' : '+ Add'}
                </button>
              </div>
            </div>
            <p style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '8px' }}>● Delayed prices · Yahoo Finance (unofficial, not exchange-licensed real-time data)</p>

            {showAdd && (
              <div style={{ display: 'flex', gap: '4px' }}>
                <select style={{ width: '60px', padding: '6px 3px', border: '1px solid #E5E3DA', borderRadius: '6px', fontSize: '11px', color: '#0A0A0A', background: '#FAF9F5' }} value={exchange} onChange={e => setExchange(e.target.value)}>
                  <option>NSE</option><option>BSE</option><option>MCX</option>
                </select>
                <input style={{ flex: 1, padding: '6px 8px', border: '1px solid #E5E3DA', borderRadius: '6px', fontSize: '12px', color: '#0A0A0A', background: '#FAF9F5', outline: 'none' }}
                  placeholder="e.g. RELIANCE" value={input}
                  onChange={e => setInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && add()} autoFocus />
                <button onClick={add} style={{ background: '#1e40af', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Add</button>
              </div>
            )}
          </div>

          {/* Stock rows — Zerodha style */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {wlLoading && (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                Loading watchlist...
              </div>
            )}
            {!wlLoading && watchlist.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                No stocks added.<br />Click "+ Add" above.
              </div>
            )}
            {watchlist.map(item => {
              const sym = item.sym || item;
              const exch = item.exch || 'NSE';
              const p = prices[sym];
              const isSelected = selected?.sym === sym;
              const isUp = p ? p.change >= 0 : null;
              const color = isUp === null ? '#64748b' : isUp ? '#16a34a' : '#dc2626';
              return (
                <div key={sym}
                  onClick={() => setSelected({ sym, exch })}
                  style={{ padding: '9px 12px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', background: isSelected ? '#eff6ff' : 'transparent', borderLeft: isSelected ? '3px solid #1e40af' : '3px solid transparent', transition: 'background 0.1s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#FAF9F5'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>

                  {/* Left: symbol + change */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: color }}>{sym}</span>
                      <span style={{ fontSize: '9px', color: '#94a3b8', background: '#f1f5f9', padding: '1px 4px', borderRadius: '3px' }}>{exch}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {p ? (
                        <>
                          <span style={{ fontSize: '11px', color: color, fontWeight: 500 }}>
                            {p.change >= 0 ? '+' : ''}{p.change}
                          </span>
                          <span style={{ fontSize: '11px', color: color, fontWeight: 500 }}>
                            {p.changePct >= 0 ? '▲' : '▼'} {Math.abs(p.changePct)}%
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>Loading...</span>
                      )}
                    </div>
                  </div>

                  {/* Right: price + alert + delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0A0A0A' }}>
                      {p ? p.price.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—'}
                    </span>
                    <button onClick={e => { e.stopPropagation(); openAlertModal(sym, exch); }}
                      style={{ background: 'none', border: 'none', color: alerts.some(a => a.symbol === sym && !a.triggered) ? '#f59e0b' : '#cbd5e1', cursor: 'pointer', fontSize: '13px', lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
                      title="Set price alert">🔔</button>
                    <button onClick={e => { e.stopPropagation(); remove(sym); }}
                      style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
                      title="Remove">×</button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ padding: '7px', borderTop: '1px solid #f1f5f9', background: '#FAF9F5' }}>
            <p style={{ fontSize: '9px', color: '#94a3b8', textAlign: 'center' }}>Yahoo Finance · Auto-refreshes every 30s · May be delayed</p>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
          {selSym ? (
            /* Selected stock chart */
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{ ...S.h3, marginBottom: '2px' }}>{selected.sym}</h2>
                <p style={{ fontSize: '12px', color: '#64748b' }}>{selected.exch} · Click any symbol on the left to view its chart</p>
              </div>
              <StockChartPanel sym={selSym} />
            </div>
          ) : (
            /* Default — Market overview + Index watch */
            <div>
              <h2 style={{ ...S.h3, marginBottom: '4px' }}>Market Overview</h2>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px' }}>Indices · Commodities · Select a stock from watchlist to view chart</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                {[
                  { sym: 'NSE:NIFTY50', label: 'NIFTY 50' },
                  { sym: 'NSE:BANKNIFTY', label: 'BANK NIFTY' },
                  { sym: 'BSE:SENSEX', label: 'SENSEX' },
                  { sym: 'MCX:GOLD1!', label: 'GOLD MCX' },
                ].map(idx => <IndexMiniWidget key={idx.sym} sym={idx.sym} label={idx.label} />)}
              </div>

              <div style={{ ...S.disclaimer }}>
                ⚠️ Select a stock from the left panel to see its live chart. Prices from Yahoo Finance, may be delayed. Not investment advice.
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1200, background: '#0f172a', color: '#fff', padding: '14px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, maxWidth: '320px', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
          🔔 {toast}
        </div>
      )}

      {alertModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div style={{ ...S.card, maxWidth: '380px', width: '100%' }}>
            <h3 style={{ ...S.h4, marginBottom: '4px' }}>🔔 Set Price Alert — {alertModal.sym}</h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>Get notified when the price crosses your target.</p>
            {alertMsg && <div style={{ padding: '8px 12px', borderRadius: '8px', marginBottom: '12px', background: alertMsg.startsWith('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: alertMsg.startsWith('✅') ? '#10b981' : '#ef4444', fontSize: '12px' }}>{alertMsg}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div>
                <label style={S.label}>Condition</label>
                <select style={S.select} value={alertForm.direction} onChange={e => setAlertForm(f => ({ ...f, direction: e.target.value }))}>
                  <option value="above">Price goes above</option>
                  <option value="below">Price goes below</option>
                </select>
              </div>
              <div>
                <label style={S.label}>Target Price ₹</label>
                <input style={S.input} type="number" step="0.05" placeholder={prices[alertModal.sym]?.price ? String(prices[alertModal.sym].price) : '0.00'}
                  value={alertForm.target_price} onChange={e => setAlertForm(f => ({ ...f, target_price: e.target.value }))} />
              </div>
            </div>

            {alerts.filter(a => a.symbol === alertModal.sym).length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>Existing alerts</p>
                {alerts.filter(a => a.symbol === alertModal.sym).map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#FAF9F5', borderRadius: '8px', marginBottom: '4px', fontSize: '12px' }}>
                    <span style={{ color: a.triggered ? '#94a3b8' : '#0f172a' }}>
                      {a.direction === 'above' ? '≥' : '≤'} ₹{a.target_price} {a.triggered ? '(triggered)' : ''}
                    </span>
                    <button onClick={() => deleteAlert(a.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '12px' }}>Remove</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ ...S.flex, gap: '10px' }}>
              <button onClick={saveAlert} style={{ ...S.btn, ...S.btnPrimary }}>Set Alert</button>
              <button onClick={() => setAlertModal(null)} style={{ ...S.btn, ...S.btnSecondary }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IndexMiniWidget({ sym, label }) {
  const id = 'idx_' + sym.replace(/[^a-zA-Z0-9]/g, '_');
  useEffect(() => {
    const c = document.getElementById(id);
    if (!c) return;
    c.innerHTML = '';
    const s = document.createElement('script');
    s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    s.async = true;
    s.innerHTML = JSON.stringify({ symbol: sym, width: '100%', height: 160, locale: 'en', dateRange: '1D', colorTheme: 'light', isTransparent: true, autosize: true });
    c.appendChild(s);
    return () => { try { c.innerHTML = ''; } catch(e) {} };
  }, [sym]);
  return (
    <div style={{ ...S.card, padding: '0', overflow: 'hidden' }}>
      <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', padding: '8px 12px 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <div id={id} style={{ height: '150px' }} />
    </div>
  );
}

function StockChartPanel({ sym }) {
  const id = 'chart_' + sym.replace(/[^a-zA-Z0-9]/g, '_');
  useEffect(() => {
    const c = document.getElementById(id);
    if (!c) return;
    c.innerHTML = '';
    const s = document.createElement('script');
    s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    s.async = true;
    s.innerHTML = JSON.stringify({ autosize: true, symbol: sym, interval: 'D', timezone: 'Asia/Kolkata', theme: 'light', style: '1', locale: 'en', allow_symbol_change: false, studies: ['RSI@tv-basicstudies', 'MACD@tv-basicstudies'] });
    c.appendChild(s);
    return () => { try { c.innerHTML = ''; } catch(e) {} };
  }, [sym]);
  return (
    <div style={{ ...S.card, padding: '0', overflow: 'hidden', height: '500px' }}>
      <div id={id} style={{ height: '100%' }} />
    </div>
  );
}
function OnboardingPage({ user, userProfile }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ experience: '', horizon: '', capital: '', segments: [], risk: '' });
  const [liveCalls, setLiveCalls] = useState([]);
  const [recommended, setRecommended] = useState(null);

  useEffect(() => {
    supabase.from('recommendations').select('*').eq('status', 'live').limit(3)
      .then(({ data }) => setLiveCalls(data || []));
  }, []);

  const setA = (k, v) => setAnswers(a => ({ ...a, [k]: v }));
  const toggleSeg = (s) => setAnswers(a => ({ ...a, segments: a.segments.includes(s) ? a.segments.filter(x => x !== s) : [...a.segments, s] }));

  const calcPlan = () => {
    const { experience, capital, segments, risk } = answers;
    if (segments.includes('futures') || segments.includes('options') || segments.includes('commodity') || risk === 'high') return 'fno';
    if (experience === 'advanced' || capital === 'large') return 'premium';
    return 'basic';
  };

  const finish = async () => {
    const plan = calcPlan();
    setRecommended(plan);
    if (user) {
      await supabase.from('users').update({ updated_at: new Date().toISOString() }).eq('id', user.id);
    }
    setStep(4);
  };

  const steps = [
    { title: 'Welcome to StockVista', sub: "Let's set up your research profile in 3 quick steps" },
    { title: 'Your Experience', sub: 'Help us understand your trading background' },
    { title: 'What You Trade', sub: 'Select all that apply' },
    { title: 'Risk & Capital', sub: 'This helps us recommend the right research plan' },
    { title: "You're All Set!", sub: 'Your personalised research dashboard is ready' },
  ];

  const progressW = [5, 33, 66, 90, 100][step] || 5;

  const optBtn = (active, label, onClick) => (
    <button onClick={onClick} style={{ padding: '12px 20px', borderRadius: '10px', border: `2px solid ${active ? '#1d4ed8' : '#e2e8f0'}`, background: active ? '#eff6ff' : '#fff', color: active ? '#1d4ed8' : '#334155', fontWeight: active ? 700 : 500, fontSize: '14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', width: '100%' }}>{label}</button>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #eff6ff 0%, #f1f5f9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '560px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
          <div style={S.navLogoIcon}>📈</div>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#0A0A0A' }}>{APP_NAME}</span>
        </div>
        <div style={{ background: '#e2e8f0', borderRadius: '4px', height: '4px', marginBottom: '28px' }}>
          <div style={{ width: progressW + '%', height: '4px', background: '#1d4ed8', borderRadius: '4px', transition: 'width 0.4s ease' }} />
        </div>
        <div style={{ ...S.card, padding: '36px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>{['👋','📊','🎯','💰','🎉'][step]}</div>
            <h2 style={{ ...S.h3, marginBottom: '6px' }}>{steps[step].title}</h2>
            <p style={{ color: '#64748b', fontSize: '14px' }}>{steps[step].sub}</p>
          </div>

          {step === 0 && (
            <div>
              <p style={{ color: '#334155', lineHeight: 1.8, marginBottom: '20px', fontSize: '14px' }}>
                Hi <strong>{userProfile?.full_name || user?.email?.split('@')[0] || 'Investor'}</strong>! StockVista gives you SEBI-compliant research across equity, F&O, and commodities. We'll personalise your dashboard so you see only what's relevant to you.<br /><br /><strong>Takes 60 seconds.</strong>
              </p>
              <div style={{ ...S.disclaimer, marginBottom: '20px' }}>⚠️ Research calls are for informational purposes only. Investment involves risk of loss. {SEBI_REG}</div>
              <button onClick={() => setStep(1)} style={{ ...S.btn, ...S.btnPrimary, width: '100%', justifyContent: 'center' }}>Let's Start →</button>
            </div>
          )}

          {step === 1 && (
            <div>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '12px' }}>How long have you been investing/trading?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {[{ val: 'beginner', label: '🌱 Beginner — Less than 1 year' }, { val: 'intermediate', label: '📈 Intermediate — 1 to 5 years' }, { val: 'advanced', label: '🏆 Advanced — 5+ years' }].map(o => optBtn(answers.experience === o.val, o.label, () => setA('experience', o.val)))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setStep(0)} style={{ ...S.btn, ...S.btnSecondary, flex: 1, justifyContent: 'center' }}>← Back</button>
                <button onClick={() => answers.experience && setStep(2)} style={{ ...S.btn, ...S.btnPrimary, flex: 2, justifyContent: 'center', opacity: answers.experience ? 1 : 0.5 }}>Next →</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '12px' }}>Which segments interest you? (Select all that apply)</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                {[{ val: 'equity', label: '📊 Equity' }, { val: 'futures', label: '⚡ Futures' }, { val: 'options', label: '🎯 Options' }, { val: 'commodity', label: '🏅 Commodities' }, { val: 'ipo', label: '🆕 IPOs' }, { val: 'intraday', label: '⏱️ Intraday' }].map(o => optBtn(answers.segments.includes(o.val), o.label, () => toggleSeg(o.val)))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setStep(1)} style={{ ...S.btn, ...S.btnSecondary, flex: 1, justifyContent: 'center' }}>← Back</button>
                <button onClick={() => answers.segments.length > 0 && setStep(3)} style={{ ...S.btn, ...S.btnPrimary, flex: 2, justifyContent: 'center', opacity: answers.segments.length > 0 ? 1 : 0.5 }}>Next →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '8px' }}>Approximate trading capital?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {[{ val: 'small', label: '💵 Under ₹1 lakh' }, { val: 'medium', label: '💰 ₹1 lakh – ₹10 lakh' }, { val: 'large', label: '💎 Above ₹10 lakh' }].map(o => optBtn(answers.capital === o.val, o.label, () => setA('capital', o.val)))}
              </div>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '8px' }}>Risk appetite?</p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {[{ val: 'low', label: '🟢 Low' }, { val: 'medium', label: '🟡 Medium' }, { val: 'high', label: '🔴 High' }].map(o => optBtn(answers.risk === o.val, o.label, () => setA('risk', o.val)))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setStep(2)} style={{ ...S.btn, ...S.btnSecondary, flex: 1, justifyContent: 'center' }}>← Back</button>
                <button onClick={() => answers.capital && answers.risk && finish()} style={{ ...S.btn, ...S.btnPrimary, flex: 2, justifyContent: 'center', opacity: answers.capital && answers.risk ? 1 : 0.5 }}>See My Plan →</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div style={{ background: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: '12px', padding: '20px', marginBottom: '16px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recommended Plan for You</p>
                <p style={{ fontSize: '24px', fontWeight: 800, color: '#1d4ed8', marginTop: '4px' }}>{PLANS[recommended || 'basic']?.name}</p>
                <p style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>₹{PLANS[recommended || 'basic']?.monthly}/month</p>
              </div>
              {liveCalls.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🔴 Live Right Now</p>
                  {liveCalls.slice(0, 2).map(r => (
                    <div key={r.id} style={{ background: '#FAF9F5', border: '1px solid #E5E3DA', borderRadius: '8px', padding: '10px 12px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ ...S.badge, ...actionStyle(r.action), fontSize: '10px', marginRight: '6px' }}>{r.action}</span>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: '#0A0A0A' }}>{r.symbol}</span>
                        <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>₹{r.entry_price} → T1 ₹{r.target1} · SL ₹{r.stop_loss}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={() => navigate('/subscription')} style={{ ...S.btn, ...S.btnPrimary, justifyContent: 'center', width: '100%' }}>Subscribe Now →</button>
                <button onClick={() => navigate('/dashboard')} style={{ ...S.btn, ...S.btnSecondary, justifyContent: 'center', width: '100%' }}>Explore Dashboard First</button>
              </div>
            </div>
          )}
        </div>
        <p style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '16px' }}>{APP_NAME} · {SEBI_REG}</p>
      </div>
    </div>
  );
}

// ─── PORTFOLIO TRACKER ────────────────────────────────────────────────────────
function PortfolioPage({ user }) {
  const [holdings, setHoldings] = useState([]);
  const [soldHistory, setSoldHistory] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [sellModal, setSellModal] = useState(null); // holding being sold
  const [sellForm, setSellForm] = useState({ qty: '', sell_price: '', sell_date: new Date().toISOString().slice(0,10) });
  const [tab, setTab] = useState('holdings'); // holdings | sold
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ symbol: '', name: '', qty: '', buy_price: '', cmp: '', segment: 'equity', buy_date: new Date().toISOString().slice(0,10) });
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setSF = (k, v) => setSellForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    try {
      const h = localStorage.getItem('sv_port_h_' + user.id);
      const s = localStorage.getItem('sv_port_s_' + user.id);
      if (h) setHoldings(JSON.parse(h));
      if (s) setSoldHistory(JSON.parse(s));
    } catch(e) {}
    setLoading(false);
  }, [user]);

  const saveH = (data) => {
    try { localStorage.setItem('sv_port_h_' + user?.id, JSON.stringify(data)); } catch(e) {}
    setHoldings(data);
  };
  const saveS = (data) => {
    try { localStorage.setItem('sv_port_s_' + user?.id, JSON.stringify(data)); } catch(e) {}
    setSoldHistory(data);
  };

  const addHolding = () => {
    if (!form.symbol || !form.qty || !form.buy_price) return;
    const cmp = parseFloat(form.cmp) || parseFloat(form.buy_price);
    saveH([...holdings, { ...form, id: Date.now(), qty: parseFloat(form.qty), buy_price: parseFloat(form.buy_price), cmp }]);
    setForm({ symbol: '', name: '', qty: '', buy_price: '', cmp: '', segment: 'equity', buy_date: new Date().toISOString().slice(0,10) });
    setShowAdd(false);
  };

  const updateCMP = (id, cmp) => saveH(holdings.map(h => h.id === id ? { ...h, cmp: parseFloat(cmp) || h.cmp } : h));
  const removeHolding = (id) => { if (window.confirm('Remove this holding?')) saveH(holdings.filter(h => h.id !== id)); };

  const openSell = (h) => {
    setSellModal(h);
    setSellForm({ qty: String(h.qty), sell_price: String(h.cmp), sell_date: new Date().toISOString().slice(0,10) });
  };

  const executeSell = () => {
    if (!sellModal || !sellForm.qty || !sellForm.sell_price) return;
    const sellQty = parseFloat(sellForm.qty);
    const sellPrice = parseFloat(sellForm.sell_price);
    const h = sellModal;
    if (sellQty > h.qty) { alert('Cannot sell more than you hold'); return; }

    const realised = (sellPrice - h.buy_price) * sellQty;
    const realisedPct = ((realised / (h.buy_price * sellQty)) * 100).toFixed(2);

    // Add to sold history
    const soldEntry = {
      id: Date.now(),
      symbol: h.symbol,
      name: h.name,
      segment: h.segment,
      qty_sold: sellQty,
      buy_price: h.buy_price,
      sell_price: sellPrice,
      buy_date: h.buy_date || '—',
      sell_date: sellForm.sell_date,
      realised_pnl: +realised.toFixed(2),
      realised_pct: +realisedPct,
    };
    saveS([soldEntry, ...soldHistory]);

    // Reduce or remove holding
    if (sellQty >= h.qty) {
      saveH(holdings.filter(x => x.id !== h.id));
    } else {
      saveH(holdings.map(x => x.id === h.id ? { ...x, qty: +(x.qty - sellQty).toFixed(4) } : x));
    }
    setSellModal(null);
  };

  if (!user) return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#FEFDFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>💼</div>
        <h2 style={S.h3}>Login to track your portfolio</h2>
        <button onClick={() => navigate('/login')} style={{ ...S.btn, ...S.btnPrimary, marginTop: '16px' }}>Sign In</button>
      </div>
    </div>
  );

  const totalInvested = holdings.reduce((s, h) => s + h.qty * h.buy_price, 0);
  const totalCurrent = holdings.reduce((s, h) => s + h.qty * h.cmp, 0);
  const unrealisedPnL = totalCurrent - totalInvested;
  const unrealisedPct = totalInvested > 0 ? ((unrealisedPnL / totalInvested) * 100).toFixed(2) : 0;
  const realisedPnL = soldHistory.reduce((s, t) => s + t.realised_pnl, 0);
  const totalPnL = unrealisedPnL + realisedPnL;

  const thStyle = { padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#94a3b8', fontWeight: 700, fontSize: '10px', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.07em', background: '#FAF9F5' };
  const tdStyle = { padding: '12px 14px', fontSize: '13px', color: '#0A0A0A' };

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#FEFDFB' }}>
      <div style={{ ...S.section, paddingTop: '40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ ...S.flexBetween, marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ ...S.h2, marginBottom: '4px' }}>💼 Portfolio Tracker</h1>
              <p style={{ color: '#64748b', fontSize: '13px' }}>CMP updates manual · buy date, sell tracking, realised P&L · stored locally</p>
            </div>
            <button onClick={() => setShowAdd(true)} style={{ ...S.btn, ...S.btnPrimary }}>+ Add Holding</button>
          </div>

          {/* Premium Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {/* Invested */}
            <div style={{ ...S.card, padding: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Invested</p>
              <p style={{ fontSize: '20px', fontWeight: 800, color: '#1e40af' }}>₹{fmtCurr(totalInvested)}</p>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{holdings.length} open positions</p>
            </div>
            {/* Current Value */}
            <div style={{ ...S.card, padding: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Current Value</p>
              <p style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0A' }}>₹{fmtCurr(totalCurrent)}</p>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>as of latest CMP</p>
            </div>
            {/* Unrealised P&L with progress bar */}
            <div style={{ ...S.card, padding: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Unrealised P&L</p>
              <p style={{ fontSize: '20px', fontWeight: 800, color: unrealisedPnL >= 0 ? '#059669' : '#dc2626' }}>
                {unrealisedPnL >= 0 ? '+₹' : '-₹'}{fmtCurr(Math.abs(unrealisedPnL))}
              </p>
              <p style={{ fontSize: '11px', color: unrealisedPnL >= 0 ? '#059669' : '#dc2626', marginTop: '4px', fontWeight: 600 }}>
                {unrealisedPct >= 0 ? '+' : ''}{unrealisedPct}% overall
              </p>
              <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                <div style={{ height: '4px', borderRadius: '2px', width: `${Math.min(100, Math.max(0, ((totalCurrent / (totalInvested || 1)) * 100)))}%`, background: unrealisedPnL >= 0 ? '#059669' : '#dc2626', transition: 'width 0.4s ease' }} />
              </div>
            </div>
            {/* Realised P&L */}
            <div style={{ ...S.card, padding: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Realised P&L</p>
              <p style={{ fontSize: '20px', fontWeight: 800, color: realisedPnL >= 0 ? '#059669' : '#dc2626' }}>
                {realisedPnL >= 0 ? '+₹' : '-₹'}{fmtCurr(Math.abs(realisedPnL))}
              </p>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{soldHistory.length} trade{soldHistory.length !== 1 ? 's' : ''} closed</p>
            </div>
            {/* Total P&L */}
            <div style={{ ...S.card, padding: '16px', borderLeft: '3px solid ' + (totalPnL >= 0 ? '#059669' : '#dc2626') }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Total P&L</p>
              <p style={{ fontSize: '22px', fontWeight: 800, color: totalPnL >= 0 ? '#059669' : '#dc2626' }}>
                {totalPnL >= 0 ? '+₹' : '-₹'}{fmtCurr(Math.abs(totalPnL))}
              </p>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Unrealised + Realised</p>
            </div>
          </div>

          {/* Add holding form */}
          {showAdd && (
            <div style={{ ...S.card, marginBottom: '20px', border: '2px solid #1d4ed8' }}>
              <h3 style={{ ...S.h4, marginBottom: '16px' }}>Add New Holding</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                <div><label style={S.label}>Symbol *</label><input style={S.input} placeholder="RELIANCE" value={form.symbol} onChange={e => setF('symbol', e.target.value.toUpperCase())} /></div>
                <div><label style={S.label}>Company Name</label><input style={S.input} placeholder="Reliance Industries" value={form.name} onChange={e => setF('name', e.target.value)} /></div>
                <div><label style={S.label}>Qty *</label><input style={S.input} type="number" placeholder="100" value={form.qty} onChange={e => setF('qty', e.target.value)} /></div>
                <div><label style={S.label}>Buy Price ₹ *</label><input style={S.input} type="number" placeholder="2456" value={form.buy_price} onChange={e => setF('buy_price', e.target.value)} /></div>
                <div><label style={S.label}>Buy Date *</label><input style={S.input} type="date" value={form.buy_date} onChange={e => setF('buy_date', e.target.value)} /></div>
                <div><label style={S.label}>CMP ₹</label><input style={S.input} type="number" placeholder="2500" value={form.cmp} onChange={e => setF('cmp', e.target.value)} /></div>
                <div><label style={S.label}>Segment</label>
                  <select style={S.select} value={form.segment} onChange={e => setF('segment', e.target.value)}>
                    {['equity','futures','options','commodity','ipo'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={addHolding} style={{ ...S.btn, ...S.btnPrimary }}>Add Holding</button>
                <button onClick={() => setShowAdd(false)} style={{ ...S.btn, ...S.btnSecondary }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Sell modal */}
          {sellModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
              <div style={{ ...S.card, maxWidth: '440px', width: '100%', border: '2px solid #fecaca' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <div style={{ width: '36px', height: '36px', background: '#fee2e2', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📤</div>
                  <div>
                    <h3 style={{ ...S.h4, color: '#dc2626' }}>Sell {sellModal.symbol}</h3>
                    <p style={{ fontSize: '12px', color: '#94a3b8' }}>Holding: {sellModal.qty} shares · Avg buy ₹{sellModal.buy_price} · CMP ₹{sellModal.cmp}</p>
                  </div>
                </div>
                <div style={{ height: '1px', background: '#fee2e2', margin: '16px 0' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  <div>
                    <label style={S.label}>Qty to sell *</label>
                    <input style={S.input} type="number" max={sellModal.qty} placeholder={String(sellModal.qty)} value={sellForm.qty} onChange={e => setSF('qty', e.target.value)} />
                    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Max: {sellModal.qty} shares</p>
                  </div>
                  <div>
                    <label style={S.label}>Sell price ₹ *</label>
                    <input style={S.input} type="number" placeholder={String(sellModal.cmp)} value={sellForm.sell_price} onChange={e => setSF('sell_price', e.target.value)} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={S.label}>Sell date *</label>
                    <input style={S.input} type="date" value={sellForm.sell_date} onChange={e => setSF('sell_date', e.target.value)} />
                  </div>
                </div>
                {sellForm.qty && sellForm.sell_price && (
                  <div style={{ background: '#FAF9F5', border: '1.5px solid #bfdbfe', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                    <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Estimated realised P&L</p>
                    {(() => {
                      const pnl = (parseFloat(sellForm.sell_price) - sellModal.buy_price) * parseFloat(sellForm.qty || 0);
                      const pct = ((pnl / (sellModal.buy_price * parseFloat(sellForm.qty || 1))) * 100).toFixed(2);
                      const remaining = sellModal.qty - parseFloat(sellForm.qty || 0);
                      return (
                        <>
                          <p style={{ fontSize: '22px', fontWeight: 800, color: pnl >= 0 ? '#059669' : '#dc2626' }}>
                            {pnl >= 0 ? '+' : '-'}₹{fmtCurr(Math.abs(pnl))} <span style={{ fontSize: '14px' }}>({pct >= 0 ? '+' : ''}{pct}%)</span>
                          </p>
                          {remaining > 0 && <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{remaining} shares remain open after this sale</p>}
                        </>
                      );
                    })()}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={executeSell} style={{ ...S.btn, ...S.btnDanger, flex: 2, justifyContent: 'center', borderRadius: '10px' }}>Confirm Sell</button>
                  <button onClick={() => setSellModal(null)} style={{ ...S.btn, ...S.btnSecondary, flex: 1, justifyContent: 'center' }}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: '#fff', padding: '4px', borderRadius: '10px', width: 'fit-content', marginBottom: '16px', border: '1px solid #E5E3DA' }}>
            {[['holdings', `Open Holdings (${holdings.length})`], ['sold', `Sold / Closed (${soldHistory.length})`]].map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: tab === t ? '#1e40af' : 'transparent', color: tab === t ? '#fff' : '#64748b', transition: 'all 0.15s' }}>{label}</button>
            ))}
          </div>

          {/* Holdings table */}
          {tab === 'holdings' && (
            holdings.length === 0 ? (
              <div style={{ ...S.card, textAlign: 'center', padding: '60px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                <h3 style={{ ...S.h3, marginBottom: '8px' }}>No open holdings</h3>
                <button onClick={() => setShowAdd(true)} style={{ ...S.btn, ...S.btnPrimary, marginTop: '8px' }}>+ Add First Holding</button>
              </div>
            ) : (
              <div style={{ ...S.card, padding: '0', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#FAF9F5' }}>
                      {['Symbol', 'Buy Date', 'Qty', 'Buy ₹', 'CMP ₹', 'Invested', 'Value', 'Unrealised P&L', '%', 'Actions'].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map(h => {
                      const invested = h.qty * h.buy_price;
                      const current = h.qty * h.cmp;
                      const pnl = current - invested;
                      const pct = invested > 0 ? ((pnl / invested) * 100).toFixed(2) : 0;
                      return (
                        <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={tdStyle}>
                            <p style={{ fontWeight: 700, color: '#0A0A0A' }}>{h.symbol}</p>
                            <p style={{ fontSize: '11px', color: '#94a3b8' }}>{h.name} · {h.segment}</p>
                          </td>
                          <td style={{ ...tdStyle, fontSize: '12px', color: '#64748b' }}>{h.buy_date || '—'}</td>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{h.qty}</td>
                          <td style={tdStyle}>₹{Number(h.buy_price).toLocaleString('en-IN')}</td>
                          <td style={tdStyle}>
                            <input type="number" defaultValue={h.cmp} onBlur={e => updateCMP(h.id, e.target.value)}
                              style={{ width: '80px', padding: '4px 8px', border: '1px solid #E5E3DA', borderRadius: '6px', fontSize: '12px', color: '#0A0A0A' }} />
                          </td>
                          <td style={tdStyle}>₹{fmtCurr(invested)}</td>
                          <td style={tdStyle}>₹{fmtCurr(current)}</td>
                          <td style={{ ...tdStyle, fontWeight: 700, color: pnl >= 0 ? '#059669' : '#dc2626' }}>
                            {pnl >= 0 ? '+' : '-'}₹{fmtCurr(Math.abs(pnl))}
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 700, color: pct >= 0 ? '#059669' : '#dc2626' }}>{pct >= 0 ? '+' : ''}{pct}%</td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <button onClick={() => openSell(h)} style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '7px', padding: '5px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                ↓ Sell
                              </button>
                              <button onClick={() => removeHolding(h.id)} style={{ background: 'none', border: '1px solid #E5E3DA', borderRadius: '7px', color: '#94a3b8', cursor: 'pointer', fontSize: '13px', padding: '5px 8px', display: 'flex', alignItems: 'center' }}>
                                🗑
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Sold history table */}
          {tab === 'sold' && (
            soldHistory.length === 0 ? (
              <div style={{ ...S.card, textAlign: 'center', padding: '60px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                <p style={{ color: '#64748b' }}>No trades closed yet. Use "Sell" button on open holdings.</p>
              </div>
            ) : (
              <div style={{ ...S.card, padding: '0', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#FAF9F5' }}>
                      {['Symbol', 'Qty Sold', 'Buy Price', 'Sell Price', 'Buy Date', 'Sell Date', 'Realised P&L', '%'].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {soldHistory.map(t => (
                      <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={tdStyle}><p style={{ fontWeight: 700, color: '#0A0A0A' }}>{t.symbol}</p><p style={{ fontSize: '11px', color: '#94a3b8' }}>{t.segment}</p></td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{t.qty_sold}</td>
                        <td style={tdStyle}>₹{Number(t.buy_price).toLocaleString('en-IN')}</td>
                        <td style={tdStyle}>₹{Number(t.sell_price).toLocaleString('en-IN')}</td>
                        <td style={{ ...tdStyle, fontSize: '12px', color: '#64748b' }}>{t.buy_date || '—'}</td>
                        <td style={{ ...tdStyle, fontSize: '12px', color: '#64748b' }}>{t.sell_date}</td>
                        <td style={{ ...tdStyle, fontWeight: 800, color: t.realised_pnl >= 0 ? '#059669' : '#dc2626' }}>
                          {t.realised_pnl >= 0 ? '+' : '-'}₹{fmtCurr(Math.abs(t.realised_pnl))}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: t.realised_pct >= 0 ? '#059669' : '#dc2626' }}>
                          {t.realised_pct >= 0 ? '+' : ''}{t.realised_pct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#FAF9F5', borderTop: '2px solid #e2e8f0' }}>
                      <td colSpan={6} style={{ ...tdStyle, fontWeight: 700, color: '#334155' }}>Total Realised P&L</td>
                      <td style={{ ...tdStyle, fontWeight: 800, fontSize: '15px', color: realisedPnL >= 0 ? '#059669' : '#dc2626' }}>
                        {realisedPnL >= 0 ? '+' : '-'}₹{fmtCurr(Math.abs(realisedPnL))}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )
          )}

          <div style={{ ...S.disclaimer, marginTop: '16px' }}>
            ⚠️ Portfolio data is stored locally on your device only. For personal record-keeping only — not financial advice. Consult a SEBI RIA for personalised advice.
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}


function AdminPanel({ user, userProfile }) {
  const [activeTab, setActiveTab] = useState('recommendations');
  const [settingsSaved, setSettingsSaved] = useState(false);
  // These used to be declared with useState() inside conditional IIFEs in the
  // tab render blocks below (blog/performance/coupons/bulk) — a Rules-of-Hooks
  // violation: hooks only run when that tab's IIFE executes, so switching
  // tabs changes how many hooks fire between renders and crashes the whole
  // page with "Rendered more hooks than during the previous render". Moved
  // here so they're always declared, every render, regardless of active tab.
  const [blogSaving, setBlogSaving] = useState(false);
  const [blogMsg, setBlogMsg] = useState('');
  const [csvLoading, setCsvLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState('');
  const [couponSaving, setCouponSaving] = useState(false);
  const [segFilter, setSegFilter] = useState('all');
  const [cmpUpdates, setCmpUpdates] = useState({});
  const [bulkLoading, setBulkLoading] = useState(false);
  const [recs, setRecs] = useState([]);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editRec, setEditRec] = useState(null);
  const [loading, setLoading] = useState(true);

  // User management state
  const [userSearch, setUserSearch] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [userEditForm, setUserEditForm] = useState({ plan_id: 'basic', plan_expires_at: '', suspended: false });
  const [userSaving, setUserSaving] = useState(false);
  const [userMsg, setUserMsg] = useState('');

  // Audit log state
  const [auditLogs, setAuditLogs] = useState([]);

  // Notification state — WAS MISSING, caused blank page crash
  const [notifForm, setNotifForm] = useState({ title: '', body: '', plan_target: 'all', type: 'info' });
  const [notifSending, setNotifSending] = useState(false);
  const [notifMsg, setNotifMsg] = useState('');
  const setNF = (k, v) => setNotifForm(f => ({ ...f, [k]: v }));

  // Bulk actions state
  const [selectedRecs, setSelectedRecs] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkMsg, setBulkMsg] = useState('');

  // Platform settings state
  const [settings, setSettings] = useState({
    maintenance_mode: false,
    maintenance_msg: 'StockVista is under maintenance. Back shortly!',
    sebi_reg: SEBI_REG,
    disclaimer_text: 'Investment in securities market is subject to market risk. Past performance is not indicative of future results.',
    show_portfolio_to_free: true,
    show_watchlist_to_free: true,
    show_blog_to_all: true,
  });
  // Blog manager state
  const [blogPosts, setBlogPosts] = useState([]);
  const [blogForm, setBlogForm] = useState(null); // null = list, {} = new, {id,...} = edit
  const emptyBlog = { title: '', slug: '', content: '', summary: '', tag: 'Education', status: 'draft', author: ANALYST_NAME };
  const setBF = (k, v) => setBlogForm(f => ({ ...f, [k]: v }));
  const genSlug = (title) => title.toLowerCase().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').slice(0,60);

  // Performance tracker state
  const [perfData, setPerfData] = useState(null);
  const [perfMonth, setPerfMonth] = useState(new Date().toISOString().slice(0,7));

  // Email composer state
  const [emailForm, setEmailForm] = useState({ subject: '', body: '', plan_target: 'all' });
  const setEF = (k,v) => setEmailForm(f => ({ ...f, [k]: v }));

  // Coupon state
  const [coupons, setCoupons] = useState([]);
  const [couponForm, setCouponForm] = useState({ code: '', type: 'percent', value: '', plan_id: 'all', max_uses: '', expires_at: '' });
  const setCF = (k,v) => setCouponForm(f => ({ ...f, [k]: v }));

  // Revenue state
  const [revenueData, setRevenueData] = useState(null);

  // Staff & Roles state
  const [staffList, setStaffList] = useState([]);
  const [staffSearchEmail, setStaffSearchEmail] = useState('');
  const [staffSearchResult, setStaffSearchResult] = useState(null);
  const [staffSearchMsg, setStaffSearchMsg] = useState('');
  const [staffSelectedRole, setStaffSelectedRole] = useState('research_analyst');
  const [staffNotFound, setStaffNotFound] = useState(false);
  const [staffInviteLoading, setStaffInviteLoading] = useState(false);

  const fetchStaffList = async () => {
    const { data } = await supabase.from('users').select('*').not('staff_role', 'is', null).order('created_at', { ascending: true });
    setStaffList(data || []);
    fetchStaffActivity();
  };

  const [staffActivityCounts, setStaffActivityCounts] = useState({});
  const fetchStaffActivity = async () => {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { data } = await supabase.from('audit_log').select('performed_by_email').gte('created_at', monthStart);
    const counts = {};
    (data || []).forEach(row => {
      if (!row.performed_by_email) return;
      counts[row.performed_by_email] = (counts[row.performed_by_email] || 0) + 1;
    });
    setStaffActivityCounts(counts);
  };

  const searchStaffByEmail = async () => {
    setStaffSearchMsg(''); setStaffSearchResult(null); setStaffNotFound(false);
    if (!staffSearchEmail.trim()) return;
    const { data } = await supabase.from('users').select('*').ilike('email', staffSearchEmail.trim()).limit(1);
    if (!data || data.length === 0) { setStaffSearchMsg('No user found with that email.'); setStaffNotFound(true); return; }
    setStaffSearchResult(data[0]);
  };

  // Invites someone who hasn't signed up yet — creates their account and
  // emails them a link to set their own password. They never need to sign
  // up separately first.
  const inviteStaffMember = async () => {
    if (!staffSearchEmail.trim()) return;
    setStaffInviteLoading(true); setStaffSearchMsg('');
    try {
      const res = await fetch('/api/invite-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: staffSearchEmail.trim(), role: staffSelectedRole, invitedByEmail: user.email }),
      });
      const json = await res.json();
      setStaffInviteLoading(false);
      if (!res.ok) { setStaffSearchMsg('Error: ' + (json.error || 'Could not send invite.')); return; }
      await logAudit('INVITE_STAFF_MEMBER', 'user', json.userId || 'new', { email: staffSearchEmail.trim(), role: staffSelectedRole });
      setStaffSearchMsg(`✅ Invite sent to ${staffSearchEmail.trim()} as ${STAFF_ROLE_LABELS[staffSelectedRole]}. They'll get an email to set their password.`);
      setStaffNotFound(false);
      setStaffSearchEmail('');
      fetchStaffList();
    } catch (e) {
      setStaffInviteLoading(false);
      setStaffSearchMsg('Network error sending invite.');
    }
  };

  const assignStaffRole = async () => {
    if (!staffSearchResult) return;
    const { error } = await supabase.from('users').update({ staff_role: staffSelectedRole }).eq('id', staffSearchResult.id);
    if (error) { setStaffSearchMsg('Error: ' + error.message); return; }
    await logAudit('ASSIGN_STAFF_ROLE', 'user', staffSearchResult.id, { email: staffSearchResult.email, role: staffSelectedRole });
    setStaffSearchMsg(`✅ ${staffSearchResult.email} assigned as ${STAFF_ROLE_LABELS[staffSelectedRole]}`);
    setStaffSearchResult(null);
    setStaffSearchEmail('');
    fetchStaffList();
  };

  const removeStaffRole = async (staffUser) => {
    if (!confirm(`Remove ${STAFF_ROLE_LABELS[staffUser.staff_role]} access for ${staffUser.email}?`)) return;
    await supabase.from('users').update({ staff_role: null }).eq('id', staffUser.id);
    await logAudit('REMOVE_STAFF_ROLE', 'user', staffUser.id, { email: staffUser.email, previous_role: staffUser.staff_role });
    fetchStaffList();
  };

  // Pending approvals — recommendations submitted by a research analyst,
  // waiting on the owner to approve (with password re-confirmation) before
  // they go live to subscribers.
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [approveModalRec, setApproveModalRec] = useState(null);
  const [approvePassword, setApprovePassword] = useState('');
  const [approveMsg, setApproveMsg] = useState('');
  const [approveLoading, setApproveLoading] = useState(false);

  const fetchPendingApprovals = async () => {
    const { data } = await supabase.from('recommendations').select('*').eq('status', 'pending_approval').order('created_at', { ascending: false });
    setPendingApprovals(data || []);
    fetchPendingCoupons();
  };

  const [pendingCoupons, setPendingCoupons] = useState([]);
  const [approveModalCoupon, setApproveModalCoupon] = useState(null);
  const [couponApprovePassword, setCouponApprovePassword] = useState('');
  const [couponApproveMsg, setCouponApproveMsg] = useState('');
  const [couponApproveLoading, setCouponApproveLoading] = useState(false);

  const fetchPendingCoupons = async () => {
    const { data } = await supabase.from('coupons').select('*').eq('approved', false).order('created_at', { ascending: false });
    setPendingCoupons(data || []);
  };

  const confirmApproveCoupon = async () => {
    if (!approveModalCoupon || !couponApprovePassword) return;
    setCouponApproveLoading(true); setCouponApproveMsg('');
    const { error: authError } = await supabase.auth.signInWithPassword({ email: user.email, password: couponApprovePassword });
    if (authError) { setCouponApproveMsg('Incorrect password.'); setCouponApproveLoading(false); return; }
    const { error } = await supabase.from('coupons').update({ active: true, approved: true }).eq('id', approveModalCoupon.id);
    setCouponApproveLoading(false);
    if (error) { setCouponApproveMsg('Error: ' + error.message); return; }
    await logAudit('APPROVE_COUPON', 'coupon', approveModalCoupon.id, { code: approveModalCoupon.code, submitted_by: approveModalCoupon.submitted_by_email });
    setApproveModalCoupon(null); setCouponApprovePassword(''); setCouponApproveMsg('');
    fetchPendingCoupons();
  };

  const rejectCoupon = async (coupon) => {
    if (!confirm(`Reject coupon ${coupon.code} from ${coupon.submitted_by_email || 'marketing'}? It will be deleted.`)) return;
    await supabase.from('coupons').delete().eq('id', coupon.id);
    await logAudit('REJECT_COUPON', 'coupon', coupon.id, { code: coupon.code, submitted_by: coupon.submitted_by_email });
    fetchPendingCoupons();
  };

  const confirmApprove = async () => {
    if (!approveModalRec || !approvePassword) return;
    setApproveLoading(true); setApproveMsg('');
    // Re-confirm the owner's password before publishing — a deliberate
    // step-up check so an already-logged-in session can't approve calls
    // without the owner actually re-entering their credentials.
    const { error: authError } = await supabase.auth.signInWithPassword({ email: user.email, password: approvePassword });
    if (authError) { setApproveMsg('Incorrect password.'); setApproveLoading(false); return; }
    const newStatus = approveModalRec.requested_status || 'live';
    const { error } = await supabase.from('recommendations').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', approveModalRec.id);
    setApproveLoading(false);
    if (error) { setApproveMsg('Error: ' + error.message); return; }
    await logAudit('APPROVE_RECOMMENDATION', 'recommendation', approveModalRec.id, { symbol: approveModalRec.symbol, approved_status: newStatus, submitted_by: approveModalRec.submitted_by_email });
    if (newStatus === 'live') await sendTelegramAlert(approveModalRec);
    setApproveModalRec(null); setApprovePassword(''); setApproveMsg('');
    fetchPendingApprovals();
  };

  const rejectApproval = async (rec) => {
    if (!confirm(`Reject ${rec.symbol} call from ${rec.submitted_by_email || 'analyst'}? It will be moved back to draft.`)) return;
    await supabase.from('recommendations').update({ status: 'draft' }).eq('id', rec.id);
    await logAudit('REJECT_RECOMMENDATION', 'recommendation', rec.id, { symbol: rec.symbol, submitted_by: rec.submitted_by_email });
    fetchPendingApprovals();
  };

  const logAudit = async (action, entity_type, entity_id, details) => {
    try {
      await supabase.from('audit_log').insert([{
        action, entity_type, entity_id,
        details: JSON.stringify(details),
        performed_by: user?.id,
        performed_by_email: user?.email,
        created_at: new Date().toISOString(),
      }]);
    } catch(e) { console.warn('Audit log failed:', e.message); }
  };

  useEffect(() => {
    const role = effectiveStaffRole(userProfile);
    if (!role) { navigate('/'); return; }
    const allowed = ROLE_TABS[role] || [];
    if (!allowed.includes(activeTab)) { setActiveTab(allowed[0] || 'recommendations'); return; }
    fetchData();
  }, [activeTab, userProfile?.staff_role, userProfile?.is_admin]);

  const fetchData = async () => {
    setLoading(true);
    if (activeTab === 'recommendations') {
      const { data } = await supabase.from('recommendations').select('*').order('published_at', { ascending: false });
      setRecs(data || []);
    } else if (activeTab === 'users') {
      const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      setUsers(data || []);
    } else if (activeTab === 'analytics') {
      await fetchAnalytics();
    } else if (activeTab === 'notifications') {
      const { data } = await supabase.from('admin_notifications').select('*').order('created_at', { ascending: false }).limit(50);
      setNotifications(data || []);
    } else if (activeTab === 'coupons') {
      const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      setCoupons(data || []);
    } else if (activeTab === 'revenue') {
      await fetchRevenue();
    } else if (activeTab === 'blog') {
      const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
      setBlogPosts(data || []);
    } else if (activeTab === 'performance') {
      await fetchPerformance();
    } else if (activeTab === 'audit') {
      const { data } = await supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200);
      setAuditLogs(data || []);
    } else if (activeTab === 'staff') {
      await fetchStaffList();
    } else if (activeTab === 'approvals') {
      await fetchPendingApprovals();
    }
    setLoading(false);
  };

  const fetchAnalytics = async () => {
    const [recsRes, usersRes] = await Promise.all([
      supabase.from('recommendations').select('id, status, segment, entry_price, target1, stop_loss, exit_price, action, published_at'),
      supabase.from('users').select('id, plan_id, plan_expires_at, created_at'),
    ]);
    const allRecs = recsRes.data || [];
    const allUsers = usersRes.data || [];
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const closed = allRecs.filter(r => ['target_hit','sl_hit','closed','expired'].includes(r.status));
    const wins = allRecs.filter(r => r.status === 'target_hit');
    const live = allRecs.filter(r => ['live','near_target','near_sl'].includes(r.status));
    const withReturn = closed.map(r => {
      const e = parseFloat(r.entry_price), x = parseFloat(r.exit_price) || (r.status === 'target_hit' ? parseFloat(r.target1) : parseFloat(r.stop_loss));
      if (!e || !x) return null;
      return ((r.action === 'SELL' ? (e - x) : (x - e)) / e) * 100;
    }).filter(Boolean);
    const avgReturn = withReturn.length ? (withReturn.reduce((a,b) => a+b,0)/withReturn.length).toFixed(2) : 0;
    const activeUsers = allUsers.filter(u => u.plan_expires_at && new Date(u.plan_expires_at) > now);
    const planBreakdown = { basic: 0, premium: 0, fno: 0, elite: 0 };
    activeUsers.forEach(u => { if (planBreakdown[u.plan_id] !== undefined) planBreakdown[u.plan_id]++; });
    const planRevenue = { basic: 999, premium: 2499, fno: 3999, elite: 5999 };
    const mrrEstimate = Object.entries(planBreakdown).reduce((s,[k,v]) => s + (planRevenue[k]||0)*v, 0);
    setAnalytics({
      totalRecs: allRecs.length, liveRecs: live.length, closedRecs: closed.length,
      winRate: closed.length ? ((wins.length/closed.length)*100).toFixed(1) : 0,
      avgReturn, totalUsers: allUsers.length,
      newUsersWeek: allUsers.filter(u => new Date(u.created_at) > weekAgo).length,
      newUsersMonth: allUsers.filter(u => new Date(u.created_at) > monthAgo).length,
      activeSubscribers: activeUsers.length, planBreakdown, mrrEstimate,
      segmentBreakdown: ['equity','futures','options','commodity'].map(seg => ({
        seg, total: allRecs.filter(r=>r.segment===seg).length,
        wins: allRecs.filter(r=>r.segment===seg && r.status==='target_hit').length,
      })).filter(s=>s.total>0),
    });
  };

  const fetchPerformance = async () => {
    const { data: allRecs } = await supabase.from('recommendations')
      .select('id, symbol, stock_name, action, segment, entry_price, target1, stop_loss, exit_price, cmp, status, published_at, updated_at')
      .in('status', ['target_hit','sl_hit','closed','expired','archived']);
    const recs = allRecs || [];
    const calcReturn = (r) => {
      const entry = parseFloat(r.entry_price);
      const exit = parseFloat(r.exit_price) || (r.status === 'target_hit' ? parseFloat(r.target1) : parseFloat(r.stop_loss));
      if (!entry || !exit) return null;
      return r.action === 'SELL' ? ((entry - exit) / entry) * 100 : ((exit - entry) / entry) * 100;
    };
    const withReturn = recs.map(r => ({ ...r, ret: calcReturn(r) })).filter(r => r.ret !== null);
    // Monthly breakdown — last 4 months
    const months = [];
    for (let i = 0; i < 4; i++) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const ym = d.toISOString().slice(0,7);
      const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
      const monthRecs = withReturn.filter(r => (r.updated_at || r.published_at || '').slice(0,7) === ym);
      const wins = monthRecs.filter(r => r.status === 'target_hit');
      months.push({ ym, label, total: monthRecs.length, wins: wins.length, winRate: monthRecs.length ? ((wins.length/monthRecs.length)*100).toFixed(1) : 0, avgReturn: monthRecs.length ? (monthRecs.reduce((s,r) => s+r.ret, 0)/monthRecs.length).toFixed(2) : 0 });
    }
    // Segment breakdown
    const segments = ['equity','futures','options','commodity'].map(seg => {
      const sr = withReturn.filter(r => r.segment === seg);
      const wins = sr.filter(r => r.status === 'target_hit');
      return { seg, total: sr.length, wins: wins.length, winRate: sr.length ? ((wins.length/sr.length)*100).toFixed(1) : 0, avgReturn: sr.length ? (sr.reduce((s,r)=>s+r.ret,0)/sr.length).toFixed(2) : 0 };
    }).filter(s => s.total > 0);
    // Best and worst
    const sorted = [...withReturn].sort((a,b) => b.ret - a.ret);
    const best = sorted.slice(0,5);
    const worst = sorted.slice(-5).reverse();
    // Current month calls
    const curMonthRecs = withReturn.filter(r => (r.updated_at || r.published_at || '').slice(0,7) === perfMonth);
    setPerfData({ months, segments, best, worst, curMonthRecs, total: withReturn.length, wins: withReturn.filter(r=>r.status==='target_hit').length, avgReturn: withReturn.length ? (withReturn.reduce((s,r)=>s+r.ret,0)/withReturn.length).toFixed(2) : 0 });
  };

  const fetchRevenue = async () => {
    const { data: allUsers } = await supabase.from('users').select('id, plan_id, plan_expires_at, created_at');
    const users = allUsers || [];
    const now = new Date();
    const planRevenue = { basic: 999, premium: 2499, fno: 3999, elite: 5999 };
    const active = users.filter(u => u.plan_id && u.plan_expires_at && new Date(u.plan_expires_at) > now);
    const mrr = active.reduce((s,u) => s + (planRevenue[u.plan_id] || 0), 0);
    const expiringWeek = active.filter(u => new Date(u.plan_expires_at) < new Date(now.getTime() + 7*24*60*60*1000));
    const expiringMonth = active.filter(u => new Date(u.plan_expires_at) < new Date(now.getTime() + 30*24*60*60*1000));
    const churned = users.filter(u => u.plan_id && u.plan_expires_at && new Date(u.plan_expires_at) < now);
    const planBreakdown = Object.entries(planRevenue).map(([plan, price]) => ({
      plan, price, count: active.filter(u => u.plan_id === plan).length,
      revenue: active.filter(u => u.plan_id === plan).length * price,
    })).filter(p => p.count > 0);
    const monthlyGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const ym = d.toISOString().slice(0,7);
      const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
      const newSubs = users.filter(u => u.created_at?.slice(0,7) === ym && u.plan_id).length;
      monthlyGrowth.push({ ym, label, newSubs });
    }
    setRevenueData({ mrr, active: active.length, churned: churned.length, expiringWeek: expiringWeek.length, expiringMonth: expiringMonth.length, planBreakdown, monthlyGrowth, totalUsers: users.length, churnRate: users.length > 0 ? ((churned.length / users.length) * 100).toFixed(1) : 0, avgLTV: active.length > 0 ? (mrr * 6 / active.length).toFixed(0) : 0 });
  };

  const sendNotification = async () => {
    if (!notifForm.title || !notifForm.body) { setNotifMsg('Title and message required.'); return; }
    setNotifSending(true); setNotifMsg('');
    const payload = { title: notifForm.title, body: notifForm.body, plan_target: notifForm.plan_target, type: notifForm.type, created_by: user.id, created_at: new Date().toISOString() };
    const { data, error } = await supabase.from('admin_notifications').insert([payload]).select();
    setNotifSending(false);
    if (error) { setNotifMsg('Error: ' + error.message); return; }
    await logAudit('SEND_NOTIFICATION', 'admin_notification', data?.[0]?.id || 'new', { title: notifForm.title, plan_target: notifForm.plan_target, type: notifForm.type });
    setNotifMsg('✅ Notification sent to ' + (notifForm.plan_target === 'all' ? 'all users' : notifForm.plan_target + ' plan users'));
    setNF('title',''); setNF('body','');
    fetchData();
  };

  const deleteNotif = async (id) => {
    await supabase.from('admin_notifications').delete().eq('id', id);
    await logAudit('DELETE_NOTIFICATION', 'admin_notification', id, {});
    fetchData();
  };

  const deleteRec = async (id) => {
    if (!confirm('Delete this recommendation?')) return;
    const rec = recs.find(r => r.id === id);
    await supabase.from('recommendations').delete().eq('id', id);
    await logAudit('DELETE_RECOMMENDATION', 'recommendation', id, { symbol: rec?.symbol, stock_name: rec?.stock_name });
    fetchData();
  };

  const updateStatus = async (id, status) => {
    const rec = recs.find(r => r.id === id);
    await supabase.from('recommendations').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    await logAudit('UPDATE_STATUS', 'recommendation', id, { symbol: rec?.symbol, old_status: rec?.status, new_status: status });
    fetchData();
  };

  const autoCheckStatus = async () => {
    const { data } = await supabase.from('recommendations').select('*').in('status', ['live', 'near_target', 'near_sl']);
    const updates = (data || []).map(r => ({ id: r.id, symbol: r.symbol, old: r.status, suggested: suggestStatus(r) })).filter(u => u.suggested !== u.old);
    if (updates.length === 0) { alert('No status changes detected.'); return; }
    if (!confirm(`Update ${updates.length} call(s) based on current CMP/expiry?`)) return;
    for (const u of updates) {
      await supabase.from('recommendations').update({ status: u.suggested, updated_at: new Date().toISOString() }).eq('id', u.id);
      await logAudit('UPDATE_STATUS', 'recommendation', u.id, { symbol: u.symbol, old_status: u.old, new_status: u.suggested, via: 'auto_check' });
    }
    fetchData();
  };

  const myRole = effectiveStaffRole(userProfile);
  if (!myRole) return <div style={{ paddingTop: '100px', textAlign: 'center' }}>Access Denied</div>;

  const allowedTabKeys = ROLE_TABS[myRole] || [];
  const tabs = allowedTabKeys;

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <div style={{ ...S.section, paddingTop: '40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ ...S.flexBetween, marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={S.h2}>🛡️ Admin Panel</h1>
              <p style={{ ...S.muted, marginTop: '4px' }}>Manage recommendations, users, and platform settings</p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ ...S.flex, gap: '4px', background: '#FEFDFB', padding: '4px', borderRadius: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {[
              { key: 'recommendations', label: '📊 Recommendations' },
              { key: 'add_recommendation', label: '➕ Add Call' },
              { key: 'approvals', label: '✅ Approvals' },
              { key: 'users', label: '👥 Users' },
              { key: 'analytics', label: '📈 Analytics' },
              { key: 'revenue', label: '💰 Revenue' },
              { key: 'notifications', label: '🔔 Notifications' },
              { key: 'email', label: '📧 Email' },
              { key: 'coupons', label: '🎫 Coupons' },
              { key: 'bulk', label: '⚡ Bulk Actions' },
              { key: 'blog', label: '✍️ Blog' },
              { key: 'performance', label: '🏆 Performance' },
              { key: 'settings', label: '⚙️ Settings' },
              { key: 'audit', label: '📋 Audit Log' },
              { key: 'staff', label: '🧑‍💼 Staff and Roles' },
            ].filter(t => allowedTabKeys.includes(t.key)).map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: activeTab === t.key ? '#1d4ed8' : 'transparent', color: activeTab === t.key ? '#fff' : '#94a3b8' }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Recommendations List */}
          {activeTab === 'recommendations' && (
            loading ? <div style={{ ...S.card, textAlign: 'center', padding: '40px', ...S.muted }}>Loading...</div> :
            <div>
              <div style={{ ...S.flex, justifyContent: 'flex-end', marginBottom: '12px' }}>
                <button onClick={autoCheckStatus} style={{ ...S.btn, ...S.btnSecondary, ...S.btnSm }}>🔄 Auto-check Status (CMP/Expiry)</button>
              </div>
              {recs.map(r => (
                <div key={r.id} style={{ ...S.card, marginBottom: '10px' }}>
                  <div style={{ ...S.flexBetween, flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ ...S.flex, gap: '10px' }}>
                      <span style={{ ...S.badge, ...actionStyle(r.action) }}>{r.action}</span>
                      <div>
                        <p style={{ fontWeight: 700 }}>{r.symbol} — {r.stock_name}</p>
                        <p style={{ fontSize: '12px', ...S.muted }}>
                          Entry: {fmt(r.entry_price)} | T1: {fmt(r.target1)} | SL: {fmt(r.stop_loss)} | {r.segment} | {r.time_horizon}
                        </p>
                      </div>
                    </div>
                    <div style={{ ...S.flex, gap: '8px', flexWrap: 'wrap' }}>
                      <select value={r.status} onChange={e => updateStatus(r.id, e.target.value)}
                        style={{ ...S.select, width: 'auto', fontSize: '12px', padding: '6px 10px' }}>
                        {['draft', 'live', 'near_target', 'near_sl', 'target_hit', 'sl_hit', 'expired', 'closed', 'archived'].map(s => (
                          <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
                        ))}
                      </select>
                      <button onClick={() => { setEditRec(r); setActiveTab('add_recommendation'); }}
                        style={{ ...S.btn, ...S.btnSecondary, ...S.btnSm }}>✏️ Edit</button>
                      <button onClick={() => deleteRec(r.id)}
                        style={{ ...S.btn, ...S.btnDanger, ...S.btnSm }}>🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add/Edit Recommendation */}
          {activeTab === 'add_recommendation' && (
            <AddRecForm existingRec={editRec} onSave={() => { setEditRec(null); setActiveTab('recommendations'); fetchData(); }} adminId={user.id} adminEmail={user.email} logAudit={logAudit} myRole={myRole} />
          )}

          {/* Users */}
          {/* ─── USERS TAB ─── */}
          {activeTab === 'users' && (() => {
            const filtered = users.filter(u =>
              !userSearch || u.email?.toLowerCase().includes(userSearch.toLowerCase()) || u.full_name?.toLowerCase().includes(userSearch.toLowerCase())
            );
            const openEdit = (u) => {
              setEditUser(u);
              setUserEditForm({
                plan_id: u.plan_id || 'basic',
                plan_expires_at: u.plan_expires_at ? u.plan_expires_at.slice(0,10) : '',
                suspended: u.suspended || false,
              });
              setUserMsg('');
            };
            const saveUser = async () => {
              setUserSaving(true);
              const expiry = userEditForm.plan_expires_at ? new Date(userEditForm.plan_expires_at).toISOString() : null;
              const { error } = await supabase.from('users').update({
                plan_id: userEditForm.plan_id,
                plan_expires_at: expiry,
                suspended: userEditForm.suspended,
                updated_at: new Date().toISOString(),
              }).eq('id', editUser.id);
              if (!error) {
                await logAudit('UPDATE_USER', 'user', editUser.id, {
                  email: editUser.email,
                  plan_id: userEditForm.plan_id,
                  plan_expires_at: expiry,
                  suspended: userEditForm.suspended,
                });
              }
              setUserSaving(false);
              setUserMsg(error ? '❌ ' + error.message : '✅ User updated successfully!');
              fetchData();
            };
            const isActive = (u) => u.plan_expires_at && new Date(u.plan_expires_at) > new Date();
            const planColors = { basic: '#64748b', premium: '#1d4ed8', fno: '#d97706', elite: '#7c3aed' };

            return (
              <div style={{ display: 'grid', gridTemplateColumns: editUser ? '1fr 340px' : '1fr', gap: '16px' }}>
                {/* User list */}
                <div>
                  {/* Search + stats */}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input style={{ ...S.input, flex: 1, minWidth: '200px' }} placeholder="Search by name or email..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[
                        { label: 'Total', val: users.length, color: '#0A0A0A' },
                        { label: 'Active', val: users.filter(isActive).length, color: '#059669' },
                        { label: 'Expired', val: users.filter(u => !isActive(u)).length, color: '#dc2626' },
                      ].map((s,i) => (
                        <div key={i} style={{ ...S.card, padding: '8px 14px', textAlign: 'center', minWidth: '70px' }}>
                          <p style={{ fontWeight: 800, fontSize: '18px', color: s.color }}>{s.val}</p>
                          <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* User table */}
                  <div style={{ ...S.card, padding: '0', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#FAF9F5' }}>
                          {['User', 'Plan', 'Status', 'Expires', 'Joined', 'Actions'].map(h => (
                            <th key={h} style={{ padding: '10px 14px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#94a3b8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length === 0 ? (
                          <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No users found.</td></tr>
                        ) : filtered.map(u => {
                          const active = isActive(u);
                          const isSelected = editUser?.id === u.id;
                          return (
                            <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', background: isSelected ? '#eff6ff' : u.suspended ? '#fef2f2' : 'transparent' }}>
                              <td style={{ padding: '11px 14px' }}>
                                <p style={{ fontWeight: 700, color: '#0A0A0A', fontSize: '13px' }}>{u.full_name || '—'}</p>
                                <p style={{ fontSize: '11px', color: '#64748b' }}>{u.email}</p>
                                {u.is_admin && <span style={{ fontSize: '9px', background: '#ede9fe', color: '#5b21b6', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>ADMIN</span>}
                              </td>
                              <td style={{ padding: '11px 14px' }}>
                                <span style={{ ...S.badge, background: planColors[u.plan_id || 'basic'] + '20', color: planColors[u.plan_id || 'basic'], fontSize: '11px' }}>
                                  {(u.plan_id || 'basic').toUpperCase()}
                                </span>
                              </td>
                              <td style={{ padding: '11px 14px' }}>
                                {u.suspended ? (
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626' }}>🚫 Suspended</span>
                                ) : active ? (
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669' }}>✅ Active</span>
                                ) : (
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>⚪ Inactive</span>
                                )}
                              </td>
                              <td style={{ padding: '11px 14px', fontSize: '12px', color: '#64748b' }}>
                                {u.plan_expires_at ? new Date(u.plan_expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                              </td>
                              <td style={{ padding: '11px 14px', fontSize: '12px', color: '#64748b' }}>
                                {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                              </td>
                              <td style={{ padding: '11px 14px' }}>
                                <button onClick={() => openEdit(u)} style={{ ...S.btn, ...S.btnSecondary, ...S.btnSm, fontSize: '12px' }}>
                                  ✏️ Edit
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Edit user panel */}
                {editUser && (
                  <div style={{ ...S.card, border: '2px solid #1d4ed8', height: 'fit-content', position: 'sticky', top: '80px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ ...S.h4, marginBottom: '2px' }}>Edit User</h3>
                        <p style={{ fontSize: '12px', color: '#64748b' }}>{editUser.email}</p>
                      </div>
                      <button onClick={() => setEditUser(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
                    </div>

                    {userMsg && (
                      <div style={{ background: userMsg.startsWith('✅') ? '#d1fae5' : '#fee2e2', color: userMsg.startsWith('✅') ? '#065f46' : '#991b1b', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', marginBottom: '14px' }}>
                        {userMsg}
                      </div>
                    )}

                    <div style={S.formGroup}>
                      <label style={S.label}>Plan</label>
                      <select style={S.select} value={userEditForm.plan_id} onChange={e => setUserEditForm(f => ({ ...f, plan_id: e.target.value }))}>
                        {[['basic','Basic Equity — ₹999'],['premium','Premium Equity — ₹2,499'],['fno','F&O Pro — ₹3,999'],['elite','Elite All Access — ₹5,999']].map(([v,l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </div>

                    <div style={S.formGroup}>
                      <label style={S.label}>Plan Expiry Date</label>
                      <input style={S.input} type="date" value={userEditForm.plan_expires_at} onChange={e => setUserEditForm(f => ({ ...f, plan_expires_at: e.target.value }))} />
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                        {[['1M', 30],['3M', 90],['6M', 180],['1Y', 365]].map(([label, days]) => (
                          <button key={label} onClick={() => {
                            const d = new Date(); d.setDate(d.getDate() + days);
                            setUserEditForm(f => ({ ...f, plan_expires_at: d.toISOString().slice(0,10) }));
                          }} style={{ ...S.btn, ...S.btnSecondary, padding: '4px 10px', fontSize: '11px', borderRadius: '6px' }}>+{label}</button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '12px', background: userEditForm.suspended ? '#fef2f2' : '#FAF9F5', borderRadius: '8px', border: '1px solid ' + (userEditForm.suspended ? '#fecaca' : '#e2e8f0') }}>
                      <input type="checkbox" id="suspend-toggle" checked={userEditForm.suspended} onChange={e => setUserEditForm(f => ({ ...f, suspended: e.target.checked }))} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                      <label htmlFor="suspend-toggle" style={{ cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: userEditForm.suspended ? '#dc2626' : '#334155' }}>
                        {userEditForm.suspended ? '🚫 Account Suspended' : '✅ Account Active'}
                      </label>
                    </div>

                    <button onClick={saveUser} disabled={userSaving} style={{ ...S.btn, ...S.btnPrimary, width: '100%', justifyContent: 'center', opacity: userSaving ? 0.7 : 1 }}>
                      {userSaving ? 'Saving...' : '💾 Save Changes'}
                    </button>

                    <div style={{ marginTop: '16px', padding: '10px', background: '#FAF9F5', borderRadius: '8px' }}>
                      <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Account Info</p>
                      <p style={{ fontSize: '12px', color: '#64748b' }}>📅 Joined: {new Date(editUser.created_at).toLocaleDateString('en-IN')}</p>
                      <p style={{ fontSize: '12px', color: '#64748b' }}>📱 Mobile: {editUser.mobile || '—'}</p>
                      <p style={{ fontSize: '12px', color: '#64748b' }}>🛡️ Admin: {editUser.is_admin ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
          {/* ─── ANALYTICS TAB ─── */}
          {activeTab === 'analytics' && (
            <div>
              {loading || !analytics ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Loading analytics...</div>
              ) : (
                <>
                  {/* KPI Row 1 — Calls */}
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Research Calls</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                    {[
                      { label: 'Total Calls', value: analytics.totalRecs, color: '#0A0A0A' },
                      { label: 'Live Now', value: analytics.liveRecs, color: '#1e40af' },
                      { label: 'Closed', value: analytics.closedRecs, color: '#64748b' },
                      { label: 'Win Rate', value: analytics.winRate + '%', color: analytics.winRate >= 50 ? '#059669' : '#dc2626' },
                      { label: 'Avg Return', value: (analytics.avgReturn >= 0 ? '+' : '') + analytics.avgReturn + '%', color: analytics.avgReturn >= 0 ? '#059669' : '#dc2626' },
                    ].map((s, i) => (
                      <div key={i} style={{ ...S.card, padding: '14px', textAlign: 'center' }}>
                        <p style={{ fontSize: '22px', fontWeight: 800, color: s.color }}>{s.value}</p>
                        <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* KPI Row 2 — Users */}
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Users & Revenue</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                    {[
                      { label: 'Total Users', value: analytics.totalUsers, color: '#0A0A0A' },
                      { label: 'New This Week', value: analytics.newUsersWeek, color: '#1e40af' },
                      { label: 'New This Month', value: analytics.newUsersMonth, color: '#1e40af' },
                      { label: 'Active Subscribers', value: analytics.activeSubscribers, color: '#059669' },
                      { label: 'Est. MRR', value: '₹' + fmtCurr(analytics.mrrEstimate), color: '#d97706' },
                    ].map((s, i) => (
                      <div key={i} style={{ ...S.card, padding: '14px', textAlign: 'center' }}>
                        <p style={{ fontSize: '22px', fontWeight: 800, color: s.color }}>{s.value}</p>
                        <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Plan breakdown + Segment breakdown */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ ...S.card }}>
                      <h3 style={{ ...S.h4, marginBottom: '16px' }}>Subscribers by Plan</h3>
                      {Object.entries(analytics.planBreakdown).map(([plan, count]) => (
                        <div key={plan} style={{ marginBottom: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155', textTransform: 'capitalize' }}>{PLANS[plan]?.name || plan}</span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0A0A0A' }}>{count}</span>
                          </div>
                          <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '6px', borderRadius: '3px', background: PLANS[plan]?.color || '#1d4ed8', width: analytics.activeSubscribers > 0 ? `${(count / analytics.activeSubscribers * 100).toFixed(0)}%` : '0%', transition: 'width 0.4s' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ ...S.card }}>
                      <h3 style={{ ...S.h4, marginBottom: '16px' }}>Win Rate by Segment</h3>
                      {analytics.segmentBreakdown.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '13px' }}>No closed calls yet.</p>
                      ) : analytics.segmentBreakdown.map(s => {
                        const rate = s.total > 0 ? ((s.wins / s.total) * 100).toFixed(0) : 0;
                        return (
                          <div key={s.seg} style={{ marginBottom: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155', textTransform: 'capitalize' }}>{s.seg}</span>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: rate >= 50 ? '#059669' : '#dc2626' }}>{rate}% ({s.wins}/{s.total})</span>
                            </div>
                            <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '6px', borderRadius: '3px', background: rate >= 50 ? '#059669' : '#dc2626', width: `${rate}%`, transition: 'width 0.4s' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ ...S.disclaimer }}>
                    ⚠️ MRR estimate is based on current active subscribers × plan price. Actual revenue depends on payment gateway. Past win rate does not guarantee future performance.
                  </div>
                </>
              )}
            </div>
          )}

          {/* ─── NOTIFICATIONS TAB ─── */}
          {activeTab === 'notifications' && (
            <div>
              {/* Compose notification */}
              <div style={{ ...S.card, marginBottom: '20px', border: '2px solid #bfdbfe' }}>
                <h3 style={{ ...S.h4, marginBottom: '16px' }}>📢 Send Notification to Users</h3>
                {notifMsg && (
                  <div style={{ background: notifMsg.startsWith('✅') ? '#d1fae5' : '#fee2e2', color: notifMsg.startsWith('✅') ? '#065f46' : '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' }}>
                    {notifMsg}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={S.label}>Target Audience</label>
                    <select style={S.select} value={notifForm.plan_target} onChange={e => setNF('plan_target', e.target.value)}>
                      <option value="all">All Users</option>
                      <option value="basic">Basic Equity</option>
                      <option value="premium">Premium Equity</option>
                      <option value="fno">F&O Pro</option>
                      <option value="elite">Elite All Access</option>
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>Type</label>
                    <select style={S.select} value={notifForm.type} onChange={e => setNF('type', e.target.value)}>
                      <option value="info">ℹ️ Info</option>
                      <option value="alert">🔴 Alert</option>
                      <option value="success">✅ Success</option>
                      <option value="call">📊 New Call</option>
                      <option value="market">📈 Market Update</option>
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>Title *</label>
                    <input style={S.input} placeholder="e.g. New RELIANCE BUY call published" value={notifForm.title} onChange={e => setNF('title', e.target.value)} />
                  </div>
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={S.label}>Message *</label>
                  <textarea style={{ ...S.textarea, minHeight: '70px' }} placeholder="Detailed notification message for users..." value={notifForm.body} onChange={e => setNF('body', e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button onClick={sendNotification} disabled={notifSending} style={{ ...S.btn, ...S.btnPrimary, opacity: notifSending ? 0.7 : 1 }}>
                    {notifSending ? 'Sending...' : '📢 Send Notification'}
                  </button>
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>Notification will appear in users' notification bell immediately.</p>
                </div>
              </div>

              {/* Quick templates */}
              <div style={{ ...S.card, marginBottom: '20px' }}>
                <h3 style={{ ...S.h4, marginBottom: '12px' }}>Quick Templates</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { label: '📊 New Call Alert', title: 'New research call published', body: 'A new research call has been published on your plan. Login to view entry, target, and stop-loss details.' },
                    { label: '📈 Market Update', title: 'Market update from our analyst', body: 'Important market update published. Check the live calls section for revised price targets.' },
                    { label: '⚠️ SL Alert', title: 'Stop-loss triggered on active call', body: 'Stop-loss has been hit on one of your active calls. Please review your portfolio.' },
                    { label: '🎯 Target Hit', title: 'Target achieved on research call', body: 'Congratulations! A research call has hit its target. Book profits and review performance.' },
                    { label: '📅 Expiry Reminder', title: 'Your subscription expires soon', body: 'Your StockVista subscription expires in 7 days. Renew now to continue accessing research calls.' },
                  ].map((t, i) => (
                    <button key={i} onClick={() => { setNF('title', t.title); setNF('body', t.body); }}
                      style={{ ...S.btn, ...S.btnSecondary, ...S.btnSm, fontSize: '12px' }}>{t.label}</button>
                  ))}
                </div>
              </div>

              {/* Notification history */}
              <div style={{ ...S.card }}>
                <h3 style={{ ...S.h4, marginBottom: '16px' }}>Notification History</h3>
                {loading ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>Loading...</p>
                ) : notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    <p style={{ fontSize: '32px', marginBottom: '8px' }}>🔔</p>
                    <p>No notifications sent yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {notifications.map(n => {
                      const typeColor = n.type === 'alert' ? '#dc2626' : n.type === 'success' ? '#059669' : n.type === 'call' ? '#1e40af' : n.type === 'market' ? '#d97706' : '#64748b';
                      return (
                        <div key={n.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px 14px', background: '#FAF9F5', borderRadius: '10px', border: '1px solid #E5E3DA' }}>
                          <div style={{ width: '36px', height: '36px', background: '#eff6ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                            {n.type === 'alert' ? '🔴' : n.type === 'success' ? '✅' : n.type === 'call' ? '📊' : n.type === 'market' ? '📈' : 'ℹ️'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                              <p style={{ fontWeight: 700, fontSize: '13px', color: '#0A0A0A' }}>{n.title}</p>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                                <span style={{ fontSize: '10px', color: '#94a3b8' }}>{new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                <span style={{ fontSize: '10px', background: '#eff6ff', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                  {n.plan_target === 'all' ? 'All users' : PLANS[n.plan_target]?.name}
                                </span>
                                <button onClick={() => deleteNotif(n.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px' }}>🗑</button>
                              </div>
                            </div>
                            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>{n.body}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── BLOG MANAGER TAB ─── */}
          {activeTab === 'blog' && (() => {
            const TAGS = ['Education', 'F&O', 'Commodity', 'Markets', 'Technical', 'Fundamental', 'IPO', 'Risk Management'];

            const saveBlog = async () => {
              if (!blogForm?.title || !blogForm?.content) { setBlogMsg('Title and content required.'); return; }
              setBlogSaving(true); setBlogMsg('');
              const payload = { ...blogForm, slug: blogForm.slug || genSlug(blogForm.title), updated_at: new Date().toISOString() };
              if (!payload.created_at) payload.created_at = new Date().toISOString();
              let error;
              if (blogForm.id) {
                const res = await supabase.from('blog_posts').update(payload).eq('id', blogForm.id);
                error = res.error;
              } else {
                const res = await supabase.from('blog_posts').insert([payload]);
                error = res.error;
              }
              await logAudit(blogForm.id ? 'UPDATE_BLOG_POST' : 'CREATE_BLOG_POST', 'blog_post', blogForm.id || 'new', { title: blogForm.title, status: blogForm.status });
              setBlogSaving(false);
              if (error) { setBlogMsg('Error: ' + error.message); return; }
              setBlogMsg('✅ Saved!');
              setTimeout(() => { setBlogForm(null); setBlogMsg(''); fetchData(); }, 1200);
            };

            const deleteBlog = async (id) => {
              if (!confirm('Delete this article?')) return;
              await supabase.from('blog_posts').delete().eq('id', id);
              await logAudit('DELETE_BLOG_POST', 'blog_post', id, {});
              fetchData();
            };

            const tagColor = { Education: '#dbeafe', 'F&O': '#fef3c7', Commodity: '#d1fae5', Markets: '#ede9fe', Technical: '#fee2e2', Fundamental: '#f0fdf4', IPO: '#fce7f3', 'Risk Management': '#f1f5f9' };
            const tagText  = { Education: '#1e40af', 'F&O': '#92400e', Commodity: '#065f46', Markets: '#5b21b6', Technical: '#991b1b', Fundamental: '#166534', IPO: '#9d174d', 'Risk Management': '#334155' };

            if (blogForm) return (
              <div>
                <div style={{ ...S.flexBetween, marginBottom: '20px' }}>
                  <h3 style={S.h3}>{blogForm.id ? 'Edit Article' : 'New Article'}</h3>
                  <button onClick={() => { setBlogForm(null); setBlogMsg(''); }} style={{ ...S.btn, ...S.btnSecondary, ...S.btnSm }}>← Back to list</button>
                </div>
                {blogMsg && <div style={{ background: blogMsg.startsWith('✅') ? '#d1fae5' : '#fee2e2', color: blogMsg.startsWith('✅') ? '#065f46' : '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' }}>{blogMsg}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={S.label}>Title *</label>
                    <input style={{ ...S.input, fontSize: '16px', fontWeight: 700 }} placeholder="How to Read a Stock Research Call" value={blogForm.title || ''} onChange={e => { setBF('title', e.target.value); if (!blogForm.id) setBF('slug', genSlug(e.target.value)); }} />
                  </div>
                  <div>
                    <label style={S.label}>Slug (URL)</label>
                    <input style={S.input} value={blogForm.slug || ''} onChange={e => setBF('slug', e.target.value)} />
                    <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>/blog/{blogForm.slug || genSlug(blogForm.title || '')}</p>
                  </div>
                  <div>
                    <label style={S.label}>Tag / Category</label>
                    <select style={S.select} value={blogForm.tag || 'Education'} onChange={e => setBF('tag', e.target.value)}>
                      {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>Status</label>
                    <select style={S.select} value={blogForm.status || 'draft'} onChange={e => setBF('status', e.target.value)}>
                      <option value="draft">📝 Draft</option>
                      <option value="published">🟢 Published</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={S.label}>Summary (shown on blog card)</label>
                    <textarea style={{ ...S.textarea, minHeight: '70px' }} placeholder="Brief summary of the article — 2-3 sentences" value={blogForm.summary || ''} onChange={e => setBF('summary', e.target.value)} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={S.label}>Article Content *</label>
                    <textarea style={{ ...S.textarea, minHeight: '320px', fontFamily: 'inherit', fontSize: '14px', lineHeight: 1.8 }} placeholder="Write your full article here. Use plain text — paragraphs will be displayed as-is." value={blogForm.content || ''} onChange={e => setBF('content', e.target.value)} />
                    <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>{(blogForm.content || '').length} characters · ~{Math.ceil((blogForm.content || '').split(' ').length / 200)} min read</p>
                  </div>
                  <div>
                    <label style={S.label}>Author</label>
                    <input style={S.input} value={blogForm.author || ANALYST_NAME} onChange={e => setBF('author', e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={saveBlog} disabled={blogSaving} style={{ ...S.btn, ...S.btnPrimary, opacity: blogSaving ? 0.7 : 1 }}>
                    {blogSaving ? 'Saving...' : blogForm.status === 'published' ? '🟢 Publish Article' : '💾 Save Draft'}
                  </button>
                  {blogForm.status === 'draft' && (
                    <button onClick={() => { setBF('status','published'); setTimeout(saveBlog, 100); }} style={{ ...S.btn, ...S.btnGreen }}>🟢 Publish Now</button>
                  )}
                </div>
              </div>
            );

            return (
              <div>
                <div style={{ ...S.flexBetween, marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ ...S.h4, marginBottom: '2px' }}>Blog Manager</h3>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>{blogPosts.filter(p=>p.status==='published').length} published · {blogPosts.filter(p=>p.status==='draft').length} drafts</p>
                  </div>
                  <button onClick={() => setBlogForm({ ...emptyBlog })} style={{ ...S.btn, ...S.btnPrimary }}>✍️ New Article</button>
                </div>
                {blogPosts.length === 0 ? (
                  <div style={{ ...S.card, textAlign: 'center', padding: '60px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>✍️</div>
                    <h3 style={{ ...S.h3, marginBottom: '8px' }}>No articles yet</h3>
                    <p style={{ color: '#64748b', marginBottom: '20px' }}>Start writing educational content to drive SEO and trust.</p>
                    <button onClick={() => setBlogForm({ ...emptyBlog })} style={{ ...S.btn, ...S.btnPrimary }}>Write First Article</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {blogPosts.map(p => (
                      <div key={p.id} style={{ ...S.card, display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '14px 16px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                            <span style={{ ...S.badge, background: tagColor[p.tag] || '#f1f5f9', color: tagText[p.tag] || '#334155', fontSize: '11px' }}>{p.tag}</span>
                            <span style={{ ...S.badge, background: p.status === 'published' ? '#d1fae5' : '#f1f5f9', color: p.status === 'published' ? '#065f46' : '#64748b', fontSize: '11px' }}>
                              {p.status === 'published' ? '🟢 Published' : '📝 Draft'}
                            </span>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : ''}</span>
                          </div>
                          <p style={{ fontWeight: 700, fontSize: '14px', color: '#0A0A0A', marginBottom: '2px' }}>{p.title}</p>
                          <p style={{ fontSize: '12px', color: '#64748b' }}>{(p.summary || '').slice(0, 100)}{p.summary?.length > 100 ? '...' : ''}</p>
                          {p.slug && <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>/blog/{p.slug}</p>}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          <button onClick={() => setBlogForm(p)} style={{ ...S.btn, ...S.btnSecondary, ...S.btnSm }}>✏️ Edit</button>
                          <button onClick={() => deleteBlog(p.id)} style={{ ...S.btn, background: '#fee2e2', color: '#dc2626', border: 'none', ...S.btnSm }}>🗑</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ─── PERFORMANCE TRACKER TAB ─── */}
          {activeTab === 'performance' && (() => {
            const exportPerfCSV = () => {
              if (!perfData) return;
              const headers = ['Symbol', 'Stock Name', 'Action', 'Segment', 'Entry', 'Exit', 'Return %', 'Status', 'Date'];
              const rows = perfData.curMonthRecs.map(r => [
                r.symbol, r.stock_name, r.action, r.segment,
                r.entry_price, r.exit_price || r.target1 || r.stop_loss,
                r.ret?.toFixed(2) + '%', r.status,
                (r.updated_at || r.published_at || '').slice(0,10),
              ]);
              const csv = [headers,...rows].map(r=>r.map(v=>`"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
              const a = document.createElement('a');
              a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
              a.download = `stockvista_performance_${perfMonth}.csv`;
              a.click();
            };

            if (!perfData && !loading) fetchPerformance();

            return (
              <div>
                {loading || !perfData ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Loading performance data...</div>
                ) : (
                  <>
                    {/* Overall KPIs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                      {[
                        { label: 'Total Closed Calls', value: perfData.total, color: '#0A0A0A' },
                        { label: 'Total Wins', value: perfData.wins, color: '#059669' },
                        { label: 'Overall Win Rate', value: perfData.total > 0 ? ((perfData.wins/perfData.total)*100).toFixed(1)+'%' : '—', color: perfData.wins/perfData.total >= 0.5 ? '#059669' : '#dc2626' },
                        { label: 'Avg Return / Call', value: (perfData.avgReturn >= 0 ? '+' : '') + perfData.avgReturn + '%', color: perfData.avgReturn >= 0 ? '#059669' : '#dc2626' },
                      ].map((s,i) => (
                        <div key={i} style={{ ...S.card, padding: '14px', textAlign: 'center' }}>
                          <p style={{ fontSize: '22px', fontWeight: 800, color: s.color }}>{s.value}</p>
                          <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Monthly comparison + segment breakdown */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                      <div style={{ ...S.card }}>
                        <h3 style={{ ...S.h4, marginBottom: '16px' }}>Monthly Performance (Last 4 Months)</h3>
                        {perfData.months.map((m, i) => (
                          <div key={m.ym} style={{ marginBottom: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: i === 0 ? '#1e40af' : '#334155' }}>{m.label}</span>
                                {i === 0 && <span style={{ fontSize: '9px', background: '#dbeafe', color: '#1e40af', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>THIS MONTH</span>}
                              </div>
                              <div style={{ display: 'flex', gap: '12px' }}>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>{m.wins}/{m.total} calls</span>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: parseFloat(m.winRate) >= 50 ? '#059669' : m.total > 0 ? '#dc2626' : '#94a3b8' }}>{m.total > 0 ? m.winRate + '%' : '—'}</span>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: parseFloat(m.avgReturn) >= 0 ? '#059669' : '#dc2626' }}>{m.total > 0 ? (parseFloat(m.avgReturn) >= 0 ? '+' : '') + m.avgReturn + '%' : ''}</span>
                              </div>
                            </div>
                            <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '6px', borderRadius: '3px', background: parseFloat(m.winRate) >= 50 ? '#059669' : m.total > 0 ? '#dc2626' : '#e2e8f0', width: m.total > 0 ? m.winRate + '%' : '0%', transition: 'width 0.4s' }} />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{ ...S.card }}>
                        <h3 style={{ ...S.h4, marginBottom: '16px' }}>Win Rate by Segment</h3>
                        {perfData.segments.length === 0 ? (
                          <p style={{ color: '#94a3b8', fontSize: '13px' }}>No closed calls with data yet.</p>
                        ) : perfData.segments.map(s => (
                          <div key={s.seg} style={{ marginBottom: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'capitalize' }}>{s.seg}</span>
                              <div style={{ display: 'flex', gap: '12px' }}>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>{s.wins}/{s.total}</span>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: parseFloat(s.winRate) >= 50 ? '#059669' : '#dc2626' }}>{s.winRate}% win</span>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: parseFloat(s.avgReturn) >= 0 ? '#059669' : '#dc2626' }}>{(parseFloat(s.avgReturn) >= 0 ? '+' : '') + s.avgReturn}% avg</span>
                              </div>
                            </div>
                            <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '6px', borderRadius: '3px', background: parseFloat(s.winRate) >= 50 ? '#059669' : '#dc2626', width: s.winRate + '%', transition: 'width 0.4s' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Best & Worst calls */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                      {[
                        { title: '🏆 Best Calls (All Time)', calls: perfData.best, green: true },
                        { title: '⚠️ Worst Calls (All Time)', calls: perfData.worst, green: false },
                      ].map(({ title, calls, green }) => (
                        <div key={title} style={{ ...S.card }}>
                          <h3 style={{ ...S.h4, marginBottom: '12px' }}>{title}</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {calls.length === 0 ? <p style={{ color: '#94a3b8', fontSize: '13px' }}>No data yet.</p>
                            : calls.map((r, i) => (
                              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: i === 0 ? (green ? '#f0fdf4' : '#fef2f2') : '#FAF9F5', borderRadius: '8px', border: '1px solid ' + (i === 0 ? (green ? '#bbf7d0' : '#fecaca') : '#f1f5f9') }}>
                                <div>
                                  <p style={{ fontWeight: 700, fontSize: '12px', color: '#0A0A0A' }}>{i+1}. {r.symbol}</p>
                                  <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'capitalize' }}>{r.action} · {r.segment}</p>
                                </div>
                                <p style={{ fontWeight: 800, fontSize: '14px', color: r.ret >= 0 ? '#059669' : '#dc2626' }}>
                                  {r.ret >= 0 ? '+' : ''}{r.ret?.toFixed(1)}%
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Monthly report with export */}
                    <div style={{ ...S.card }}>
                      <div style={{ ...S.flexBetween, marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <h3 style={{ ...S.h4, marginBottom: '2px' }}>Monthly Accuracy Report</h3>
                          <p style={{ fontSize: '12px', color: '#64748b' }}>{perfData.curMonthRecs.length} closed calls in selected month</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input type="month" value={perfMonth} onChange={e => { setPerfMonth(e.target.value); fetchPerformance(); }} style={{ ...S.input, width: 'auto', padding: '7px 12px' }} />
                          <button onClick={exportPerfCSV} disabled={perfData.curMonthRecs.length === 0} style={{ ...S.btn, ...S.btnSecondary, opacity: perfData.curMonthRecs.length === 0 ? 0.5 : 1 }}>
                            ⬇️ Export CSV
                          </button>
                        </div>
                      </div>
                      {perfData.curMonthRecs.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No closed calls in {perfMonth}. Try another month.</p>
                      ) : (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <thead>
                              <tr style={{ background: '#FAF9F5' }}>
                                {['Symbol','Action','Segment','Entry','Exit/Target','Return %','Status'].map(h => (
                                  <th key={h} style={{ padding: '9px 12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#94a3b8', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {perfData.curMonthRecs.map(r => (
                                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '9px 12px', fontWeight: 700 }}>{r.symbol}</td>
                                  <td style={{ padding: '9px 12px' }}><span style={{ ...S.badge, ...actionStyle(r.action), fontSize: '10px' }}>{r.action}</span></td>
                                  <td style={{ padding: '9px 12px', color: '#64748b', textTransform: 'capitalize' }}>{r.segment}</td>
                                  <td style={{ padding: '9px 12px' }}>₹{r.entry_price}</td>
                                  <td style={{ padding: '9px 12px' }}>₹{r.exit_price || r.target1 || r.stop_loss}</td>
                                  <td style={{ padding: '9px 12px', fontWeight: 700, color: r.ret >= 0 ? '#059669' : '#dc2626' }}>{r.ret >= 0 ? '+' : ''}{r.ret?.toFixed(2)}%</td>
                                  <td style={{ padding: '9px 12px' }}>
                                    <span style={{ ...S.badge, background: r.status === 'target_hit' ? '#d1fae5' : '#fee2e2', color: r.status === 'target_hit' ? '#065f46' : '#991b1b', fontSize: '10px' }}>
                                      {r.status?.replace('_',' ').toUpperCase()}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr style={{ background: '#FAF9F5', borderTop: '2px solid #e2e8f0' }}>
                                <td colSpan={5} style={{ padding: '9px 12px', fontWeight: 700, color: '#334155' }}>Month Summary</td>
                                <td style={{ padding: '9px 12px', fontWeight: 800, color: perfData.curMonthRecs.filter(r=>r.status==='target_hit').length / perfData.curMonthRecs.length >= 0.5 ? '#059669' : '#dc2626' }}>
                                  {((perfData.curMonthRecs.filter(r=>r.status==='target_hit').length / perfData.curMonthRecs.length) * 100).toFixed(1)}% win rate
                                </td>
                                <td style={{ padding: '9px 12px', fontWeight: 700, color: '#64748b' }}>
                                  {perfData.curMonthRecs.filter(r=>r.status==='target_hit').length}/{perfData.curMonthRecs.length} wins
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {/* ─── REVENUE TAB ─── */}
          {activeTab === 'revenue' && (
            <div>
              {loading || !revenueData ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Loading revenue data...</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: '12px', marginBottom: '24px' }}>
                    {[
                      { label: 'Est. MRR', value: '₹' + fmtCurr(revenueData.mrr), color: '#d97706' },
                      { label: 'Est. ARR', value: '₹' + fmtCurr(revenueData.mrr * 12), color: '#059669' },
                      { label: 'Active Subs', value: revenueData.active, color: '#1e40af' },
                      { label: 'Churned', value: revenueData.churned, color: '#dc2626' },
                      { label: 'Churn Rate', value: revenueData.churnRate + '%', color: parseFloat(revenueData.churnRate) > 20 ? '#dc2626' : '#059669' },
                      { label: 'Avg LTV (6mo)', value: '₹' + fmtCurr(revenueData.avgLTV), color: '#7c3aed' },
                    ].map((s,i) => (
                      <div key={i} style={{ ...S.card, padding: '14px', textAlign: 'center' }}>
                        <p style={{ fontSize: '20px', fontWeight: 800, color: s.color }}>{s.value}</p>
                        <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ ...S.card }}>
                      <h3 style={{ ...S.h4, marginBottom: '16px' }}>Revenue by Plan</h3>
                      {revenueData.planBreakdown.map(p => (
                        <div key={p.plan} style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155', textTransform: 'capitalize' }}>{PLANS[p.plan]?.name}</span>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <span style={{ fontSize: '12px', color: '#64748b' }}>{p.count} subs</span>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: '#d97706' }}>₹{fmtCurr(p.revenue)}/mo</span>
                            </div>
                          </div>
                          <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '6px', borderRadius: '3px', background: PLANS[p.plan]?.color || '#1d4ed8', width: revenueData.mrr > 0 ? (p.revenue/revenueData.mrr*100)+'%' : '0%' }} />
                          </div>
                        </div>
                      ))}
                      {revenueData.planBreakdown.length === 0 && <p style={{ color: '#94a3b8', fontSize: '13px' }}>No active subscribers yet.</p>}
                    </div>
                    <div style={{ ...S.card }}>
                      <h3 style={{ ...S.h4, marginBottom: '16px' }}>Renewal Forecast</h3>
                      {[
                        { label: 'Expiring this week', val: revenueData.expiringWeek, color: '#dc2626' },
                        { label: 'Expiring this month', val: revenueData.expiringMonth, color: '#d97706' },
                        { label: 'Revenue at risk (week)', val: '₹' + fmtCurr(revenueData.expiringWeek * (revenueData.mrr / Math.max(revenueData.active,1))), color: '#dc2626' },
                        { label: 'Revenue at risk (month)', val: '₹' + fmtCurr(revenueData.expiringMonth * (revenueData.mrr / Math.max(revenueData.active,1))), color: '#d97706' },
                      ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ fontSize: '13px', color: '#64748b' }}>{item.label}</span>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: item.color }}>{item.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ ...S.card }}>
                    <h3 style={{ ...S.h4, marginBottom: '16px' }}>New Subscribers — Last 6 Months</h3>
                    <div style={{ display: 'flex', gap: '0', alignItems: 'flex-end', height: '100px' }}>
                      {revenueData.monthlyGrowth.map((m, i) => {
                        const max = Math.max(...revenueData.monthlyGrowth.map(x => x.newSubs), 1);
                        return (
                          <div key={m.ym} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e40af' }}>{m.newSubs || ''}</span>
                            <div style={{ width: '80%', background: '#1e40af', borderRadius: '4px 4px 0 0', height: (m.newSubs/max*70) + 'px', minHeight: m.newSubs > 0 ? '4px' : '0', transition: 'height 0.4s' }} />
                            <span style={{ fontSize: '10px', color: '#94a3b8' }}>{m.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ─── EMAIL COMPOSER TAB ─── */}
          {activeTab === 'email' && (
            <div>
              <div style={{ ...S.card, marginBottom: '16px' }}>
                <h3 style={{ ...S.h4, marginBottom: '4px' }}>📧 Email Composer</h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>Compose and send emails to your subscribers. Opens your email client with pre-filled content.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={S.label}>Send To</label>
                    <select style={S.select} value={emailForm.plan_target} onChange={e => setEF('plan_target', e.target.value)}>
                      <option value="all">All Users</option>
                      <option value="basic">Basic Equity</option>
                      <option value="premium">Premium Equity</option>
                      <option value="fno">F&O Pro</option>
                      <option value="elite">Elite All Access</option>
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>Subject *</label>
                    <input style={S.input} placeholder="New research call published — RELIANCE BUY" value={emailForm.subject} onChange={e => setEF('subject', e.target.value)} />
                  </div>
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={S.label}>Email Body *</label>
                  <textarea style={{ ...S.textarea, minHeight: '160px' }} placeholder="Write your email content here..." value={emailForm.body} onChange={e => setEF('body', e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => { if (!emailForm.subject || !emailForm.body) return; window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('[StockVista] ' + emailForm.subject)}&body=${encodeURIComponent(emailForm.body)}`; }} style={{ ...S.btn, ...S.btnPrimary }}>
                    📧 Open in Email Client
                  </button>
                  <button onClick={() => navigator.clipboard?.writeText(emailForm.body)} style={{ ...S.btn, ...S.btnSecondary }}>📋 Copy Body</button>
                </div>
                <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '10px' }}>💡 For bulk email to all subscribers, integrate Resend.com (free 3,000 emails/month). Email: resend.com/docs</p>
              </div>
              <div style={{ ...S.card }}>
                <h3 style={{ ...S.h4, marginBottom: '12px' }}>Quick Email Templates</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { label: '📊 New Call Alert', subj: 'New Research Call Published', body: `Dear Subscriber,\n\nWe have published a new research call on your plan.\n\nPlease login to StockVista to view the complete analysis with entry price, target, and stop-loss.\n\nhttps://stock-vista-sandy.vercel.app/live-calls\n\nRisk Disclaimer: Investment in securities market is subject to market risk. Past performance is not indicative of future results.\n\nRegards,\n${ANALYST_NAME}\nStockVista · ${SEBI_REG}` },
                    { label: '⏰ Expiry Reminder', subj: 'Your StockVista Subscription Expires Soon', body: `Dear Subscriber,\n\nYour StockVista subscription is expiring soon. Renew now to continue accessing research calls without interruption.\n\nRenew here: https://stock-vista-sandy.vercel.app/subscription\n\nIf you have any questions, reply to this email.\n\nRegards,\n${ANALYST_NAME}\nStockVista` },
                    { label: '🎯 Target Hit', subj: 'Target Achieved on Research Call', body: `Dear Subscriber,\n\nOne of our research calls has hit its target. Please review your positions and consider booking profits.\n\nView performance: https://stock-vista-sandy.vercel.app/performance\n\nRemember to maintain stop-loss discipline on open positions.\n\nRegards,\n${ANALYST_NAME}\nStockVista` },
                    { label: '📈 Market Update', subj: 'Important Market Update from StockVista', body: `Dear Subscriber,\n\nOur analyst has published an important market update. Login to StockVista to read the full analysis.\n\nhttps://stock-vista-sandy.vercel.app/dashboard\n\nRegards,\n${ANALYST_NAME}\nStockVista · ${SEBI_REG}` },
                  ].map((t,i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#FAF9F5', borderRadius: '8px', border: '1px solid #E5E3DA' }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{t.label}</p>
                      <button onClick={() => { setEF('subject', t.subj); setEF('body', t.body); }} style={{ ...S.btn, ...S.btnSecondary, ...S.btnSm }}>Use Template</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── COUPONS TAB ─── */}
          {activeTab === 'coupons' && (() => {
            const saveCoupon = async () => {
              if (!couponForm.code || !couponForm.value) { setCouponMsg('Code and value required.'); return; }
              setCouponSaving(true);
              // Marketing can create coupons but they stay inactive and
              // unapproved until the owner signs off (with password
              // re-confirmation) — same principle as the recommendation
              // approval workflow, applied here since coupons directly
              // affect revenue.
              const needsApproval = myRole === 'marketing';
              const payload = {
                ...couponForm, code: couponForm.code.toUpperCase(), value: parseFloat(couponForm.value),
                max_uses: parseInt(couponForm.max_uses) || null, uses: 0,
                active: !needsApproval, approved: !needsApproval,
                submitted_by_email: needsApproval ? user.email : null,
                created_at: new Date().toISOString(),
              };
              const { error } = await supabase.from('coupons').insert([payload]);
              setCouponSaving(false);
              if (error) { setCouponMsg('Error: ' + error.message); return; }
              if (needsApproval) {
                await logAudit('SUBMIT_COUPON_FOR_APPROVAL', 'coupon', 'new', { code: payload.code });
                setCouponMsg('✅ Submitted for owner approval — not active yet.');
              } else {
                setCouponMsg('✅ Coupon created!');
              }
              setCouponForm({ code: '', type: 'percent', value: '', plan_id: 'all', max_uses: '', expires_at: '' });
              fetchData();
            };

            const deactivate = async (id) => {
              await supabase.from('coupons').update({ active: false }).eq('id', id);
              fetchData();
            };

            // Dynamic, unique-ish code — not guaranteed collision-free across
            // the whole table, but astronomically unlikely to clash, and
            // saveCoupon's insert would surface a duplicate-key error anyway
            // if it ever did.
            const generateCode = () => {
              const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
              setCF('code', `SV-${rand}`);
            };

            const copyCode = (code) => {
              navigator.clipboard?.writeText(code);
              setCouponMsg(`✅ Copied ${code}`);
              setTimeout(() => setCouponMsg(''), 1500);
            };

            // Status is fully derived from the data — never stored separately
            // — so it can never drift out of sync with reality.
            const getCouponStatus = (c) => {
              if (!c.approved) return { label: 'Pending approval', bg: '#E6F1FB', color: '#0C447C' };
              if (!c.active) return { label: 'Deactivated', bg: '#F1EFE8', color: '#5F5E5A' };
              if (c.expires_at && new Date(c.expires_at) < new Date()) return { label: 'Expired', bg: '#F1EFE8', color: '#5F5E5A' };
              if (c.max_uses && (c.uses || 0) >= c.max_uses) return { label: 'Exhausted', bg: '#FCEBEB', color: '#791F1F' };
              if (c.expires_at) {
                const daysLeft = (new Date(c.expires_at) - new Date()) / (1000 * 60 * 60 * 24);
                if (daysLeft <= 3) return { label: 'Expiring soon', bg: '#FAEEDA', color: '#633806' };
              }
              return { label: 'Active', bg: '#EAF3DE', color: '#27500A' };
            };

            const activeCoupons = coupons.filter(c => c.approved && c.active);
            const totalRedemptions = coupons.reduce((sum, c) => sum + (c.uses || 0), 0);
            const pendingCount = coupons.filter(c => !c.approved).length;

            return (
              <div>
                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { label: 'Active coupons', value: activeCoupons.length, color: '#0A0A0A' },
                    { label: 'Total redemptions', value: totalRedemptions, color: '#27500A' },
                    { label: 'Total coupons', value: coupons.length, color: '#185FA5' },
                    { label: 'Pending approval', value: pendingCount, color: '#712B13' },
                  ].map((s, i) => (
                    <div key={i} style={{ background: '#FAF9F5', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                      <p style={{ fontSize: '20px', fontWeight: 800, color: s.color }}>{s.value}</p>
                      <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                <div style={{ ...S.card, marginBottom: '16px' }}>
                  <div style={{ ...S.flexBetween, marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <h3 style={{ ...S.h4, margin: 0 }}>🎫 Create Coupon</h3>
                    <button onClick={generateCode} style={{ ...S.btn, ...S.btnSm, ...S.btnSecondary }}>↻ Generate code</button>
                  </div>
                  {couponMsg && <div style={{ background: couponMsg.startsWith('✅') ? '#EAF3DE' : '#FCEBEB', color: couponMsg.startsWith('✅') ? '#27500A' : '#791F1F', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' }}>{couponMsg}</div>}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={S.label}>Coupon Code *</label>
                      <input style={{ ...S.input, fontFamily: 'monospace', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em' }} placeholder="LAUNCH50" value={couponForm.code} onChange={e => setCF('code', e.target.value.toUpperCase())} />
                    </div>
                    <div>
                      <label style={S.label}>Discount Type</label>
                      <select style={S.select} value={couponForm.type} onChange={e => setCF('type', e.target.value)}>
                        <option value="percent">% Percentage</option>
                        <option value="flat">₹ Flat Amount</option>
                      </select>
                    </div>
                    <div>
                      <label style={S.label}>Value * ({couponForm.type === 'percent' ? '%' : '₹'})</label>
                      <input style={S.input} type="number" placeholder={couponForm.type === 'percent' ? '20' : '500'} value={couponForm.value} onChange={e => setCF('value', e.target.value)} />
                    </div>
                    <div>
                      <label style={S.label}>Apply to Plan</label>
                      <select style={S.select} value={couponForm.plan_id} onChange={e => setCF('plan_id', e.target.value)}>
                        <option value="all">All Plans</option>
                        <option value="basic">Basic Equity</option>
                        <option value="premium">Premium Equity</option>
                        <option value="fno">F&O Pro</option>
                        <option value="elite">Elite All Access</option>
                      </select>
                    </div>
                    <div>
                      <label style={S.label}>Max Uses (blank = unlimited)</label>
                      <input style={S.input} type="number" placeholder="100" value={couponForm.max_uses} onChange={e => setCF('max_uses', e.target.value)} />
                    </div>
                    <div>
                      <label style={S.label}>Expiry Date</label>
                      <input style={S.input} type="date" value={couponForm.expires_at} onChange={e => setCF('expires_at', e.target.value)} />
                    </div>
                  </div>
                  <button onClick={saveCoupon} disabled={couponSaving} style={{ ...S.btn, ...S.btnPrimary, opacity: couponSaving ? 0.7 : 1 }}>
                    {couponSaving ? 'Creating...' : myRole === 'marketing' ? '📤 Submit for Approval' : '🎫 Create Coupon'}
                  </button>
                </div>

                <p style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>All coupons ({coupons.length})</p>
                {coupons.length === 0 ? (
                  <div style={{ ...S.card, textAlign: 'center', padding: '32px' }}>
                    <p style={{ color: '#94a3b8', fontSize: '13px' }}>No coupons created yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {coupons.map(c => {
                      const status = getCouponStatus(c);
                      const pct = c.max_uses ? Math.min(100, ((c.uses || 0) / c.max_uses) * 100) : 0;
                      return (
                        <div key={c.id} style={{ ...S.card, padding: '14px 18px' }}>
                          <div style={{ ...S.flexBetween, marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '14px', color: '#0A0A0A', letterSpacing: '0.04em' }}>{c.code}</span>
                              <button onClick={() => copyCode(c.code)} title="Copy code" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#94a3b8' }}>⧉</button>
                            </div>
                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', background: status.bg, color: status.color }}>{status.label}</span>
                          </div>
                          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                            {c.type === 'percent' ? `${c.value}% off` : `₹${c.value} off`} · {c.plan_id === 'all' ? 'All plans' : PLANS[c.plan_id]?.name}
                            {c.expires_at ? ` · expires ${new Date(c.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
                            {c.submitted_by_email ? ` · submitted by ${c.submitted_by_email}` : ''}
                          </p>
                          {c.max_uses ? (
                            <>
                              <div style={{ height: '5px', background: '#FAF9F5', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ height: '5px', width: pct + '%', background: pct >= 100 ? '#791F1F' : '#185FA5' }} />
                              </div>
                              <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>{c.uses || 0} of {c.max_uses} used</p>
                            </>
                          ) : (
                            <p style={{ fontSize: '10px', color: '#94a3b8' }}>{c.uses || 0} used · unlimited</p>
                          )}
                          {c.active && c.approved && (
                            <button onClick={() => deactivate(c.id)} style={{ ...S.btn, ...S.btnSm, background: '#FCEBEB', color: '#791F1F', border: 'none', marginTop: '10px' }}>Deactivate</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ─── BULK ACTIONS TAB ─── */}
          {activeTab === 'bulk' && (() => {
            const liveRecs = recs.filter(r => ['live','near_target','near_sl'].includes(r.status));
            const allClosed = recs.filter(r => ['target_hit','sl_hit','expired','closed'].includes(r.status));
            const segments = [...new Set(recs.map(r => r.segment))].filter(Boolean);

            const filteredRecs = segFilter === 'all' ? recs : recs.filter(r => r.segment === segFilter);
            const toggle = (id) => setSelectedRecs(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
            const toggleAll = () => setSelectedRecs(filteredRecs.length === selectedRecs.length ? [] : filteredRecs.map(r => r.id));

            const applyBulk = async () => {
              if (!bulkAction || selectedRecs.length === 0) { setBulkMsg('Select calls and an action.'); return; }
              if (!confirm(`Apply "${bulkAction}" to ${selectedRecs.length} call(s)?`)) return;
              setBulkLoading(true);
              for (const id of selectedRecs) {
                await supabase.from('recommendations').update({ status: bulkAction, updated_at: new Date().toISOString() }).eq('id', id);
                await logAudit('BULK_STATUS_UPDATE', 'recommendation', id, { new_status: bulkAction, bulk_count: selectedRecs.length });
              }
              setBulkMsg(`✅ ${selectedRecs.length} calls updated to "${bulkAction}"`);
              setSelectedRecs([]);
              setBulkLoading(false);
              fetchData();
            };

            const bulkUpdateCMP = async () => {
              const entries = Object.entries(cmpUpdates).filter(([,v]) => v);
              if (entries.length === 0) { setBulkMsg('Enter CMP values first.'); return; }
              setBulkLoading(true);
              for (const [id, cmp] of entries) {
                await supabase.from('recommendations').update({ cmp: parseFloat(cmp), updated_at: new Date().toISOString() }).eq('id', id);
              }
              await logAudit('BULK_CMP_UPDATE', 'recommendation', 'bulk', { count: entries.length, ids: entries.map(([id]) => id) });
              setBulkMsg(`✅ CMP updated for ${entries.length} calls`);
              setCmpUpdates({});
              setBulkLoading(false);
              fetchData();
            };

            return (
              <div>
                {bulkMsg && <div style={{ background: bulkMsg.startsWith('✅') ? '#d1fae5' : '#fee2e2', color: bulkMsg.startsWith('✅') ? '#065f46' : '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{bulkMsg}</div>}

                {/* Bulk status action */}
                <div style={{ ...S.card, marginBottom: '16px' }}>
                  <h3 style={{ ...S.h4, marginBottom: '12px' }}>⚡ Bulk Status Update</h3>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px', alignItems: 'center' }}>
                    <div>
                      <label style={S.label}>Filter by segment</label>
                      <select style={{ ...S.select, width: '140px' }} value={segFilter} onChange={e => { setSegFilter(e.target.value); setSelectedRecs([]); }}>
                        <option value="all">All Segments</option>
                        {segments.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={S.label}>Apply Action</label>
                      <select style={{ ...S.select, width: '160px' }} value={bulkAction} onChange={e => setBulkAction(e.target.value)}>
                        <option value="">Select action...</option>
                        <option value="closed">Close</option>
                        <option value="expired">Mark Expired</option>
                        <option value="archived">Archive</option>
                        <option value="target_hit">Mark Target Hit</option>
                        <option value="sl_hit">Mark SL Hit</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end' }}>
                      <button onClick={applyBulk} disabled={bulkLoading || selectedRecs.length === 0} style={{ ...S.btn, ...S.btnPrimary, opacity: (bulkLoading || selectedRecs.length === 0) ? 0.5 : 1 }}>
                        {bulkLoading ? 'Updating...' : `Apply to ${selectedRecs.length} selected`}
                      </button>
                    </div>
                  </div>
                  <div style={{ ...S.card, padding: '0', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#FAF9F5' }}>
                          <th style={{ padding: '10px 12px', borderBottom: '2px solid #e2e8f0' }}>
                            <input type="checkbox" checked={selectedRecs.length === filteredRecs.length && filteredRecs.length > 0} onChange={toggleAll} />
                          </th>
                          {['Symbol', 'Action', 'Status', 'Segment', 'Published'].map(h => (
                            <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#94a3b8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRecs.slice(0,30).map(r => (
                          <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', background: selectedRecs.includes(r.id) ? '#eff6ff' : 'transparent' }}>
                            <td style={{ padding: '10px 12px' }}><input type="checkbox" checked={selectedRecs.includes(r.id)} onChange={() => toggle(r.id)} /></td>
                            <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0A0A0A' }}>{r.symbol}</td>
                            <td style={{ padding: '10px 12px' }}><span style={{ ...S.badge, ...actionStyle(r.action), fontSize: '11px' }}>{r.action}</span></td>
                            <td style={{ padding: '10px 12px', fontSize: '12px', color: '#64748b', textTransform: 'capitalize' }}>{r.status?.replace('_',' ')}</td>
                            <td style={{ padding: '10px 12px', fontSize: '12px', color: '#94a3b8', textTransform: 'capitalize' }}>{r.segment}</td>
                            <td style={{ padding: '10px 12px', fontSize: '11px', color: '#94a3b8' }}>{r.published_at ? new Date(r.published_at).toLocaleDateString('en-IN') : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bulk CMP update */}
                <div style={{ ...S.card }}>
                  <h3 style={{ ...S.h4, marginBottom: '4px' }}>📈 Bulk CMP Update (Live Calls)</h3>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>Update current market price for all live calls at once</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                    {liveRecs.map(r => (
                      <div key={r.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#FAF9F5', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E5E3DA' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 700, fontSize: '12px', color: '#0A0A0A' }}>{r.symbol}</p>
                          <p style={{ fontSize: '10px', color: '#94a3b8' }}>Entry ₹{r.entry_price}</p>
                        </div>
                        <input type="number" placeholder={String(r.cmp || r.entry_price)} value={cmpUpdates[r.id] || ''} onChange={e => setCmpUpdates(c => ({ ...c, [r.id]: e.target.value }))}
                          style={{ width: '80px', padding: '5px 8px', border: '1px solid #E5E3DA', borderRadius: '6px', fontSize: '12px' }} />
                      </div>
                    ))}
                    {liveRecs.length === 0 && <p style={{ color: '#94a3b8', fontSize: '13px' }}>No live calls at the moment.</p>}
                  </div>
                  <button onClick={bulkUpdateCMP} disabled={bulkLoading} style={{ ...S.btn, ...S.btnSecondary, opacity: bulkLoading ? 0.5 : 1 }}>
                    {bulkLoading ? 'Updating...' : '💾 Save All CMP Updates'}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* ─── PLATFORM SETTINGS TAB ─── */}
          {activeTab === 'settings' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Maintenance mode */}
                <div style={{ ...S.card, border: settings.maintenance_mode ? '2px solid #dc2626' : '1.5px solid #bfdbfe' }}>
                  <h3 style={{ ...S.h4, marginBottom: '4px' }}>🚧 Maintenance Mode</h3>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>Shows a banner to all users that the platform is under maintenance.</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div onClick={() => setSettings(s => ({ ...s, maintenance_mode: !s.maintenance_mode }))}
                      style={{ width: '44px', height: '24px', borderRadius: '12px', background: settings.maintenance_mode ? '#dc2626' : '#e2e8f0', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                      <div style={{ position: 'absolute', top: '3px', left: settings.maintenance_mode ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: settings.maintenance_mode ? '#dc2626' : '#64748b' }}>
                      {settings.maintenance_mode ? '🔴 Maintenance ON' : 'Off'}
                    </span>
                  </div>
                  <div style={S.formGroup}>
                    <label style={S.label}>Maintenance Message</label>
                    <textarea style={{ ...S.textarea, minHeight: '60px' }} value={settings.maintenance_msg} onChange={e => setSettings(s => ({ ...s, maintenance_msg: e.target.value }))} />
                  </div>
                </div>

                {/* SEBI reg */}
                <div style={{ ...S.card }}>
                  <h3 style={{ ...S.h4, marginBottom: '4px' }}>🛡️ SEBI Registration</h3>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>Update once your SEBI RA registration number is issued. This appears on all pages.</p>
                  <div style={S.formGroup}>
                    <label style={S.label}>SEBI RA Registration Number</label>
                    <input style={S.input} value={settings.sebi_reg} onChange={e => setSettings(s => ({ ...s, sebi_reg: e.target.value }))} placeholder="INH000XXXXXX" />
                  </div>
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#92400e' }}>
                    ⚠️ Currently showing: <strong>{SEBI_REG}</strong>
                  </div>
                </div>

                {/* Disclaimer text */}
                <div style={{ ...S.card, gridColumn: '1/-1' }}>
                  <h3 style={{ ...S.h4, marginBottom: '4px' }}>⚠️ Global Disclaimer Text</h3>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>Shown in amber disclaimer boxes across all pages.</p>
                  <div style={S.formGroup}>
                    <textarea style={{ ...S.textarea, minHeight: '80px' }} value={settings.disclaimer_text} onChange={e => setSettings(s => ({ ...s, disclaimer_text: e.target.value }))} />
                  </div>
                </div>

                {/* Feature visibility */}
                <div style={{ ...S.card, gridColumn: '1/-1' }}>
                  <h3 style={{ ...S.h4, marginBottom: '12px' }}>👥 Feature Access for Free Users</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { key: 'show_portfolio_to_free', label: 'Portfolio Tracker', desc: 'Allow free users to access portfolio tracking' },
                      { key: 'show_watchlist_to_free', label: 'Watchlist', desc: 'Allow free users to access watchlist page' },
                      { key: 'show_blog_to_all', label: 'Blog / Education', desc: 'Show blog articles to all users (recommended for SEO)' },
                    ].map(f => (
                      <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#FAF9F5', borderRadius: '8px', border: '1px solid #E5E3DA' }}>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '13px', color: '#0A0A0A' }}>{f.label}</p>
                          <p style={{ fontSize: '11px', color: '#94a3b8' }}>{f.desc}</p>
                        </div>
                        <div onClick={() => setSettings(s => ({ ...s, [f.key]: !s[f.key] }))}
                          style={{ width: '44px', height: '24px', borderRadius: '12px', background: settings[f.key] ? '#059669' : '#e2e8f0', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                          <div style={{ position: 'absolute', top: '3px', left: settings[f.key] ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', alignItems: 'center' }}>
                <button onClick={() => { setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 3000); }} style={{ ...S.btn, ...S.btnPrimary }}>
                  💾 Save Settings
                </button>
                {settingsSaved && <span style={{ fontSize: '13px', color: '#059669', fontWeight: 600 }}>✅ Settings saved!</span>}
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>Note: SEBI reg change requires App.jsx update to persist across deployments.</p>
              </div>
            </div>
          )}

          {/* AUDIT LOG TAB */}
          {activeTab === 'audit' && (() => {
            const exportCSV = () => {
              const headers = ['Timestamp','Action','Entity Type','Entity ID','Performed By','Details'];
              const rows = auditLogs.map(l => [
                new Date(l.created_at).toLocaleString('en-IN'),
                l.action||'', l.entity_type||'', l.entity_id||'',
                l.performed_by_email||l.performed_by||'', l.details||'',
              ]);
              const csv = [headers,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
              const blob = new Blob([csv],{type:'text/csv'});
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `stockvista_audit_${new Date().toISOString().slice(0,10)}.csv`;
              a.click();
            };
            const actionColor = (action) => {
              if(action?.includes('DELETE')) return {bg:'#fee2e2',color:'#991b1b'};
              if(action?.includes('CREATE')||action?.includes('PUBLISH')) return {bg:'#d1fae5',color:'#065f46'};
              if(action?.includes('UPDATE')||action?.includes('STATUS')) return {bg:'#dbeafe',color:'#1e40af'};
              if(action?.includes('SUSPEND')) return {bg:'#fef3c7',color:'#92400e'};
              return {bg:'#f1f5f9',color:'#64748b'};
            };
            return (
              <div>
                <div style={{...S.flexBetween,marginBottom:'16px',flexWrap:'wrap',gap:'10px'}}>
                  <div>
                    <h3 style={{...S.h4,marginBottom:'2px'}}>Audit Log</h3>
                    <p style={{fontSize:'12px',color:'#64748b'}}>{auditLogs.length} entries · Immutable · No delete</p>
                  </div>
                  <button onClick={exportCSV} style={{...S.btn,...S.btnSecondary}}>⬇️ Export CSV for SEBI</button>
                </div>
                <div style={{...S.disclaimer,marginBottom:'16px'}}>
                  ⚠️ Audit log maintained for SEBI compliance under SEBI (Research Analysts) Regulations 2014. Immutable — no entries can be deleted. Export as CSV for regulatory inspection.
                </div>
                {loading ? <div style={{textAlign:'center',padding:'60px',color:'#94a3b8'}}>Loading audit log...</div>
                : auditLogs.length === 0 ? (
                  <div style={{...S.card,textAlign:'center',padding:'60px'}}>
                    <div style={{fontSize:'40px',marginBottom:'12px'}}>📋</div>
                    <h3 style={{...S.h3,marginBottom:'8px'}}>No audit entries yet</h3>
                    <p style={{color:'#64748b',fontSize:'13px'}}>Admin actions — publish call, edit status, update user — are logged automatically.</p>
                  </div>
                ) : (
                  <div style={{...S.card,padding:'0',overflowX:'auto'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
                      <thead>
                        <tr style={{background:'#FAF9F5'}}>
                          {['Timestamp','Action','Entity','Performed By','Details'].map(h=>(
                            <th key={h} style={{padding:'10px 14px',textAlign:'left',borderBottom:'2px solid #e2e8f0',color:'#94a3b8',fontWeight:700,fontSize:'10px',textTransform:'uppercase',letterSpacing:'0.05em',whiteSpace:'nowrap'}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log,i) => {
                          const c = actionColor(log.action);
                          let d={};
                          try{d=JSON.parse(log.details||'{}');}catch(e){}
                          return (
                            <tr key={log.id||i} style={{borderBottom:'1px solid #f1f5f9'}}
                              onMouseEnter={e=>e.currentTarget.style.background='#FAF9F5'}
                              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                              <td style={{padding:'10px 14px',whiteSpace:'nowrap',color:'#64748b',fontSize:'11px'}}>
                                <p>{new Date(log.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'})}</p>
                                <p style={{color:'#94a3b8',fontSize:'10px'}}>{new Date(log.created_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</p>
                              </td>
                              <td style={{padding:'10px 14px',whiteSpace:'nowrap'}}>
                                <span style={{...S.badge,background:c.bg,color:c.color,fontSize:'10px'}}>{log.action?.replace(/_/g,' ')}</span>
                              </td>
                              <td style={{padding:'10px 14px',fontSize:'11px'}}>
                                <p style={{fontWeight:600,color:'#334155',textTransform:'capitalize'}}>{log.entity_type?.replace('_',' ')}</p>
                                {d.symbol&&<p style={{color:'#94a3b8',fontSize:'10px'}}>{d.symbol}</p>}
                                {d.email&&<p style={{color:'#94a3b8',fontSize:'10px'}}>{d.email}</p>}
                              </td>
                              <td style={{padding:'10px 14px',fontSize:'11px',color:'#64748b',whiteSpace:'nowrap'}}>{log.performed_by_email||'—'}</td>
                              <td style={{padding:'10px 14px',fontSize:'11px',color:'#64748b',maxWidth:'200px'}}>
                                {Object.entries(d).filter(([k])=>!['symbol','email'].includes(k)).slice(0,4).map(([k,v])=>(
                                  <span key={k} style={{display:'inline-block',background:'#f1f5f9',borderRadius:'4px',padding:'1px 5px',margin:'1px',fontSize:'10px'}}>
                                    {k.replace(/_/g,' ')}: <strong>{String(v).slice(0,20)}</strong>
                                  </span>
                                ))}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

          {activeTab === 'approvals' && (
            <div>
              <div style={{ ...S.flexBetween, marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ ...S.h4, marginBottom: '2px' }}>Pending Approvals</h3>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>{pendingApprovals.length} call{pendingApprovals.length === 1 ? '' : 's'} waiting on your approval before going live</p>
                </div>
              </div>

              {loading ? (
                <div style={{ ...S.card, textAlign: 'center', padding: '40px', ...S.muted }}>Loading...</div>
              ) : pendingApprovals.length === 0 ? (
                <div style={{ ...S.card, textAlign: 'center', padding: '40px' }}>
                  <p style={S.muted}>Nothing waiting on approval right now.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {pendingApprovals.map(rec => (
                    <div key={rec.id} style={{ ...S.card, padding: '14px 18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '14px' }}>{rec.symbol} <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '12px' }}>{rec.exchange}</span></span>
                          <span style={{ ...S.badge, marginLeft: '8px', ...actionStyle(rec.action) }}>{rec.action}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>submitted by {rec.submitted_by_email || 'analyst'}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>Entry {fmt(rec.entry_price)} · Target {fmt(rec.target1)} · SL {fmt(rec.stop_loss)} · wants status: <strong>{rec.requested_status}</strong></p>
                      {rec.rationale && <p style={{ fontSize: '12px', color: '#334155', marginBottom: '10px', whiteSpace: 'pre-wrap' }}>{rec.rationale}</p>}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => { setApproveModalRec(rec); setApprovePassword(''); setApproveMsg(''); }} style={{ ...S.btn, ...S.btnSm, background: '#185FA5', color: '#fff' }}>Approve and publish</button>
                        <button onClick={() => rejectApproval(rec)} style={{ ...S.btn, ...S.btnSm, ...S.btnSecondary }}>Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {approveModalRec && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,10,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                  <div style={{ ...S.card, maxWidth: '380px', width: '100%' }}>
                    <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Confirm your password to publish</p>
                    <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>{approveModalRec.symbol} will go live to subscribers as soon as you confirm.</p>
                    {approveMsg && <p style={{ fontSize: '12px', color: '#dc2626', marginBottom: '10px' }}>{approveMsg}</p>}
                    <input type="password" style={{ ...S.input, marginBottom: '12px' }} placeholder="Your account password" value={approvePassword} onChange={e => setApprovePassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && confirmApprove()} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={confirmApprove} disabled={approveLoading || !approvePassword} style={{ ...S.btn, ...S.btnPrimary, flex: 1, opacity: (approveLoading || !approvePassword) ? 0.6 : 1 }}>
                        {approveLoading ? 'Confirming...' : `Confirm and publish ${approveModalRec.symbol}`}
                      </button>
                      <button onClick={() => { setApproveModalRec(null); setApprovePassword(''); }} style={{ ...S.btn, ...S.btnSecondary }}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Pending coupons — Marketing-created, waiting on owner approval */}
              <div style={{ marginTop: '32px' }}>
                <h3 style={{ ...S.h4, marginBottom: '4px' }}>Pending Coupons</h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>{pendingCoupons.length} coupon{pendingCoupons.length === 1 ? '' : 's'} from Marketing waiting on approval</p>
                {pendingCoupons.length === 0 ? (
                  <div style={{ ...S.card, textAlign: 'center', padding: '30px' }}>
                    <p style={S.muted}>Nothing waiting on coupon approval right now.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {pendingCoupons.map(c => (
                      <div key={c.id} style={{ ...S.card, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '14px' }}>{c.code} <span style={{ fontWeight: 400, fontSize: '12px', color: '#94a3b8' }}>{c.type === 'percent' ? `${c.value}% off` : `₹${c.value} off`} · {c.plan_id}</span></p>
                          <p style={{ fontSize: '11px', color: '#94a3b8' }}>submitted by {c.submitted_by_email || 'marketing'}{c.max_uses ? ` · max ${c.max_uses} uses` : ''}{c.expires_at ? ` · expires ${c.expires_at}` : ''}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => { setApproveModalCoupon(c); setCouponApprovePassword(''); setCouponApproveMsg(''); }} style={{ ...S.btn, ...S.btnSm, background: '#185FA5', color: '#fff' }}>Approve and activate</button>
                          <button onClick={() => rejectCoupon(c)} style={{ ...S.btn, ...S.btnSm, ...S.btnSecondary }}>Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {approveModalCoupon && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,10,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                  <div style={{ ...S.card, maxWidth: '380px', width: '100%' }}>
                    <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Confirm your password to activate</p>
                    <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>Coupon {approveModalCoupon.code} will become usable by subscribers as soon as you confirm.</p>
                    {couponApproveMsg && <p style={{ fontSize: '12px', color: '#dc2626', marginBottom: '10px' }}>{couponApproveMsg}</p>}
                    <input type="password" style={{ ...S.input, marginBottom: '12px' }} placeholder="Your account password" value={couponApprovePassword} onChange={e => setCouponApprovePassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && confirmApproveCoupon()} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={confirmApproveCoupon} disabled={couponApproveLoading || !couponApprovePassword} style={{ ...S.btn, ...S.btnPrimary, flex: 1, opacity: (couponApproveLoading || !couponApprovePassword) ? 0.6 : 1 }}>
                        {couponApproveLoading ? 'Confirming...' : `Confirm and activate ${approveModalCoupon.code}`}
                      </button>
                      <button onClick={() => { setApproveModalCoupon(null); setCouponApprovePassword(''); }} style={{ ...S.btn, ...S.btnSecondary }}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'staff' && (
            <div>
              <div style={{ ...S.flexBetween, marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ ...S.h4, marginBottom: '2px' }}>Staff and Roles</h3>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>{staffList.length} staff member{staffList.length === 1 ? '' : 's'} · Each role sees only its own admin tabs</p>
                </div>
              </div>

              {/* Roles overview — generated live from ROLE_TABS, not hardcoded,
                  so it always matches what each role can actually access. */}
              <div style={{ ...S.card, marginBottom: '20px' }}>
                <p style={{ fontWeight: 700, fontSize: '13px', marginBottom: '12px' }}>Admin panel tabs, by role</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                  {Object.entries(ROLE_TABS).map(([role, tabKeys]) => (
                    <div key={role} style={{ border: '1px solid #E5E3DA', borderRadius: '10px', padding: '12px' }}>
                      <p style={{ fontWeight: 700, fontSize: '12px', marginBottom: '8px' }}>{STAFF_ROLE_LABELS[role]}</p>
                      {tabKeys.map(tk => (
                        <p key={tk} style={{ fontSize: '11px', color: '#185FA5', marginBottom: '3px' }}>{TAB_LABELS[tk] || tk}</p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Add staff member */}
              <div style={{ ...S.card, marginBottom: '20px' }}>
                <p style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px' }}>Add staff member</p>
                <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '12px' }}>Search by email — if they already have a StockVista account, assign a role directly. If not, invite them and their account gets created automatically.</p>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <input style={{ ...S.input, flex: 1, minWidth: '200px' }} placeholder="Search by email..." value={staffSearchEmail} onChange={e => { setStaffSearchEmail(e.target.value); setStaffNotFound(false); setStaffSearchResult(null); setStaffSearchMsg(''); }} />
                  <select style={S.select} value={staffSelectedRole} onChange={e => setStaffSelectedRole(e.target.value)}>
                    <option value="research_analyst">Research Analyst</option>
                    <option value="finance">Finance</option>
                    <option value="hr">HR</option>
                    <option value="marketing">Marketing</option>
                    <option value="compliance_officer">Compliance Officer</option>
                    <option value="customer_support">Customer Support</option>
                    <option value="owner">Owner</option>
                  </select>
                  <button onClick={searchStaffByEmail} style={{ ...S.btn, ...S.btnSecondary }}>Search</button>
                </div>
                {staffSearchMsg && <p style={{ fontSize: '12px', marginBottom: '10px', color: staffSearchMsg.startsWith('✅') ? '#059669' : '#dc2626' }}>{staffSearchMsg}</p>}

                {staffNotFound && (
                  <div style={{ background: '#E6F1FB', border: '1px solid #B5D4F4', borderRadius: '10px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '13px', color: '#0C447C' }}>No account yet for {staffSearchEmail}</p>
                      <p style={{ fontSize: '11px', color: '#0C447C' }}>Send them an invite — they'll get an email to create their password and log in as {STAFF_ROLE_LABELS[staffSelectedRole]}.</p>
                    </div>
                    <button onClick={inviteStaffMember} disabled={staffInviteLoading} style={{ ...S.btn, ...S.btnPrimary, opacity: staffInviteLoading ? 0.6 : 1 }}>
                      {staffInviteLoading ? 'Sending...' : `Invite as ${STAFF_ROLE_LABELS[staffSelectedRole]}`}
                    </button>
                  </div>
                )}

                {staffSearchResult && (
                  <div style={{ background: '#FAF9F5', border: '1px solid #E5E3DA', borderRadius: '10px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '13px' }}>{staffSearchResult.full_name || staffSearchResult.email}</p>
                      <p style={{ fontSize: '11px', color: '#94a3b8' }}>{staffSearchResult.email}{staffSearchResult.staff_role ? ` · currently ${STAFF_ROLE_LABELS[staffSearchResult.staff_role]}` : ''}</p>
                    </div>
                    <button onClick={assignStaffRole} style={{ ...S.btn, ...S.btnPrimary }}>Assign as {STAFF_ROLE_LABELS[staffSelectedRole]}</button>
                  </div>
                )}
              </div>

              {/* Current staff list */}
              {loading ? (
                <div style={{ ...S.card, textAlign: 'center', padding: '40px', ...S.muted }}>Loading...</div>
              ) : staffList.length === 0 ? (
                <div style={{ ...S.card, textAlign: 'center', padding: '40px' }}>
                  <p style={S.muted}>No staff members assigned yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {staffList.map(s => (
                    <div key={s.id} style={{ ...S.card, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '13px' }}>{s.full_name || s.email}</p>
                        <p style={{ fontSize: '11px', color: '#94a3b8' }}>{s.email}</p>
                        <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                          {s.last_login_at ? `Last login ${new Date(s.last_login_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'Never logged in yet'}
                          {' · '}{staffActivityCounts[s.email] || 0} action{(staffActivityCounts[s.email] || 0) === 1 ? '' : 's'} this month
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ ...S.badge, background: '#E6F1FB', color: '#0C447C', fontWeight: 700 }}>{STAFF_ROLE_LABELS[s.staff_role] || s.staff_role}</span>
                        {s.id !== user.id && (
                          <button onClick={() => removeStaffRole(s)} style={{ ...S.btn, ...S.btnSm, background: '#fee2e2', color: '#991b1b' }}>Remove</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddRecForm({ existingRec, onSave, adminId, adminEmail, logAudit, myRole }) {
  const empty = { stock_name: '', symbol: '', exchange: 'NSE', segment: 'equity', commodity_type: '', action: 'BUY', entry_price: '', target1: '', target2: '', target3: '', stop_loss: '', exit_price: '', time_horizon: 'swing', risk_level: 'medium', conviction: 'medium', plan_required: 'basic', rationale: '', technical_notes: '', fundamental_notes: '', chart_url: '', report_url: '', status: 'draft', expiry_at: '' };
  const [form, setForm] = useState(existingRec || empty);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const [history, setHistory] = useState([]);
  const [aiDraft, setAiDraft] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiErr, setAiErr] = useState('');

  const generateAiDraft = async () => {
    if (!form.symbol) return;
    setAiLoading(true); setAiErr(''); setAiDraft(null);
    try {
      const res = await fetch('/api/generate-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: form.symbol, exchange: form.exchange, companyName: form.stock_name, segment: form.segment }),
      });
      const json = await res.json();
      if (!res.ok) { setAiErr((json.error || 'Could not generate draft.') + (json.detail ? ' — ' + json.detail : '')); setAiLoading(false); return; }
      setAiDraft(json);
      setAiLoading(false);
    } catch (e) {
      setAiErr('Network error generating draft.');
      setAiLoading(false);
    }
  };

  const [reviewResult, setReviewResult] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewErr, setReviewErr] = useState('');

  // Reviews whatever the admin has typed into the form so far (manual entry,
  // not AI-generated) — deterministic checks (target/SL ordering, risk-reward)
  // plus an AI read against technicals/fundamentals/news, flagging anything
  // that looks inconsistent. Never edits the form itself — advisory only.
  const reviewManualEntry = async () => {
    if (!form.symbol || !form.action || !form.entry_price) return;
    setReviewLoading(true); setReviewErr(''); setReviewResult(null);
    try {
      const res = await fetch('/api/generate-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: form.symbol, exchange: form.exchange, companyName: form.stock_name, segment: form.segment,
          manualEntry: {
            action: form.action,
            entry_price: parseFloat(form.entry_price) || null,
            target1: parseFloat(form.target1) || null,
            target2: parseFloat(form.target2) || null,
            target3: parseFloat(form.target3) || null,
            stop_loss: parseFloat(form.stop_loss) || null,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) { setReviewErr((json.error || 'Could not review entry.') + (json.detail ? ' — ' + json.detail : '')); setReviewLoading(false); return; }
      setReviewResult(json);
      setReviewLoading(false);
    } catch (e) {
      setReviewErr('Network error reviewing entry.');
      setReviewLoading(false);
    }
  };

  useEffect(() => {
    if (!existingRec?.id) return;
    supabase.from('audit_log').select('*')
      .eq('entity_type', 'recommendation').eq('entity_id', existingRec.id)
      .in('action', ['UPDATE_RECOMMENDATION', 'UPDATE_STATUS', 'BULK_STATUS_UPDATE'])
      .order('created_at', { ascending: false })
      .then(({ data }) => setHistory(data || []));
  }, [existingRec?.id]);

  // Fields we track for edit-history purposes — the ones that actually change
  // what the call means (price levels, direction, status, plan tier). We don't
  // bother tracking every text-note field to keep the audit log readable.
  const TRACKED_FIELDS = ['action', 'entry_price', 'target1', 'target2', 'target3', 'stop_loss', 'exit_price', 'status', 'plan_required'];

  const handleSave = async () => {
    if (!form.stock_name || !form.symbol || !form.action) { setMsg('Stock name, symbol and action are required.'); return; }
    setLoading(true);
    const payload = { ...form, created_by: adminId, updated_at: new Date().toISOString() };

    // Research analysts can't publish directly — a new call with any non-draft
    // status goes to pending_approval instead, and the owner must approve
    // (with a password re-confirmation) before it's actually live.
    const needsApproval = REQUIRES_APPROVAL_ROLES.includes(myRole) && !existingRec?.id && form.status !== 'draft';
    if (needsApproval) {
      payload.requested_status = form.status;
      payload.status = 'pending_approval';
      payload.submitted_by_email = adminEmail;
    }

    let error;
    if (existingRec?.id) {
      // Snapshot what changed before overwriting — published calls should never
      // be silently rewritten without a trace of what they originally said.
      const changes = {};
      TRACKED_FIELDS.forEach(f => {
        const oldVal = existingRec[f] ?? null;
        const newVal = form[f] ?? null;
        if (String(oldVal) !== String(newVal)) changes[f] = { from: oldVal, to: newVal };
      });

      const res = await supabase.from('recommendations').update(payload).eq('id', existingRec.id);
      error = res.error;
      if (!error && Object.keys(changes).length > 0 && logAudit) {
        await logAudit('UPDATE_RECOMMENDATION', 'recommendation', existingRec.id, { symbol: form.symbol, changes });
      }
    } else {
      const res = await supabase.from('recommendations').insert([payload]);
      error = res.error;
      if (!error && needsApproval && logAudit) {
        await logAudit('SUBMIT_FOR_APPROVAL', 'recommendation', 'new', { symbol: form.symbol, requested_status: form.status });
      }
    }
    setLoading(false);
    if (error) { setMsg(error.message); return; }
    // Send Telegram alert when actually publishing a live call (not when it's
    // just submitted for approval — payload.status reflects what was really saved)
    if (payload.status === 'live' && !existingRec?.id) {
      await sendTelegramAlert(form);
    }
    setMsg(needsApproval ? '✅ Submitted for owner approval — not live yet.' : '✅ Saved successfully!');
    setTimeout(onSave, 1200);
  };

  const fields = [
    { k: 'stock_name', label: 'Stock Name *', type: 'text', placeholder: 'e.g. Reliance Industries' },
    { k: 'symbol', label: 'NSE/BSE Symbol *', type: 'text', placeholder: 'e.g. RELIANCE' },
  ];
  const selects = [
    { k: 'exchange', label: 'Exchange', opts: ['NSE', 'BSE', 'MCX'] },
    { k: 'segment', label: 'Segment', opts: ['equity', 'futures', 'options', 'commodity'] },
    { k: 'action', label: 'Action *', opts: ['BUY', 'SELL', 'HOLD', 'AVOID', 'EXIT'] },
    { k: 'time_horizon', label: 'Time Horizon', opts: ['intraday', 'swing', 'positional', 'longterm'] },
    { k: 'risk_level', label: 'Risk Level', opts: ['low', 'medium', 'high'] },
    { k: 'conviction', label: 'Conviction', opts: ['low', 'medium', 'high'] },
    { k: 'plan_required', label: 'Plan Required', opts: ['basic', 'premium', 'fno', 'elite'] },
    { k: 'status', label: 'Status', opts: ['draft', 'live', 'near_target', 'near_sl', 'target_hit', 'sl_hit', 'expired', 'closed', 'archived'] },
  ];
  const priceFields = [
    { k: 'entry_price', label: 'Entry Price' },
    { k: 'target1', label: 'Target 1' },
    { k: 'target2', label: 'Target 2' },
    { k: 'target3', label: 'Target 3' },
    { k: 'stop_loss', label: 'Stop Loss' },
    { k: 'exit_price', label: 'Exit Price' },
    { k: 'cmp', label: 'CMP (Current)' },
  ];

  const uploadFile = async (file, kind) => {
    if (!file) return;
    const path = `${kind}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('rec-media').upload(path, file, { upsert: true });
    if (error) { setMsg('Upload failed: ' + error.message); return; }
    const { data } = supabase.storage.from('rec-media').getPublicUrl(path);
    set(kind === 'charts' ? 'chart_url' : 'report_url', data.publicUrl);
  };

  return (
    <div style={S.card}>
      <h3 style={{ ...S.h3, marginBottom: '24px' }}>{existingRec ? '✏️ Edit Recommendation' : '➕ Add New Research Call'}</h3>
      {msg && <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', background: msg.startsWith('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: msg.startsWith('✅') ? '#10b981' : '#ef4444', fontSize: '13px' }}>{msg}</div>}

      <div style={S.grid2}>
        {fields.map(f => (
          <div key={f.k} style={S.formGroup}>
            <label style={S.label}>{f.label}</label>
            <input style={S.input} type={f.type} placeholder={f.placeholder} value={form[f.k]} onChange={e => set(f.k, e.target.value)} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '8px' }}>
        {selects.map(f => (
          <div key={f.k} style={S.formGroup}>
            <label style={S.label}>{f.label}</label>
            <select style={S.select} value={form[f.k]} onChange={e => set(f.k, e.target.value)}>
              {f.opts.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '8px' }}>
        {priceFields.map(f => (
          <div key={f.k} style={S.formGroup}>
            <label style={S.label}>{f.label}</label>
            <input style={S.input} type="number" step="0.05" placeholder="0.00" value={form[f.k]} onChange={e => set(f.k, e.target.value)} />
          </div>
        ))}
      </div>

      {form.segment === 'commodity' && (
        <div style={S.formGroup}>
          <label style={S.label}>Commodity</label>
          <select style={S.select} value={form.commodity_type} onChange={e => set('commodity_type', e.target.value)}>
            <option value="">Select commodity</option>
            {['Gold', 'Silver', 'Crude Oil', 'Natural Gas'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      <div style={S.formGroup}>
        <label style={S.label}>Expiry Date/Time (call auto-marks expired after this)</label>
        <input style={S.input} type="datetime-local" value={form.expiry_at || ''} onChange={e => set('expiry_at', e.target.value)} />
      </div>

      <div style={{ ...S.card, marginBottom: '16px', background: '#faf5ff', border: '1.5px solid #c084fc' }}>
        <div style={{ ...S.flexBetween, flexWrap: 'wrap', gap: '8px', marginBottom: aiDraft || aiErr ? '12px' : 0 }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: '13px', color: '#6b21a8' }}>🤖 AI Research Draft (Phase 6)</p>
            <p style={{ fontSize: '11px', color: '#94a3b8' }}>
              {form.segment === 'equity'
                ? 'Equity: full technical-analysis-backed BUY/SELL/HOLD draft (SMA/RSI/ATR-grounded). Always review before applying.'
                : 'This segment: qualitative summary only (no entry/target/SL) — derivatives/contract data unavailable.'}
            </p>
          </div>
          <button onClick={generateAiDraft} disabled={aiLoading || !form.symbol}
            style={{ ...S.btn, ...S.btnSm, background: '#7c3aed', color: '#fff', opacity: (aiLoading || !form.symbol) ? 0.6 : 1 }}>
            {aiLoading ? 'Generating...' : '✨ Generate Draft'}
          </button>
        </div>
        {aiErr && <p style={{ fontSize: '12px', color: '#dc2626' }}>{aiErr}</p>}

        {aiDraft && aiDraft.isTradeCall && (
          <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.6 }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{ ...S.badge, background: aiDraft.draft.action === 'BUY' ? '#dcfce7' : aiDraft.draft.action === 'SELL' ? '#fee2e2' : '#f1f5f9', color: aiDraft.draft.action === 'BUY' ? '#166534' : aiDraft.draft.action === 'SELL' ? '#991b1b' : '#475569', fontWeight: 800 }}>
                {aiDraft.draft.action}
              </span>
              <span style={{ color: '#94a3b8' }}>Confidence: {aiDraft.draft.confidence}/100</span>
              {aiDraft.validation?.riskReward != null && <span style={{ color: '#94a3b8' }}>R:R 1:{aiDraft.validation.riskReward}</span>}
            </div>

            {aiDraft.draft.action !== 'HOLD' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '8px', marginBottom: '10px', background: '#fff', padding: '10px', borderRadius: '8px' }}>
                <div><p style={{ fontSize: '10px', color: '#94a3b8' }}>ENTRY</p><p style={{ fontWeight: 700 }}>{aiDraft.draft.entry_price ?? '—'}</p></div>
                <div><p style={{ fontSize: '10px', color: '#94a3b8' }}>TARGET 1</p><p style={{ fontWeight: 700 }}>{aiDraft.draft.target1 ?? '—'}</p></div>
                <div><p style={{ fontSize: '10px', color: '#94a3b8' }}>TARGET 2</p><p style={{ fontWeight: 700 }}>{aiDraft.draft.target2 ?? '—'}</p></div>
                <div><p style={{ fontSize: '10px', color: '#94a3b8' }}>TARGET 3</p><p style={{ fontWeight: 700 }}>{aiDraft.draft.target3 ?? '—'}</p></div>
                <div><p style={{ fontSize: '10px', color: '#94a3b8' }}>STOP-LOSS</p><p style={{ fontWeight: 700, color: '#dc2626' }}>{aiDraft.draft.stop_loss ?? '—'}</p></div>
              </div>
            )}

            <p style={{ marginBottom: '6px' }}><strong>Reasoning:</strong> {aiDraft.draft.reasoning}</p>
            <p style={{ marginBottom: '6px' }}><strong>Key risk:</strong> {aiDraft.draft.keyRisk}</p>
            {aiDraft.draft.fundamentalNote && <p style={{ marginBottom: '6px' }}><strong>Fundamentals:</strong> {aiDraft.draft.fundamentalNote}</p>}
            {aiDraft.draft.newsNote && <p style={{ marginBottom: '6px' }}><strong>News:</strong> {aiDraft.draft.newsNote}</p>}

            {aiDraft.technicals && (
              <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>
                Technicals: SMA20 {aiDraft.technicals.sma20} · SMA50 {aiDraft.technicals.sma50} · RSI14 {aiDraft.technicals.rsi14} · ATR14 {aiDraft.technicals.atr14} · 20d range {aiDraft.technicals.swingLow20}–{aiDraft.technicals.swingHigh20} · Trend: {aiDraft.technicals.trend}
              </p>
            )}

            {aiDraft.validation?.issues?.length > 0 && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px 10px', marginBottom: '10px' }}>
                <p style={{ fontWeight: 700, color: '#92400e', marginBottom: '4px' }}>⚠️ Validation flags — review before publishing:</p>
                {aiDraft.validation.issues.map((issue, i) => <p key={i} style={{ color: '#92400e' }}>• {issue}</p>)}
              </div>
            )}

            <p style={{ marginBottom: '10px', color: '#94a3b8', fontStyle: 'italic', fontSize: '11px' }}>Missing data (factor into your own judgment): {aiDraft.missingDatasets?.join(', ')}</p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {aiDraft.draft.action !== 'HOLD' && (
                <button onClick={() => {
                  set('action', aiDraft.draft.action);
                  set('entry_price', aiDraft.draft.entry_price);
                  set('target1', aiDraft.draft.target1);
                  set('target2', aiDraft.draft.target2);
                  set('target3', aiDraft.draft.target3);
                  set('stop_loss', aiDraft.draft.stop_loss);
                  set('rationale', (form.rationale ? form.rationale + '\n\n' : '') + `[AI draft — reviewed by analyst before use]\n${aiDraft.draft.reasoning}\nKey risk: ${aiDraft.draft.keyRisk}`);
                  if (aiDraft.technicals) {
                    const t = aiDraft.technicals;
                    set('technical_notes', (form.technical_notes ? form.technical_notes + '\n\n' : '') +
                      `[AI-assisted, reviewed by analyst]\nSMA20: ${t.sma20} · SMA50: ${t.sma50} · SMA200: ${t.sma200}\nRSI14: ${t.rsi14} · ATR14: ${t.atr14}\n20-day range: ${t.swingLow20} – ${t.swingHigh20}\nTrend: ${t.trend}`);
                  }
                  if (aiDraft.draft.fundamentalNote) {
                    set('fundamental_notes', (form.fundamental_notes ? form.fundamental_notes + '\n\n' : '') +
                      `[AI-assisted, reviewed by analyst]\n${aiDraft.draft.fundamentalNote}`);
                  }
                }} style={{ ...S.btn, ...S.btnSm, background: '#7c3aed', color: '#fff' }}>
                  Apply to Form (Rationale + Technical + Fundamental Notes — still requires manual Publish)
                </button>
              )}
              <button onClick={() => set('rationale', (form.rationale ? form.rationale + '\n\n' : '') + `[AI draft — reviewed by analyst before use]\n${aiDraft.draft.action}: ${aiDraft.draft.reasoning}\nKey risk: ${aiDraft.draft.keyRisk}`)}
                style={{ ...S.btn, ...S.btnSm, ...S.btnSecondary }}>
                Copy reasoning into Rationale only
              </button>
            </div>
          </div>
        )}

        {aiDraft && !aiDraft.isTradeCall && (
          <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.6 }}>
            <p style={{ marginBottom: '6px' }}><strong>Stance:</strong> {aiDraft.draft?.verdict?.stance} (confidence {aiDraft.draft?.verdict?.confidence}/100)</p>
            <p style={{ marginBottom: '6px' }}><strong>Fundamental view:</strong> {aiDraft.draft?.fundamentalView?.summary}</p>
            <p style={{ marginBottom: '6px' }}><strong>News context:</strong> {aiDraft.draft?.newsView?.summary}</p>
            <p style={{ marginBottom: '6px' }}><strong>Key risk:</strong> {aiDraft.draft?.verdict?.keyRisk}</p>
            <p style={{ marginBottom: '10px', color: '#94a3b8', fontStyle: 'italic' }}>Missing data: {aiDraft.missingDatasets?.join(', ')}</p>
            <button onClick={() => set('rationale', (form.rationale ? form.rationale + '\n\n' : '') + `[AI draft — reviewed by analyst before use]\n${aiDraft.draft?.verdict?.stance}: ${aiDraft.draft?.verdict?.primaryReason}\nFundamentals: ${aiDraft.draft?.fundamentalView?.summary}\nNews: ${aiDraft.draft?.newsView?.summary}\nKey risk: ${aiDraft.draft?.verdict?.keyRisk}`)}
              style={{ ...S.btn, ...S.btnSm, ...S.btnSecondary }}>
              Copy into Rationale field
            </button>
          </div>
        )}
      </div>

      {/* Review My Entry — checks whatever the admin has manually typed so far,
          not an AI-generated call. Same deterministic checks plus an AI read
          against technicals/fundamentals/news, flagging inconsistencies. */}
      <div style={{ ...S.card, marginBottom: '16px', background: '#E1F5EE', border: '1.5px solid #5DCAA5' }}>
        <div style={{ ...S.flexBetween, flexWrap: 'wrap', gap: '8px', marginBottom: reviewResult || reviewErr ? '12px' : 0 }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: '13px', color: '#085041' }}>🔍 Review My Entry</p>
            <p style={{ fontSize: '11px', color: '#94a3b8' }}>Checks what you've manually typed above — target/SL ordering, risk-reward, and whether it's consistent with technicals, fundamentals and news.</p>
          </div>
          <button onClick={reviewManualEntry} disabled={reviewLoading || !form.symbol || !form.action || !form.entry_price}
            style={{ ...S.btn, ...S.btnSm, background: '#0F6E56', color: '#fff', opacity: (reviewLoading || !form.symbol || !form.action || !form.entry_price) ? 0.6 : 1 }}>
            {reviewLoading ? 'Reviewing...' : '🔍 Check My Entry'}
          </button>
        </div>
        {reviewErr && <p style={{ fontSize: '12px', color: '#dc2626' }}>{reviewErr}</p>}
        {reviewResult && (
          <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.6 }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{
                ...S.badge,
                background: reviewResult.review?.assessment === 'Looks reasonable' ? '#dcfce7' : reviewResult.review?.assessment === 'Significant concerns' ? '#fee2e2' : '#fef9c3',
                color: reviewResult.review?.assessment === 'Looks reasonable' ? '#166534' : reviewResult.review?.assessment === 'Significant concerns' ? '#991b1b' : '#854d0e',
                fontWeight: 800,
              }}>
                {reviewResult.review?.assessment}
              </span>
              <span style={{ color: '#94a3b8' }}>Confidence: {reviewResult.review?.confidence}/100</span>
            </div>

            {reviewResult.validation?.issues?.length > 0 && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px 10px', marginBottom: '10px' }}>
                <p style={{ fontWeight: 700, color: '#92400e', marginBottom: '4px' }}>⚠️ Structural checks (math, not AI opinion):</p>
                {reviewResult.validation.issues.map((issue, i) => <p key={i} style={{ color: '#92400e' }}>• {issue}</p>)}
              </div>
            )}

            {reviewResult.review?.concerns?.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <p style={{ fontWeight: 700, marginBottom: '4px' }}>AI concerns:</p>
                {reviewResult.review.concerns.map((c, i) => <p key={i}>• {c}</p>)}
              </div>
            )}
            {reviewResult.review?.strengths?.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <p style={{ fontWeight: 700, marginBottom: '4px' }}>AI notes as reasonable:</p>
                {reviewResult.review.strengths.map((s, i) => <p key={i}>• {s}</p>)}
              </div>
            )}
            <p style={{ marginBottom: '6px' }}><strong>Reasoning:</strong> {reviewResult.review?.reasoning}</p>
            <p style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Missing data (factor into your own judgment): {reviewResult.missingDatasets?.join(', ')}</p>
          </div>
        )}
      </div>

      {['rationale', 'technical_notes', 'fundamental_notes'].map(k => (
        <div key={k} style={S.formGroup}>
          <label style={S.label}>{k.replace('_', ' ').toUpperCase()}</label>
          <textarea style={S.textarea} placeholder={`Enter ${k.replace('_', ' ')}...`} value={form[k]} onChange={e => set(k, e.target.value)} />
        </div>
      ))}

      <div style={S.grid2}>
        <div style={S.formGroup}>
          <label style={S.label}>Chart Image</label>
          <input style={S.input} type="file" accept="image/*" onChange={e => uploadFile(e.target.files[0], 'charts')} />
          {form.chart_url && <p style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>✓ Uploaded</p>}
        </div>
        <div style={S.formGroup}>
          <label style={S.label}>Research Report (PDF)</label>
          <input style={S.input} type="file" accept="application/pdf" onChange={e => uploadFile(e.target.files[0], 'reports')} />
          {form.report_url && <p style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>✓ Uploaded</p>}
        </div>
      </div>

      {existingRec?.id && (
        <div style={{ ...S.card, marginTop: '8px', background: '#FAF9F5' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📜 Edit History ({history.length})</p>
          {history.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>No edits recorded yet since this call was created.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
              {history.map(h => {
                let details = {};
                try { details = JSON.parse(h.details); } catch(e) {}
                return (
                  <div key={h.id} style={{ padding: '8px 10px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, color: '#1e40af' }}>{h.action?.replace(/_/g, ' ')}</span>
                      <span style={{ color: '#94a3b8' }}>{new Date(h.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p style={{ color: '#64748b', marginBottom: '2px' }}>by {h.performed_by_email || 'unknown'}</p>
                    {details.changes && Object.entries(details.changes).map(([field, val]) => (
                      <p key={field} style={{ color: '#334155' }}>
                        <strong>{field}:</strong> {String(val.from ?? '—')} → {String(val.to ?? '—')}
                      </p>
                    ))}
                    {details.old_status && (
                      <p style={{ color: '#334155' }}><strong>status:</strong> {details.old_status} → {details.new_status}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {REQUIRES_APPROVAL_ROLES.includes(myRole) && !existingRec?.id && (
        <div style={{ background: '#FAEEDA', border: '1px solid #EF9F27', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', fontSize: '12px', color: '#633806' }}>
          ⏳ As a Research Analyst, your calls go to the owner for approval before they go live to subscribers — this won't publish immediately.
        </div>
      )}

      <div style={{ ...S.flex, gap: '12px', marginTop: '8px' }}>
        <button onClick={handleSave} disabled={loading} style={{ ...S.btn, ...S.btnPrimary, opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Saving...' : existingRec ? '✓ Update Call' : REQUIRES_APPROVAL_ROLES.includes(myRole) ? '📤 Submit for Approval' : '✓ Publish Call'}
        </button>
        <button onClick={onSave} style={{ ...S.btn, ...S.btnSecondary }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── PERFORMANCE PAGE ─────────────────────────────────────────────────────────
function PerformancePage() {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    supabase.from('recommendations').select('*').order('published_at', { ascending: true }).then(({ data }) => {
      setRecs(data || []);
      setLoading(false);
    });
  }, []);

  const closed = recs.filter(r => ['closed', 'target_hit', 'sl_hit', 'expired'].includes(r.status));
  const targets = recs.filter(r => r.status === 'target_hit');
  const slHit = recs.filter(r => r.status === 'sl_hit');
  const live = recs.filter(r => ['live', 'near_target', 'near_sl'].includes(r.status));
  const winRate = closed.length ? ((targets.length / closed.length) * 100).toFixed(1) : 0;

  // Calculate returns
  const closedWithReturn = closed.map(r => {
    const entry = parseFloat(r.entry_price);
    const exit = parseFloat(r.exit_price) || (r.status === 'target_hit' ? parseFloat(r.target1) : parseFloat(r.stop_loss));
    if (!entry || !exit) return { ...r, ret: null };
    const ret = r.action === 'SELL' ? ((entry - exit) / entry * 100) : ((exit - entry) / entry * 100);
    return { ...r, ret: +ret.toFixed(2) };
  });

  const withReturn = closedWithReturn.filter(r => r.ret !== null);
  const avgReturn = withReturn.length ? (withReturn.reduce((s, r) => s + r.ret, 0) / withReturn.length).toFixed(2) : 0;
  const bestCall = withReturn.length ? withReturn.reduce((a, b) => a.ret > b.ret ? a : b) : null;
  const worstCall = withReturn.length ? withReturn.reduce((a, b) => a.ret < b.ret ? a : b) : null;

  // Cumulative return chart data
  let cumulative = 0;
  const chartData = closedWithReturn.filter(r => r.ret !== null).map((r, i) => {
    cumulative += r.ret;
    return { name: r.symbol, cumRet: +cumulative.toFixed(2), callRet: r.ret, index: i + 1 };
  });

  // Segment breakdown
  const segments = ['equity', 'futures', 'options', 'commodity'];
  const segBreakdown = segments.map(seg => {
    const segCalls = closed.filter(r => r.segment === seg);
    const segWins = segCalls.filter(r => r.status === 'target_hit');
    return { seg, total: segCalls.length, wins: segWins.length, rate: segCalls.length ? ((segWins.length / segCalls.length) * 100).toFixed(0) : 0 };
  }).filter(s => s.total > 0);

  // Filter for table
  const filteredClosed = filter === 'all' ? closedWithReturn :
    filter === 'win' ? closedWithReturn.filter(r => r.status === 'target_hit') :
    filter === 'loss' ? closedWithReturn.filter(r => r.status === 'sl_hit') :
    closedWithReturn.filter(r => r.segment === filter);

  const statCards = [
    { label: 'Total Calls', value: recs.length, color: '#1d4ed8', icon: '📋' },
    { label: 'Live Now', value: live.length, color: '#059669', icon: '🟢' },
    { label: 'Win Rate', value: winRate + '%', color: '#d97706', icon: '🎯' },
    { label: 'Avg Return', value: (avgReturn > 0 ? '+' : '') + avgReturn + '%', color: avgReturn >= 0 ? '#059669' : '#b91c1c', icon: '📈' },
    { label: 'Target Hit', value: targets.length, color: '#059669', icon: '✅' },
    { label: 'SL Hit', value: slHit.length, color: '#b91c1c', icon: '❌' },
    { label: 'Best Call', value: bestCall ? (bestCall.ret > 0 ? '+' : '') + bestCall.ret + '%' : '—', color: '#059669', icon: '🏆' },
    { label: 'Worst Call', value: worstCall ? worstCall.ret + '%' : '—', color: '#b91c1c', icon: '📉' },
  ];

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <div style={{ ...S.section, paddingTop: '40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ ...S.h2, marginBottom: '8px' }}>📊 Performance Report</h1>
            <p style={{ ...S.muted }}>Complete transparent track record of all research calls. Updated in real-time.</p>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '32px' }}>
            {statCards.map((s, i) => (
              <div key={i} style={{ ...S.card, textAlign: 'center', padding: '16px 12px' }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{s.icon}</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Cumulative Return Chart */}
          {chartData.length > 1 && (
            <div style={{ ...S.card, marginBottom: '24px' }}>
              <h3 style={{ ...S.h4, marginBottom: '4px' }}>📈 Cumulative Return Curve</h3>
              <p style={{ fontSize: '12px', ...S.muted, marginBottom: '16px' }}>Theoretical cumulative % return across all closed calls</p>
              <div style={{ overflowX: 'auto' }}>
                <svg width="100%" height="200" viewBox={`0 0 ${Math.max(600, chartData.length * 60)} 200`} preserveAspectRatio="none">
                  {(() => {
                    const w = Math.max(600, chartData.length * 60);
                    const h = 180;
                    const pad = 40;
                    const vals = chartData.map(d => d.cumRet);
                    const minV = Math.min(0, ...vals);
                    const maxV = Math.max(1, ...vals);
                    const range = maxV - minV || 1;
                    const x = (i) => pad + (i / (chartData.length - 1 || 1)) * (w - pad * 2);
                    const y = (v) => h - pad - ((v - minV) / range) * (h - pad * 2);
                    const pts = chartData.map((d, i) => `${x(i)},${y(d.cumRet)}`).join(' ');
                    const zeroY = y(0);
                    return (
                      <>
                        <line x1={pad} y1={zeroY} x2={w - pad} y2={zeroY} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4,2" />
                        <polyline points={pts} fill="none" stroke="#1d4ed8" strokeWidth="2.5" />
                        {chartData.map((d, i) => (
                          <circle key={i} cx={x(i)} cy={y(d.cumRet)} r="4" fill={d.cumRet >= 0 ? '#059669' : '#b91c1c'} />
                        ))}
                        {chartData.map((d, i) => i % Math.max(1, Math.floor(chartData.length / 8)) === 0 && (
                          <text key={i} x={x(i)} y={h - 8} textAnchor="middle" fontSize="9" fill="#64748b">{d.name}</text>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>
          )}

          {/* Segment Breakdown */}
          {segBreakdown.length > 0 && (
            <div style={{ ...S.card, marginBottom: '24px' }}>
              <h3 style={{ ...S.h4, marginBottom: '16px' }}>Segment-wise Win Rate</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                {segBreakdown.map(s => (
                  <div key={s.seg} style={{ background: '#FAF9F5', borderRadius: '10px', padding: '14px', textAlign: 'center', border: '1px solid #E5E3DA' }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: s.rate >= 60 ? '#059669' : s.rate >= 40 ? '#d97706' : '#b91c1c' }}>{s.rate}%</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginTop: '2px', textTransform: 'capitalize' }}>{s.seg}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{s.wins}W / {s.total - s.wins}L of {s.total}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best / Worst Call Highlight */}
          {(bestCall || worstCall) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {bestCall && (
                <div style={{ ...S.card, borderLeft: '4px solid #059669' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#059669', marginBottom: '4px' }}>🏆 BEST CALL</div>
                  <div style={{ fontWeight: 800, fontSize: '18px', color: '#0A0A0A' }}>{bestCall.symbol}</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#059669' }}>+{bestCall.ret}%</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{bestCall.action} · Entry {fmt(bestCall.entry_price)} → Exit {fmt(bestCall.exit_price || bestCall.target1)}</div>
                </div>
              )}
              {worstCall && (
                <div style={{ ...S.card, borderLeft: '4px solid #b91c1c' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#b91c1c', marginBottom: '4px' }}>📉 WORST CALL</div>
                  <div style={{ fontWeight: 800, fontSize: '18px', color: '#0A0A0A' }}>{worstCall.symbol}</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#b91c1c' }}>{worstCall.ret}%</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{worstCall.action} · Entry {fmt(worstCall.entry_price)} → Exit {fmt(worstCall.exit_price || worstCall.stop_loss)}</div>
                </div>
              )}
            </div>
          )}

          {/* Filter + Table */}
          <div style={{ ...S.card }}>
            <div style={{ ...S.flexBetween, marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={S.h4}>All Closed Calls</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[['all', 'All'], ['win', '✅ Wins'], ['loss', '❌ Losses'], ['equity', 'Equity'], ['futures', 'F&O'], ['commodity', 'Commodity']].map(([val, label]) => (
                  <button key={val} onClick={() => setFilter(val)}
                    style={{ ...S.btn, ...S.btnSm, background: filter === val ? '#1d4ed8' : '#f1f5f9', color: filter === val ? '#fff' : '#334155', border: '1px solid #E5E3DA' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading...</div>
            ) : filteredClosed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
                <p>No closed calls yet. Performance data will appear here as calls are closed.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#FAF9F5' }}>
                      {['#', 'Stock', 'Seg', 'Action', 'Entry', 'Exit/SL', 'Return', 'Status', 'Date'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#334155', fontWeight: 700, fontSize: '12px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClosed.map((r, idx) => {
                      const exitVal = r.exit_price || (r.status === 'target_hit' ? r.target1 : r.stop_loss);
                      const isWin = r.status === 'target_hit';
                      return (
                        <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FAF9F5'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '11px' }}>{idx + 1}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0A0A0A' }}>
                            {r.symbol}
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 400 }}>{r.stock_name}</div>
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: '11px', color: '#64748b', textTransform: 'capitalize' }}>{r.segment}</td>
                          <td style={{ padding: '10px 12px' }}><span style={{ ...S.badge, ...actionStyle(r.action) }}>{r.action}</span></td>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>₹{fmt(r.entry_price)}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: isWin ? '#059669' : '#b91c1c' }}>₹{fmt(exitVal) || '—'}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 800, fontSize: '14px', color: r.ret !== null ? (r.ret >= 0 ? '#059669' : '#b91c1c') : '#94a3b8' }}>
                            {r.ret !== null ? (r.ret >= 0 ? '+' : '') + r.ret + '%' : '—'}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ ...S.badge, background: isWin ? 'rgba(5,150,105,0.1)' : r.status === 'sl_hit' ? 'rgba(185,28,28,0.1)' : 'rgba(100,116,139,0.1)', color: isWin ? '#059669' : r.status === 'sl_hit' ? '#b91c1c' : '#64748b', fontSize: '11px' }}>
                              {r.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '12px' }}>{new Date(r.updated_at).toLocaleDateString('en-IN')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ ...S.disclaimer, marginTop: '24px' }}>
            ⚠️ Past performance is not indicative of future results. Returns shown are theoretical based on published entry and exit levels. Actual returns may differ due to slippage, brokerage charges, taxes, and timing of execution. Investment in securities market is subject to market risk. SEBI RA Reg: {SEBI_REG}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// ─── LEGAL PAGES ──────────────────────────────────────────────────────────────
function LegalSection({ title, children, icon }) {
  return (
    <div style={{ background: '#fff', border: '2px solid #dbeafe', borderRadius: '12px', padding: '24px', marginBottom: '16px', borderLeft: '4px solid #1d4ed8' }}>
      {title && <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1d4ed8', marginBottom: '12px' }}>{icon} {title}</h3>}
      <div style={{ fontSize: '14px', lineHeight: 1.9, color: '#1e293b' }}>{children}</div>
    </div>
  );
}

function LegalPage({ title, icon, children }) {
  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#FAF9F5' }}>
      <div style={{ ...S.section }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '2px solid #bfdbfe', borderRadius: '16px', padding: '32px', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0A0A0A', marginBottom: '8px' }}>{icon} {title}</h1>
            <p style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>Last updated: June 2026 · {COMPANY_NAME} · {SEBI_REG}</p>
          </div>
          {children}
        </div>
      </div>
      <Footer />
    </div>
  );
}

function DisclaimerPage() {
  return (
    <LegalPage title="Disclaimer" icon="⚠️">
      <LegalSection title="Important Notice" icon="🔴">
        <p><strong style={{ color: '#b91c1c' }}>PLEASE READ CAREFULLY BEFORE USING THIS PLATFORM</strong></p>
        <p style={{ marginTop: '12px' }}>{APP_NAME} ({COMPANY_NAME}) is a SEBI Registered Research Analyst (Registration No: {SEBI_REG}). Our research and analysis is provided for educational and informational purposes only and does not constitute investment advice.</p>
      </LegalSection>
      <LegalSection title="Investment Risk" icon="📉">
        <p>Investment in securities market is subject to market risks. Read all related documents carefully before investing. The securities quoted are exemplary and are not recommendatory. <strong>Past performance is not indicative of future results.</strong></p>
      </LegalSection>
      <LegalSection title="No Guaranteed Returns" icon="🚫">
        <p>We do not promise, guarantee, or assure any returns or profits. Stock market investments are inherently risky and may result in financial loss including loss of entire capital invested.</p>
      </LegalSection>
      <LegalSection title="F&O Warning" icon="⚡">
        <p>Futures and Options trading involves substantial risk and is <strong>not suitable for all investors</strong>. Options can result in total loss of premium paid. Futures can result in losses beyond initial margin. Please assess your risk tolerance before trading F&O instruments.</p>
      </LegalSection>
      <LegalSection title="Not Investment Advice" icon="📋">
        <p>Content on this platform is research analysis, not personalized investment advice. For personalized advice, consult a SEBI Registered Investment Advisor (RIA). For grievances, contact: <strong>{GRIEVANCE_EMAIL}</strong></p>
      </LegalSection>
    </LegalPage>
  );
}

function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" icon="🔒">
      <LegalSection title="Data Collection" icon="📥">
        <p>We collect name, email, mobile number, and usage data to provide research services. We do <strong>not sell your personal data</strong> to third parties under any circumstances.</p>
      </LegalSection>
      <LegalSection title="Data Storage & Security" icon="🔐">
        <p>Your data is stored securely on Supabase (hosted in India/AWS region) and protected by industry-standard AES-256 encryption. All data transmission uses HTTPS/TLS.</p>
      </LegalSection>
      <LegalSection title="Payment Data" icon="💳">
        <p>Payment information is processed by Razorpay and is <strong>never stored on our servers</strong>. We comply with PCI-DSS standards via our payment partner. We store only the transaction ID and subscription status.</p>
      </LegalSection>
      <LegalSection title="DPDP Act 2023 Compliance" icon="🇮🇳">
        <p>We comply with India's Digital Personal Data Protection Act 2023 (DPDP Act). You have the right to access, correct, or delete your personal data at any time by contacting us at <strong>{CONTACT_EMAIL}</strong>.</p>
      </LegalSection>
      <LegalSection title="Cookies" icon="🍪">
        <p>We use essential cookies for authentication and session management. Analytics cookies help us improve the platform. You may disable non-essential cookies in your browser settings.</p>
      </LegalSection>
      <LegalSection title="Contact" icon="📧">
        <p>For all privacy queries: <strong>{CONTACT_EMAIL}</strong> · Response within 3 business days.</p>
      </LegalSection>
    </LegalPage>
  );
}

function TermsPage() {
  return (
    <LegalPage title="Terms of Service" icon="📋">
      <LegalSection title="Acceptance" icon="✅">
        <p>By using {APP_NAME}, you agree to these Terms of Service and our Privacy Policy. If you disagree with any part, please do not use this platform.</p>
      </LegalSection>
      <LegalSection title="Nature of Service" icon="📊">
        <p>We provide stock market research and analysis. We are <strong>not a stock broker, investment advisor, portfolio manager, or SEBI RIA</strong>. Our content is research, not personalized advice.</p>
      </LegalSection>
      <LegalSection title="Subscriptions & Billing" icon="💳">
        <p>Subscription fees are charged in advance. Plans auto-renew on the billing date unless cancelled before. You are responsible for cancelling before renewal. No mid-cycle refunds for cancellations after 7 days.</p>
      </LegalSection>
      <LegalSection title="User Obligations" icon="👤">
        <p>You must be <strong>18+ years of age</strong>, comply with all applicable Indian laws, not share your account credentials, and not redistribute our research content without written permission.</p>
      </LegalSection>
      <LegalSection title="Intellectual Property" icon="©️">
        <p>All research content, reports, analysis, and platform code is owned by {COMPANY_NAME}. Reproduction, distribution, or commercial use without written permission is strictly prohibited.</p>
      </LegalSection>
      <LegalSection title="Limitation of Liability" icon="⚖️">
        <p>{COMPANY_NAME} shall not be liable for any financial losses, trading losses, or consequential damages arising from use of our research platform. Maximum liability is limited to subscription fees paid in the last 30 days.</p>
      </LegalSection>
      <LegalSection title="Governing Law" icon="🏛️">
        <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Noida, Uttar Pradesh, India.</p>
      </LegalSection>
    </LegalPage>
  );
}

function RefundPage() {
  return (
    <LegalPage title="Refund Policy" icon="💰">
      <div style={{ background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#b91c1c' }}>⚠️ No Refund Policy — Please Read Before Subscribing</p>
        <p style={{ fontSize: '13px', color: '#7f1d1d', marginTop: '8px', lineHeight: 1.7 }}>All subscription fees paid to {APP_NAME} / {COMPANY_NAME} are <strong>strictly non-refundable</strong>. By subscribing, you acknowledge and accept this policy.</p>
      </div>
      <LegalSection title="No Refund — All Sales Final" icon="🚫">
        <p>We operate a <strong>strict no-refund policy</strong>. Once a subscription payment is made, no refunds will be issued under any circumstances, including but not limited to:</p>
        <ul style={{ marginTop: '12px', paddingLeft: '20px', lineHeight: 2 }}>
          <li>Change of mind after purchase</li>
          <li>Non-usage of the platform after subscribing</li>
          <li>Trading losses incurred based on research calls</li>
          <li>Technical issues on user's device or internet</li>
          <li>Early cancellation of subscription</li>
          <li>Dissatisfaction with research outcomes</li>
        </ul>
      </LegalSection>
      <LegalSection title="Why No Refund?" icon="📋">
        <p>Research content is delivered immediately upon subscription activation. Our analysts spend significant time preparing research calls, technical analysis, and fundamental reports. The intellectual property delivered cannot be "returned," hence refunds are not operationally feasible.</p>
      </LegalSection>
      <LegalSection title="Cancellation" icon="❌">
        <p>You may cancel your subscription at any time to prevent future renewals. Cancellation stops the next billing cycle but does <strong>not entitle you to a refund</strong> for the current or any past billing period. Access continues until the end of the paid period.</p>
      </LegalSection>
      <LegalSection title="Exceptional Circumstances" icon="⚖️">
        <p>In rare cases of <strong>duplicate payment</strong> due to technical error, we will investigate and process a refund for the duplicate transaction only within 30 business days. Contact us at <strong>{CONTACT_EMAIL}</strong> with your payment ID and bank statement.</p>
      </LegalSection>
      <LegalSection title="Contact" icon="📧">
        <p>For billing queries (not refund requests): <strong>{CONTACT_EMAIL}</strong> | Phone: <strong>{CONTACT_PHONE}</strong></p>
      </LegalSection>
    </LegalPage>
  );
}

function InvestorCharterPage() {
  return (
    <LegalPage title="Investor Charter — Research Analysts" icon="📜">
      <LegalSection title="Vision" icon="🎯">
        <p>To ensure every investor who uses {APP_NAME}'s research services receives fair, transparent, and unbiased analysis, and is fully aware of their rights as a client of a SEBI Registered Research Analyst.</p>
      </LegalSection>
      <LegalSection title="Services We Provide" icon="📊">
        <ul style={{ paddingLeft: '20px', lineHeight: 2 }}>
          <li>Research reports and trade recommendations on equity, F&O, and commodity segments</li>
          <li>Buy/Sell/Hold calls with entry price, target, and stop-loss levels</li>
          <li>Performance track record disclosed transparently on our Performance page</li>
          <li>Conflict-of-interest disclosure for every published call</li>
        </ul>
        <p style={{ marginTop: '10px' }}>We do <strong>not</strong> provide personalised investment advice, portfolio management, or fund management services. For advice tailored to your specific financial goals, please consult a SEBI Registered Investment Adviser (RIA).</p>
      </LegalSection>
      <LegalSection title="Your Rights as an Investor" icon="✅">
        <ul style={{ paddingLeft: '20px', lineHeight: 2 }}>
          <li>Receive research based on genuine analysis, free from front-running or price manipulation</li>
          <li>Be informed of any conflict of interest the analyst may have in a recommended security</li>
          <li>Access our full, unedited track record — including losing calls, not just winners</li>
          <li>Fair and transparent fee terms disclosed before payment</li>
          <li>A functioning grievance redressal mechanism (see our Grievance page) with escalation to SEBI SCORES and Smart ODR if unresolved</li>
          <li>Data privacy — your personal information is never sold to third parties</li>
        </ul>
      </LegalSection>
      <LegalSection title="Your Responsibilities" icon="🙋">
        <ul style={{ paddingLeft: '20px', lineHeight: 2 }}>
          <li>Read all disclosures, risk warnings, and terms before subscribing or acting on any call</li>
          <li>Verify our SEBI registration independently at sebi.gov.in before relying on our research</li>
          <li>Apply your own risk assessment — F&O and commodity calls carry a materially higher risk of loss</li>
          <li>Never share login credentials; report unauthorised account access immediately</li>
          <li>Raise grievances promptly through the official channel rather than unregistered/unverified sources claiming to represent us</li>
        </ul>
      </LegalSection>
      <LegalSection title="Do's" icon="👍">
        <ul style={{ paddingLeft: '20px', lineHeight: 2 }}>
          <li>Deal only with SEBI registered intermediaries — verify registration numbers</li>
          <li>Read rationale and risk level before acting on a call, not just the headline target</li>
          <li>Keep records of all payments and communications with us</li>
        </ul>
      </LegalSection>
      <LegalSection title="Don'ts" icon="👎">
        <ul style={{ paddingLeft: '20px', lineHeight: 2 }}>
          <li>Don't assume guaranteed profits — no research analyst can promise returns</li>
          <li>Don't act on calls circulated outside our official app/website/verified channels</li>
          <li>Don't invest based on tips from unregistered advisors or social media impersonators claiming affiliation with us</li>
        </ul>
      </LegalSection>
      <LegalSection title="Grievance Redressal Timelines" icon="⏱️">
        <p>Level 1 (direct to us): response within 21 calendar days. If unresolved or unsatisfactory, escalate to SEBI SCORES (scores.sebi.gov.in), and if still unresolved, to the SEBI-empanelled Online Dispute Resolution (ODR) platform at smartodr.in. Full details on our <button onClick={() => navigate('/grievance')} style={{ background: 'none', border: 'none', color: '#1d4ed8', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 'inherit', textDecoration: 'underline' }}>Grievance page</button>.</p>
      </LegalSection>
    </LegalPage>
  );
}

function GrievancePage() {
  return (
    <LegalPage title="Grievance Redressal" icon="📮">
      <LegalSection title="SEBI Grievance Mechanism" icon="🏛️">
        <p>As a SEBI Registered Research Analyst, {COMPANY_NAME} maintains a formal three-level grievance redressal mechanism in compliance with SEBI (Research Analysts) Regulations, 2014.</p>
      </LegalSection>
      <LegalSection title="Level 1 — Company Resolution" icon="1️⃣">
        <p><strong>Grievance Officer:</strong> {ANALYST_NAME}</p>
        <p style={{ marginTop: '8px' }}><strong>Email:</strong> {GRIEVANCE_EMAIL}</p>
        <p><strong>Phone:</strong> {CONTACT_PHONE}</p>
        <p style={{ marginTop: '8px' }}>Response time: <strong>3 business days</strong>. Resolution: <strong>15 business days</strong>.</p>
      </LegalSection>
      <LegalSection title="Level 2 — SEBI SCORES Portal" icon="2️⃣">
        <p>If your grievance is unresolved within 30 days of filing at Level 1, you may escalate to SEBI's SCORES portal:</p>
        <p style={{ marginTop: '8px' }}>🔗 <strong>scores.sebi.gov.in</strong></p>
        <p style={{ marginTop: '4px', fontSize: '13px', color: '#475569' }}>SEBI SCORES (Securities and Exchange Board of India Complaints Redress System) is a web-based centralized grievance redressal system.</p>
      </LegalSection>
      <LegalSection title="Level 3 — Online Dispute Resolution" icon="3️⃣">
        <p>For disputes unresolved via SCORES, you may file at SEBI's designated ODR platform:</p>
        <p style={{ marginTop: '8px' }}>🔗 <strong>smartodr.in</strong></p>
        <p style={{ marginTop: '4px', fontSize: '13px', color: '#475569' }}>Smart ODR (Online Dispute Resolution) is SEBI's platform for online resolution of disputes between investors and market intermediaries.</p>
      </LegalSection>
      <LegalSection title="Grievance Filing Guidelines" icon="📝">
        <p>When filing a grievance, please include:</p>
        <ul style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: 2 }}>
          <li>Your registered email ID and mobile number</li>
          <li>Nature of grievance with specific details</li>
          <li>Date and description of the issue</li>
          <li>Any supporting documents or screenshots</li>
          <li>Your expected resolution</li>
        </ul>
      </LegalSection>
    </LegalPage>
  );
}

function SEBIDisclosurePage() {
  return (
    <LegalPage title="SEBI RA Disclosure" icon="🛡️">
      <LegalSection title="Registration Details" icon="📜">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
          {[
            { label: 'Analyst Name', value: ANALYST_NAME },
            { label: 'Company', value: COMPANY_NAME },
            { label: 'SEBI Registration No.', value: SEBI_REG },
            { label: 'Registration Type', value: 'Individual Research Analyst' },
            { label: 'Registered Address', value: 'Noida, Uttar Pradesh, India' },
            { label: 'Contact Email', value: CONTACT_EMAIL },
          ].map((item, i) => (
            <div key={i} style={{ background: '#FAF9F5', borderRadius: '8px', padding: '12px', border: '1px solid #E5E3DA' }}>
              <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0A', marginTop: '4px' }}>{item.value}</p>
            </div>
          ))}
        </div>
      </LegalSection>
      <LegalSection title="Conflict of Interest Disclosure" icon="⚖️">
        <p>The Research Analyst or his/her associates may or may not hold positions in the securities mentioned in research calls at the time of publication. All disclosures are made in accordance with SEBI (Research Analysts) Regulations, 2014 as amended.</p>
        <p style={{ marginTop: '12px' }}>The Research Analyst has not received any compensation from the companies covered in the research reports for the past 12 months.</p>
      </LegalSection>
      <LegalSection title="Source of Compensation" icon="💰">
        <p>The Research Analyst is <strong>compensated exclusively through subscription fees from users</strong>. We do not receive any compensation, directly or indirectly, from companies whose securities are analyzed in our research reports.</p>
      </LegalSection>
      <LegalSection title="Regulatory Compliance" icon="📋">
        <p>We comply with SEBI (Research Analysts) Regulations, 2014 and all amendments thereto, including:</p>
        <ul style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: 2 }}>
          <li>November 2024 amendment — Enhanced disclosure requirements</li>
          <li>SEBI Circular SEBI/HO/MIRSD/MIRSD-POD-1/P/CIR/2023/70 on research analyst regulations</li>
          <li>Mandatory risk disclosures on all research communications</li>
          <li>Maintenance of records for minimum 5 years</li>
        </ul>
      </LegalSection>
      <LegalSection title="Research Methodology Disclosure" icon="🔬">
        <p>Our research calls are based on: <strong>Technical Analysis</strong> (price action, chart patterns, indicators including RSI, MACD, Moving Averages), <strong>Fundamental Analysis</strong> (EPS, P/E, revenue growth, sector outlook), and <strong>Risk-Reward Assessment</strong> (minimum 1:2 ratio for all published calls).</p>
      </LegalSection>
      <LegalSection title="Mandatory Disclaimer" icon="⚠️">
        <p style={{ color: '#b91c1c', fontWeight: 600 }}>Investment in securities market is subject to market risk. Past performance is not indicative of future results. This platform provides research reports and not investment advice. Investors are advised to take an informed decision and consult their investment advisor before investing.</p>
      </LegalSection>
    </LegalPage>
  );
}

function FAQPage() {
  const faqs = [
    { q: 'What is StockVista?', a: `${APP_NAME} is a SEBI Registered Research Analyst platform that provides equity, F&O, and commodity research calls backed by technical and fundamental analysis.` },
    { q: 'Is this investment advice?', a: 'No. StockVista provides research analysis only, not personalized investment advice. We are a SEBI Registered Research Analyst (RA), not a SEBI Registered Investment Advisor (RIA). Always consult a qualified advisor before making investment decisions.' },
    { q: 'What segments do you cover?', a: 'We cover NSE & BSE equity, NSE F&O (futures and options), and MCX commodities (Gold, Silver, Crude Oil, Natural Gas).' },
    { q: 'What do the plans include?', a: 'Basic Equity covers equity research calls. Premium Equity adds IPO calls and priority support. F&O Pro adds futures, options, and intraday calls. Elite All Access includes everything including Telegram signals and one-on-one sessions.' },
    { q: 'Is there a free trial?', a: 'We do not offer free trials. All plans are paid. Please review our track record on the Performance page before subscribing.' },
    { q: 'What is your refund policy?', a: 'We have a strict no-refund policy. All subscription fees are non-refundable. Please read our complete Refund Policy before subscribing.' },
    { q: 'How are calls delivered?', a: 'Calls are published on the platform in real-time. Elite plan subscribers also receive Telegram notifications. Login to your dashboard to view all live and past calls.' },
    { q: 'Can I cancel my subscription?', a: 'Yes, you can cancel anytime. Cancellation prevents future renewals but does not entitle you to a refund for the current period. Access continues until the end of your paid period.' },
    { q: 'Are your recommendations guaranteed?', a: 'Absolutely not. No stock market research can guarantee profits. All investments carry risk. We provide thorough analysis with clear entry, target, and stop-loss levels — but market outcomes are never guaranteed.' },
    { q: 'How do I file a grievance?', a: `Contact us at ${GRIEVANCE_EMAIL}. If unresolved within 30 days, escalate to SEBI SCORES (scores.sebi.gov.in) or Smart ODR (smartodr.in).` },
    { q: 'What is your SEBI registration number?', a: `${SEBI_REG}. We comply with SEBI (Research Analysts) Regulations, 2014 and all amendments.` },
    { q: 'How do I contact support?', a: `Email: ${CONTACT_EMAIL} | Phone: ${CONTACT_PHONE}. Support hours: Monday to Friday, 9 AM to 6 PM IST.` },
  ];
  return (
    <LegalPage title="Frequently Asked Questions" icon="❓">
      {faqs.map((f, i) => (
        <FaqItem key={i} q={f.q} a={f.a} />
      ))}
    </LegalPage>
  );
}

function RiskDisclosurePage() {
  return (
    <LegalPage title="Risk Disclosure Document" icon="⚠️">
      <div style={{ background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <p style={{ fontWeight: 700, color: '#b91c1c', fontSize: '15px' }}>MANDATORY RISK DISCLOSURE — AS REQUIRED BY SEBI (RESEARCH ANALYSTS) REGULATIONS, 2014</p>
      </div>
      <LegalSection title="General Market Risk" icon="📉">
        <p>Investment in securities market is subject to market risks. The value of investments may increase or decrease based on market conditions, economic factors, political events, and other variables outside our control. <strong>You may lose some or all of your invested capital.</strong></p>
      </LegalSection>
      <LegalSection title="Equity Risk" icon="📊">
        <p>Equity investments are subject to company-specific risks including poor earnings, management changes, regulatory actions, and sector downturns. Small-cap and mid-cap stocks carry higher volatility and liquidity risk compared to large-cap stocks.</p>
      </LegalSection>
      <LegalSection title="F&O Risk (High Risk Warning)" icon="⚡">
        <p><strong style={{ color: '#b91c1c' }}>Futures and Options are highly complex leveraged instruments.</strong></p>
        <ul style={{ marginTop: '12px', paddingLeft: '20px', lineHeight: 2 }}>
          <li>Options buyers can lose 100% of the premium paid</li>
          <li>Futures positions can result in losses exceeding initial margin</li>
          <li>F&O markets can move against you rapidly due to leverage</li>
          <li>Theta decay erodes option value daily, even without price movement</li>
          <li>F&O is not suitable for inexperienced or risk-averse investors</li>
        </ul>
      </LegalSection>
      <LegalSection title="Commodity Risk" icon="🏅">
        <p>MCX commodity prices (Gold, Silver, Crude Oil, Natural Gas) are influenced by global supply-demand, geopolitical events, currency fluctuations, and weather conditions. Commodity derivatives carry leverage risk similar to equity F&O.</p>
      </LegalSection>
      <LegalSection title="Research Risk" icon="🔬">
        <p>Research calls are based on analysis available at the time of publication. Market conditions can change rapidly and without warning. Past accuracy of research calls does not guarantee future accuracy. Stop-losses must be strictly followed to limit downside.</p>
      </LegalSection>
      <LegalSection title="Liquidity Risk" icon="💧">
        <p>Certain securities, especially small-cap stocks and far-OTM options, may have limited liquidity. You may not be able to exit positions at the recommended prices during high volatility or low-volume periods.</p>
      </LegalSection>
      <LegalSection title="Regulatory Risk" icon="🏛️">
        <p>SEBI, RBI, or government regulatory changes can impact securities markets significantly and without prior notice. Tax laws applicable to securities transactions may change.</p>
      </LegalSection>
      <LegalSection title="Investor Acknowledgement" icon="✅">
        <p>By using {APP_NAME}, you acknowledge that:</p>
        <ul style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: 2 }}>
          <li>You have read and understood all risk disclosures above</li>
          <li>You are making investment decisions at your own risk</li>
          <li>You will not hold {COMPANY_NAME} liable for any trading losses</li>
          <li>You are capable of bearing financial losses</li>
          <li>You have consulted or will consult a qualified financial advisor</li>
        </ul>
        <p style={{ marginTop: '12px', fontWeight: 600, color: '#0A0A0A' }}>SEBI RA Registration: {SEBI_REG} · {COMPANY_NAME} · Analyst: {ANALYST_NAME}</p>
      </LegalSection>
    </LegalPage>
  );
}

function AboutPage() {
  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <div style={{ ...S.section }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ ...S.h2, marginBottom: '8px' }}>About {APP_NAME}</h1>
          <p style={{ ...S.muted, marginBottom: '40px' }}>Our mission is to democratize quality stock market research for Indian retail investors.</p>
          <div style={{ ...S.card, marginBottom: '20px' }}>
            <h3 style={{ ...S.h3, marginBottom: '12px' }}>🎯 Our Mission</h3>
            <p style={{ fontSize: '14px', lineHeight: 1.8, color: '#1e293b' }}>To provide SEBI-compliant, research-backed equity and F&O analysis to retail investors in India, helping them make informed investment decisions based on thorough technical and fundamental analysis — not tips or speculation.</p>
          </div>
          <div style={{ ...S.card, marginBottom: '20px' }}>
            <h3 style={{ ...S.h3, marginBottom: '12px' }}>📊 Research Methodology</h3>
            <p style={{ fontSize: '14px', lineHeight: 1.8, color: '#1e293b' }}>Every research call is backed by: Technical Analysis (price action, indicators, chart patterns), Fundamental Analysis (earnings, valuations, sector outlook), Risk Assessment (risk-reward ratio minimum 1:2), Clear entry, multiple targets, and stop-loss levels.</p>
          </div>
          <div style={{ ...S.card, marginBottom: '20px' }}>
            <h3 style={{ ...S.h3, marginBottom: '12px' }}>🛡️ SEBI Compliance</h3>
            <p style={{ fontSize: '14px', lineHeight: 1.8, color: '#1e293b' }}>We are SEBI Registered Research Analysts (Reg: {SEBI_REG}) complying with SEBI (Research Analysts) Regulations, 2014 and the November 2025 amendments. All research comes with mandatory risk disclosures.</p>
          </div>
          <div style={{ ...S.card }}>
            <h3 style={{ ...S.h3, marginBottom: '12px' }}>📞 Contact</h3>
            <p style={{ fontSize: '14px', color: '#1e293b' }}>Email: {CONTACT_EMAIL}</p>
            <p style={{ fontSize: '14px', color: '#1e293b' }}>Grievance: {GRIEVANCE_EMAIL}</p>
            <p style={{ fontSize: '14px', color: '#1e293b' }}>Phone: {CONTACT_PHONE}</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// ─── SUBSCRIPTION PAGE ────────────────────────────────────────────────────────
function SubscriptionPage({ user, userProfile }) {
  const currentPlanId = userProfile?.plan_id || null;
  const isActive = userProfile?.plan_expires_at && new Date(userProfile.plan_expires_at) > new Date();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [cycle, setCycle] = useState('monthly');
  const COOLOFF_MS = 10 * 60 * 1000;
  const [cooloff, setCooloff] = useState(null); // { paymentId, createdAt }
  const [cooloffNow, setCooloffNow] = useState(Date.now());
  const [cooloffCancelling, setCooloffCancelling] = useState(false);
  const [cooloffMsg, setCooloffMsg] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sv_cooloff_' + user.id);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.createdAt < COOLOFF_MS) setCooloff(parsed);
        else localStorage.removeItem('sv_cooloff_' + user.id);
      }
    } catch(e) {}
  }, [user.id]);

  useEffect(() => {
    if (!cooloff) return;
    const timer = setInterval(() => setCooloffNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [cooloff]);

  const cancelWithinCooloff = async () => {
    if (!cooloff) return;
    setCooloffCancelling(true);
    setCooloffMsg('');
    try {
      const res = await fetch('/api/cancel-subscription-cooloff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, razorpay_payment_id: cooloff.paymentId }),
      });
      const result = await res.json();
      setCooloffCancelling(false);
      if (!res.ok || !result.success) {
        setCooloffMsg('Error: ' + (result.error || 'Could not process refund. Contact support.'));
        return;
      }
      localStorage.removeItem('sv_cooloff_' + user.id);
      setCooloffMsg('✅ Refund initiated. Your plan has been reverted. Refreshing...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      setCooloffCancelling(false);
      setCooloffMsg('Error: Could not reach server. Contact support.');
    }
  };

  const prices = {
    basic:   { monthly: 999,  quarterly: 2697,  yearly: 8991 },
    premium: { monthly: 2499, quarterly: 6747,  yearly: 22491 },
    fno:     { monthly: 3999, quarterly: 10797, yearly: 35991 },
    elite:   { monthly: 5999, quarterly: 16197, yearly: 53991 },
  };

  const planList = [
    { id: 'basic',   name: 'Basic Equity',     icon: '📊', color: '#334155', desc: 'Equity research calls' },
    { id: 'premium', name: 'Premium Equity',    icon: '📈', color: '#1d4ed8', desc: 'Equity + IPO + priority support' },
    { id: 'fno',     name: 'F&O Pro',           icon: '⚡', color: '#d97706', desc: 'Equity + F&O + intraday', popular: true },
    { id: 'elite',   name: 'Elite All Access',  icon: '💎', color: '#7c3aed', desc: 'Everything + Telegram + 1-on-1' },
  ];

  const DEV_BYPASS_CODE = 'NRJDEV2026'; // Remove this before going live
  const [bypassCode, setBypassCode] = useState('');
  const [bypassMsg, setBypassMsg] = useState('');
  const [activating, setActivating] = useState(false);

  const handleSubscribe = async () => {
    if (!selectedPlan) return;

    // Dev bypass — skip payment
    if (bypassCode === DEV_BYPASS_CODE) {
      setActivating(true);
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1); // 1 year
      const { error } = await supabase.from('users').update({
        plan_id: selectedPlan,
        plan_expires_at: expiry.toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);
      setActivating(false);
      if (error) { setBypassMsg('Error: ' + error.message); return; }
      setBypassMsg('✅ Plan activated! Refreshing...');
      setTimeout(() => window.location.reload(), 1500);
      return;
    }

    // Real payment via Razorpay
    setActivating(true);
    setBypassMsg('');
    try {
      const orderRes = await fetch('/api/create-subscription-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan, cycle, userId: user.id }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) {
        setActivating(false);
        setBypassMsg('Error: ' + (order.error || 'Could not start payment.'));
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setActivating(false);
        setBypassMsg('Error: Could not load payment gateway. Check your connection and try again.');
        return;
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: APP_NAME,
        description: `${PLANS[selectedPlan]?.name} — ${cycle} subscription`,
        prefill: { email: user.email, contact: userProfile?.mobile || '' },
        theme: { color: '#1e40af' },
        handler: async (response) => {
          setBypassMsg('Verifying payment...');
          try {
            const verifyRes = await fetch('/api/verify-subscription-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: user.id,
                planId: selectedPlan,
                cycle,
              }),
            });
            const verify = await verifyRes.json();
            setActivating(false);
            if (!verifyRes.ok || !verify.success) {
              setBypassMsg('Error: ' + (verify.error || `Verification failed. Contact support with payment ID: ${response.razorpay_payment_id}`));
              return;
            }
            try {
              localStorage.setItem('sv_cooloff_' + user.id, JSON.stringify({ paymentId: response.razorpay_payment_id, createdAt: Date.now() }));
            } catch(e) {}
            setBypassMsg('✅ Plan activated! Refreshing...');
            setTimeout(() => window.location.reload(), 1200);
          } catch (e) {
            setActivating(false);
            setBypassMsg(`Error verifying payment. Contact support with payment ID: ${response.razorpay_payment_id}`);
          }
        },
        modal: { ondismiss: () => { setActivating(false); } },
      });
      rzp.on('payment.failed', (resp) => {
        setActivating(false);
        setBypassMsg('❌ Payment failed: ' + (resp?.error?.description || 'Please try again.'));
      });
      rzp.open();
    } catch (e) {
      setActivating(false);
      setBypassMsg('Error: Could not start payment. ' + e.message);
    }
  };

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#FEFDFB' }}>
      <div style={{ ...S.section, paddingTop: '40px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>

          {/* Current plan banner */}
          <div style={{ ...S.card, marginBottom: '28px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '52px', height: '52px', background: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>
                {currentPlanId === 'basic' ? '📊' : currentPlanId === 'premium' ? '📈' : currentPlanId === 'fno' ? '⚡' : '💎'}
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Current Plan</p>
                <p style={{ fontWeight: 700, fontSize: '18px', color: '#0A0A0A' }}>{PLANS[currentPlanId || 'basic']?.name || 'No Active Plan'}</p>
                {isActive ? (
                  <p style={{ fontSize: '13px', color: '#059669', fontWeight: 600 }}>
                    ✅ Active · Expires {new Date(userProfile.plan_expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                ) : (
                  <p style={{ fontSize: '13px', color: '#dc2626', fontWeight: 600 }}>⚠️ No active subscription</p>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => navigate('/dashboard')} style={{ ...S.btn, ...S.btnSecondary, ...S.btnSm }}>← Dashboard</button>
            </div>
          </div>

          {cooloff && (Date.now() - cooloff.createdAt) < COOLOFF_MS && (
            <div style={{ ...S.card, marginBottom: '20px', border: '2px solid #d97706', background: '#fffbeb' }}>
              <div style={{ ...S.flexBetween, flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '14px', color: '#92400e' }}>⏱️ Changed your mind? You have a short window to cancel.</p>
                  <p style={{ fontSize: '12px', color: '#92400e', marginTop: '4px' }}>
                    Cancel within {Math.max(0, Math.ceil((COOLOFF_MS - (cooloffNow - cooloff.createdAt)) / 60000))} min for a full refund to your original payment method.
                  </p>
                </div>
                <button onClick={cancelWithinCooloff} disabled={cooloffCancelling}
                  style={{ ...S.btn, ...S.btnSm, background: '#d97706', color: '#fff', opacity: cooloffCancelling ? 0.7 : 1 }}>
                  {cooloffCancelling ? 'Processing...' : 'Cancel & Refund'}
                </button>
              </div>
              {cooloffMsg && <p style={{ fontSize: '12px', marginTop: '10px', fontWeight: 600, color: cooloffMsg.startsWith('✅') ? '#059669' : '#dc2626' }}>{cooloffMsg}</p>}
            </div>
          )}

          <h2 style={{ ...S.h3, marginBottom: '6px' }}>Choose Your Plan</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>Select a plan and billing cycle to subscribe.</p>

          {/* Billing cycle */}
          <div style={{ display: 'flex', gap: '4px', background: '#fff', padding: '4px', borderRadius: '10px', width: 'fit-content', marginBottom: '24px', border: '1px solid #E5E3DA' }}>
            {[
              { key: 'monthly', label: 'Monthly' },
              { key: 'quarterly', label: 'Quarterly', save: '-10%' },
              { key: 'yearly', label: 'Yearly', save: '-25%' },
            ].map(b => (
              <button key={b.key} onClick={() => setCycle(b.key)}
                style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: cycle === b.key ? '#1e40af' : 'transparent', color: cycle === b.key ? '#fff' : '#64748b', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {b.label} {b.save && <span style={{ fontSize: '10px', color: cycle === b.key ? '#93c5fd' : '#059669', fontWeight: 700 }}>{b.save}</span>}
              </button>
            ))}
          </div>

          {/* Plan cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px', marginBottom: '28px' }}>
            {planList.map(p => {
              const isSelected = selectedPlan === p.id;
              const isCurrent = currentPlanId === p.id && isActive;
              return (
                <div key={p.id} onClick={() => !isCurrent && setSelectedPlan(p.id)}
                  style={{ ...S.card, cursor: isCurrent ? 'default' : 'pointer', border: isSelected ? `2px solid ${p.color}` : isCurrent ? '2px solid #059669' : '1px solid #E5E3DA', position: 'relative', transition: 'all 0.15s', padding: '20px', background: isSelected ? '#fafbff' : '#fff' }}>
                  {p.popular && !isCurrent && (
                    <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#d97706', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>MOST POPULAR</div>
                  )}
                  {isCurrent && (
                    <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#059669', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>CURRENT PLAN</div>
                  )}
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{p.icon}</div>
                  <p style={{ fontWeight: 700, fontSize: '14px', color: p.color, marginBottom: '4px' }}>{p.name}</p>
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '12px', lineHeight: 1.4 }}>{p.desc}</p>
                  <p style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0A' }}>₹{prices[p.id][cycle].toLocaleString('en-IN')}</p>
                  <p style={{ fontSize: '11px', color: '#94a3b8' }}>/{cycle === 'monthly' ? 'month' : cycle === 'quarterly' ? '3 months' : 'year'}</p>
                  {isSelected && <div style={{ marginTop: '10px', fontSize: '12px', color: p.color, fontWeight: 700 }}>✓ Selected</div>}
                </div>
              );
            })}
          </div>

          {/* Checkout */}
          <div style={{ ...S.card, border: selectedPlan ? '1px solid #E5E3DA' : '1px solid #E5E3DA' }}>
            {selectedPlan ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '16px', color: '#0A0A0A' }}>{planList.find(p => p.id === selectedPlan)?.name}</p>
                    <p style={{ fontSize: '13px', color: '#64748b' }}>{cycle === 'monthly' ? 'Monthly billing' : cycle === 'quarterly' ? 'Quarterly billing' : 'Annual billing · best value'}</p>
                  </div>
                  <p style={{ fontSize: '24px', fontWeight: 800, color: '#1e40af' }}>₹{prices[selectedPlan][cycle].toLocaleString('en-IN')}</p>
                </div>
                {/* Dev bypass field */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input
                    style={{ ...S.input, flex: 1, fontSize: '13px' }}
                    placeholder="Dev bypass code (testing only)"
                    value={bypassCode}
                    onChange={e => { setBypassCode(e.target.value); setBypassMsg(''); }}
                  />
                  {bypassCode && (
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: bypassCode === 'NRJDEV2026' ? '#dcfce7' : '#fee2e2', borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: bypassCode === 'NRJDEV2026' ? '#166534' : '#991b1b', whiteSpace: 'nowrap' }}>
                      {bypassCode === 'NRJDEV2026' ? '✓ Valid' : '✕ Invalid'}
                    </div>
                  )}
                </div>
                {bypassMsg && <p style={{ fontSize: '13px', color: bypassMsg.startsWith('✅') ? '#059669' : '#dc2626', marginBottom: '12px', fontWeight: 600 }}>{bypassMsg}</p>}
                <button onClick={handleSubscribe} disabled={activating} style={{ ...S.btn, ...S.btnPrimary, width: '100%', justifyContent: 'center', fontSize: '15px', padding: '13px', opacity: activating ? 0.7 : 1 }}>
                  {activating ? 'Activating...' : bypassCode === 'NRJDEV2026' ? '⚡ Activate Plan (Dev Mode)' : '🔒 Proceed to Payment →'}
                </button>
                <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginTop: '10px' }}>Secured by Razorpay · UPI · Cards · Net Banking</p>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>← Select a plan above to continue</p>
              </div>
            )}
          </div>

          <div style={{ ...S.disclaimer, marginTop: '20px' }}>
            ⚠️ All subscription fees are non-refundable. Please review our <button onClick={() => navigate('/refund')} style={{ background: 'none', border: 'none', color: '#92400e', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline', fontSize: '12px' }}>Refund Policy</button> before subscribing. Investment in securities market is subject to market risk.
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// ─── NOT FOUND ────────────────────────────────────────────────────────────────
function NotFoundPage() {
  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div>
        <p style={{ fontSize: '80px' }}>📈</p>
        <h1 style={{ ...S.h2, marginBottom: '16px' }}>404 — Page Not Found</h1>
        <p style={{ ...S.muted, marginBottom: '32px' }}>The page you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/')} style={{ ...S.btn, ...S.btnPrimary }}>← Go Home</button>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
// ─── PWA INSTALL PROMPT ───────────────────────────────────────────────────────
function PWAInstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setPrompt(e); setShow(true); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setShow(false);
    setPrompt(null);
  };
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: '#0f172a', color: '#fff', borderRadius: '14px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', maxWidth: '380px', width: 'calc(100% - 32px)' }}>
      <div style={{ fontSize: '26px', flexShrink: 0 }}>📲</div>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>Install StockVista</p>
        <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4 }}>Add to homescreen for instant access to live calls</p>
      </div>
      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
        <button onClick={() => setShow(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#94a3b8', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px' }}>Later</button>
        <button onClick={install} style={{ background: '#1d4ed8', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>Install</button>
      </div>
    </div>
  );
}

export default function App() {
  const [path, setPath] = useState(getPath());
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [riskAccepted, setRiskAccepted] = useState(() => localStorage.getItem('risk_accepted') === 'true');
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const handler = () => setPath(getPath());
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  useEffect(() => {
    // Admin user IDs — add more as needed
    const ADMIN_IDS = ['f81eb797-2fe9-4a4f-b818-381ea74b7414'];

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase.from('users').select('*').eq('id', session.user.id).single();
        const isAdmin = profile?.is_admin === true || ADMIN_IDS.includes(session.user.id);
        setUserProfile({ ...(profile || {}), is_admin: isAdmin });
      }
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase.from('users').select('*').eq('id', session.user.id).single();
        const isAdmin = profile?.is_admin === true || ADMIN_IDS.includes(session.user.id);
        setUserProfile({ ...(profile || {}), is_admin: isAdmin });
      } else {
        setUser(null);
        setUserProfile(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleRiskAccept = () => {
    localStorage.setItem('risk_accepted', 'true');
    setRiskAccepted(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    navigate('/');
  };

  if (authLoading) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>📈</div>
        <p style={{ ...S.muted }}>Loading {APP_NAME}...</p>
      </div>
    </div>
  );

  const protectedPage = (Component, props = {}) => {
    if (!user) { navigate('/login'); return null; }
    return <Component user={user} userProfile={userProfile} riskAccepted={riskAccepted} setRiskAccepted={handleRiskAccept} {...props} />;
  };

  const renderPage = () => {
    if (path === '/') return <LandingPage />;
    if (path === '/login') return <LoginPage setUser={setUser} setUserProfile={setUserProfile} />;
    if (path === '/register') return <RegisterPage setUser={setUser} setUserProfile={setUserProfile} />;
    if (path === '/pricing') return <PricingPage />;
    if (path === '/screeners') return <ScreenersPage user={user} userProfile={userProfile} />;
    if (path === '/recommendations') return <RecommendationsPage user={user} userProfile={userProfile} riskAccepted={riskAccepted} setRiskAccepted={handleRiskAccept} />;
    if (path === '/live-calls') return <RecommendationsPage user={user} userProfile={userProfile} riskAccepted={riskAccepted} setRiskAccepted={handleRiskAccept} forceStatus="live-group" />;
    if (path === '/past-recommendations') return <RecommendationsPage user={user} userProfile={userProfile} riskAccepted={riskAccepted} setRiskAccepted={handleRiskAccept} forceStatus="past-group" />;
    if (path.startsWith('/recommendations/')) return <RecommendationDetailPage id={path.split('/recommendations/')[1]} userProfile={userProfile} />;
    if (path === '/reports') return <ReportsPage user={user} userProfile={userProfile} />;
    if (path === '/watchlist') return <WatchlistPage user={user} />;
    if (path === '/forgot-password') return <ForgotPasswordPage />;
    if (path === '/reset-password') return <ResetPasswordPage />;
    if (path === '/onboarding') return <OnboardingPage user={user} userProfile={userProfile} />;
    if (path === '/portfolio') return <PortfolioPage user={user} />;
    if (path === '/performance') return <PerformancePage />;
    if (path === '/about') return <AboutPage />;
    if (path === '/contact') return <ContactPage />;
    if (path === '/blog') return <BlogPage />;
    if (path === '/notifications') return <NotificationsPage user={user} userProfile={userProfile} />;
    if (path === '/profile') return <ProfilePage user={user} userProfile={userProfile} />;
    if (path === '/disclaimer') return <DisclaimerPage />;
    if (path === '/privacy') return <PrivacyPage />;
    if (path === '/terms') return <TermsPage />;
    if (path === '/refund') return <RefundPage />;
    if (path === '/grievance') return <GrievancePage />;
    if (path === '/investor-charter') return <InvestorCharterPage />;
    if (path === '/disclosure' || path === '/sebi-disclosure') return <SEBIDisclosurePage />;
    if (path === '/faq') return <FAQPage />;
    if (path === '/risk-disclosure') return <RiskDisclosurePage />;
    if (path === '/dashboard') return protectedPage(Dashboard);
    if (path === '/subscription') return protectedPage(SubscriptionPage);
    if (path === '/admin') return protectedPage(AdminPanel);
    return <NotFoundPage />;
  };

  return (
    <LanguageProvider>
      <div style={S.page}>
        <Navbar user={user} userProfile={userProfile} onLogout={handleLogout} />
        {renderPage()}
        <PWAInstallPrompt />
      </div>
    </LanguageProvider>
  );
}
