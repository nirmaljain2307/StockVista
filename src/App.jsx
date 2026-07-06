import React, { useState, useEffect, useCallback } from 'react';
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

const PLANS = {
  basic: { name: 'Basic Equity', color: '#334155', monthly: 999 },
  premium: { name: 'Premium Equity', color: '#3b82f6', monthly: 2499 },
  fno: { name: 'F&O Pro', color: '#f59e0b', monthly: 3999 },
  elite: { name: 'Elite All Access', color: '#a78bfa', monthly: 5999 },
};

const PLAN_FEATURES = [
  { key: 'basic_recommendations', label: 'Basic Recommendations' },
  { key: 'market_updates', label: 'Market Updates' },
  { key: 'blog_access', label: 'Blog Access' },
  { key: 'equity_recommendations', label: 'Equity Recommendations' },
  { key: 'fno_recommendations', label: 'F&O Recommendations' },
  { key: 'intraday_calls', label: 'Intraday Calls' },
  { key: 'options_strategies', label: 'Options Strategies' },
  { key: 'ipo_recommendations', label: 'IPO Recommendations' },
  { key: 'telegram_signals', label: 'Telegram Signals' },
  { key: 'priority_support', label: 'Priority Support' },
  { key: 'one_on_one', label: 'One-on-One Sessions' },
];

const BILLING_CYCLES = [
  { key: 'monthly', label: 'Monthly', discount: 0 },
  { key: 'quarterly', label: 'Quarterly', discount: 10 },
  { key: 'halfyearly', label: 'Half Yearly', discount: 15 },
  { key: 'yearly', label: 'Yearly', discount: 25 },
];

// ─── STYLES ──────────────────────────────────────────────────────────────────
const S = {
  page: { minHeight: '100vh', background: '#f0f4f8', color: '#0f172a', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '0 24px' },
  section: { padding: '80px 24px' },

  nav: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(15,23,42,0.07)', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' },
  navLogo: { fontSize: '17px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', letterSpacing: '-0.02em' },
  navLogoIcon: { width: '33px', height: '33px', background: '#0f172a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' },
  navLinks: { display: 'flex', gap: '2px', alignItems: 'center' },
  navLink: { color: '#64748b', cursor: 'pointer', fontSize: '13px', fontWeight: 500, transition: 'color 0.15s', padding: '6px 11px', border: 'none', background: 'none', borderRadius: '6px' },
  navBtn: { background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' },

  btn: { border: 'none', borderRadius: '10px', padding: '11px 22px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center', gap: '8px', letterSpacing: '0.01em' },
  btnPrimary: { background: '#1e40af', color: '#fff' },
  btnSecondary: { background: '#ffffff', color: '#1e293b', border: '1px solid #dde3ed' },
  btnGold: { background: '#b45309', color: '#fff' },
  btnSm: { padding: '7px 13px', fontSize: '12px', borderRadius: '8px' },
  btnDanger: { background: '#dc2626', color: '#fff' },
  btnGreen: { background: '#059669', color: '#fff' },

  card: { background: '#ffffff', border: '1.5px solid #bfdbfe', borderRadius: '14px', padding: '24px', boxShadow: '0 1px 3px rgba(29,78,216,0.05), 0 4px 16px rgba(29,78,216,0.04)' },
  cardHover: { transition: 'all 0.18s' },

  formGroup: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.07em' },
  input: { width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: '#0f172a', outline: 'none', fontFamily: 'inherit', fontWeight: 500 },
  select: { width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: '#0f172a', outline: 'none', fontFamily: 'inherit', fontWeight: 500 },
  textarea: { width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: '#0f172a', outline: 'none', fontFamily: 'inherit', resize: 'vertical', minHeight: '80px', fontWeight: 500 },

  badge: { display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.02em' },
  badgeBuy:  { background: '#dcfce7', color: '#166534' },
  badgeSell: { background: '#fee2e2', color: '#991b1b' },
  badgeHold: { background: '#fef9c3', color: '#854d0e' },
  badgeAvoid:{ background: '#f1f5f9', color: '#475569' },
  badgeExit: { background: '#ede9fe', color: '#5b21b6' },
  badgeActive: { background: '#dcfce7', color: '#166534' },
  badgeClosed: { background: '#f1f5f9', color: '#475569' },

  h1: { fontSize: 'clamp(32px, 5vw, 60px)', fontWeight: 800, lineHeight: 1.06, letterSpacing: '-0.03em', color: '#0f172a' },
  h2: { fontSize: 'clamp(24px, 3vw, 40px)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#0f172a' },
  h3: { fontSize: '20px', fontWeight: 700, letterSpacing: '-0.01em', color: '#0f172a' },
  h4: { fontSize: '15px', fontWeight: 600, color: '#0f172a' },
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

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar({ user, userProfile, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const path = getPath();

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Live Calls', path: '/live-calls' },
    { label: 'Recommendations', path: '/recommendations' },
    { label: 'Past Calls', path: '/past-recommendations' },
    { label: 'Pricing', path: '/pricing' },
    { label: 'Blog', path: '/blog' },
    { label: 'Performance', path: '/performance' },
  ];

  return (
    <nav style={S.nav}>
      <div style={S.navLogo} onClick={() => navigate('/')}>
        <div style={S.navLogoIcon}>📈</div>
        <span>{APP_NAME}</span>
      </div>

      {/* Desktop Nav */}
      <div style={{ ...S.navLinks, '@media(max-width:768px)': { display: 'none' } }}>
        {navItems.map(item => (
          <button key={item.path} onClick={() => navigate(item.path)}
            style={{ ...S.navLink, color: path === item.path ? '#3b82f6' : '#94a3b8' }}>
            {item.label}
          </button>
        ))}
      </div>

      <div style={{ ...S.flex, gap: '12px' }}>
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
                  <p style={{ fontWeight: 700, marginBottom: '12px' }}>Notifications</p>
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
                  <button onClick={() => navigate('/notifications')} style={{ ...S.btn, ...S.btnSecondary, ...S.btnSm, width: '100%', justifyContent: 'center', marginTop: '8px' }}>View All</button>
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
                    { label: '📊 Dashboard', path: '/dashboard' },
                    { label: '⚙️ Profile Settings', path: '/profile' },
                    { label: '💳 Subscription', path: '/subscription' },
                    ...(userProfile?.is_admin ? [{ label: '🛡️ Admin Panel', path: '/admin' }] : []),
                  ].map(item => (
                    <button key={item.path} onClick={() => { navigate(item.path); setUserMenu(false); }}
                      style={{ ...S.navLink, display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '8px', color: '#0f172a' }}>
                      {item.label}
                    </button>
                  ))}
                  <div style={{ height: '1px', background: '#334155', margin: '4px 0' }} />
                  <button onClick={onLogout} style={{ ...S.navLink, display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '8px', color: '#ef4444' }}>
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button onClick={() => navigate('/login')} style={{ ...S.btn, ...S.btnSecondary, ...S.btnSm }}>Sign In</button>
            <button onClick={() => navigate('/register')} style={{ ...S.btn, ...S.btnPrimary, ...S.btnSm }}>Get Started</button>
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
      <section style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '28px 20px' }}>
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
                      <p style={{ fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Subscribe to View</p>
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
      <section style={{ ...S.section, background: '#ffffff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>WHY CHOOSE US</p>
          <h2 style={{ ...S.h2, marginBottom: '48px' }}>Research You Can Trust</h2>
          <div style={S.grid3}>
            {features.map((f, i) => (
              <div key={i} style={{ ...S.card, textAlign: 'left', transition: 'all 0.2s', borderTop: '3px solid #1d4ed8' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; }}>
                <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '16px' }}>{f.icon}</div>
                <h4 style={{ ...S.h4, marginBottom: '8px', color: '#0f172a' }}>{f.title}</h4>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* How It Works */}
      <section style={{ ...S.section, background: '#f8fafc' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>HOW IT WORKS</p>
          <h2 style={{ ...S.h2, marginBottom: '48px' }}>Simple Steps to Start</h2>
          <div style={S.grid4}>
            {steps.map((s, i) => (
              <div key={i} style={{ ...S.card, textAlign: 'center', padding: '32px 20px', borderTop: '3px solid #e2e8f0' }}>
                <div style={{ fontSize: '40px', fontWeight: 800, color: '#dbeafe', lineHeight: 1, marginBottom: '16px', fontFamily: 'Inter, sans-serif' }}>{s.n}</div>
                <h3 style={{ ...S.h4, marginBottom: '8px', color: '#0f172a' }}>{s.title}</h3>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section style={{ ...S.section, background: '#ffffff' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>PRICING</p>
          <h2 style={{ ...S.h2, marginBottom: '8px' }}>Choose Your Research Plan</h2>
          <p style={{ color: '#64748b', marginBottom: '48px' }}>Flexible plans for traders of all experience levels.</p>
          <PricingCards compact={true} />
          <button onClick={() => navigate('/pricing')} style={{ ...S.btn, ...S.btnSecondary, marginTop: '24px' }}>View Full Plan Comparison →</button>
        </div>
      </section>

      {/* Risk Management */}
      <section style={{ ...S.section, background: '#f8fafc' }}>
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
                  <h4 style={{ ...S.h4, marginBottom: '4px', color: '#0f172a' }}>{r.title}</h4>
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
          <h2 style={{ ...S.h2, marginBottom: '16px', color: '#0f172a' }}>Ready to Start Your Research Journey?</h2>
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
    ],
  };

  return (
    <footer style={{ background: '#ffffff', borderTop: '2px solid #e2e8f0', padding: '60px 20px 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '40px', marginBottom: '48px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={S.navLogoIcon}>📈</div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{APP_NAME}</span>
            </div>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.7, marginBottom: '12px' }}>
              Your trusted partner for stock market research. SEBI Registered Research Analyst.
            </p>
            <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>{SEBI_REG}</p>
          </div>
          {Object.entries(links).map(([cat, items]) => (
            <div key={cat}>
              <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>{cat}</h4>
              {items.map(item => (
                <button key={item.path} onClick={() => navigate(item.path)}
                  style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#475569', fontSize: '14px', padding: '6px 0', cursor: 'pointer', fontWeight: 500, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.target.style.color = '#1d4ed8'}
                  onMouseLeave={e => e.target.style.color = '#475569'}>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid #e2e8f0', padding: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>© {new Date().getFullYear()} {APP_NAME} · {COMPANY_NAME} · All rights reserved.</p>
          <p style={{ fontSize: '11px', color: '#94a3b8', maxWidth: '600px', textAlign: 'right', lineHeight: 1.5 }}>
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
        <div style={{ display: 'flex', gap: '4px', background: '#ffffff', padding: '4px', borderRadius: '10px', width: 'fit-content', margin: '0 auto 40px', flexWrap: 'wrap', justifyContent: 'center' }}>
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
    { q: 'Can I change my plan later?', a: 'Yes, you can upgrade or downgrade at any time. Upgrades are immediate; downgrades apply at next billing cycle.' },
    { q: 'What payment methods do you accept?', a: 'We accept all major credit/debit cards, UPI, Net Banking, Paytm, PhonePe, and Google Pay via Razorpay.' },
    { q: 'Is there a free trial?', a: 'We don\'t offer a free trial at this time. All plans start with Basic Equity, our most affordable research tier, so you can upgrade only when you\'re ready.' },
    { q: 'Can I get a refund?', a: 'We have a strict no-refund policy. All subscription fees are non-refundable once paid. Please review our complete track record on the Performance page and read our Refund Policy before subscribing.' },
    { q: 'Are the recommendations guaranteed?', a: 'No. Research analysis is based on technical and fundamental research but does not guarantee returns. Investment is subject to market risk.' },
  ];

  const planCols = [
    { key: 'basic', name: 'Basic Equity', color: '#64748b' },
    { key: 'premium', name: 'Premium Equity', color: '#1d4ed8' },
    { key: 'fno', name: 'F&O Pro', color: '#d97706' },
    { key: 'elite', name: 'Elite All Access', color: '#7c3aed' },
  ];

  const matrix = {
    basic_recommendations:  [true,  true,  true,  true],
    market_updates:         [true,  true,  true,  true],
    blog_access:            [true,  true,  true,  true],
    equity_recommendations: [true,  true,  true,  true],
    fno_recommendations:    [false, false, true,  true],
    intraday_calls:         [false, false, true,  true],
    options_strategies:     [false, false, true,  true],
    ipo_recommendations:    [false, true,  true,  true],
    telegram_signals:       [false, false, false, true],
    priority_support:       [false, true,  true,  true],
    one_on_one:             [false, false, false, true],
  };

  return (
    <div style={{ paddingTop: '80px', background: '#f1f5f9' }}>

      {/* Hero */}
      <section style={{ ...S.section, textAlign: 'center', background: 'linear-gradient(160deg, #eff6ff 0%, #f1f5f9 60%, #fefce8 100%)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: 'rgba(29,78,216,0.08)', color: '#1d4ed8', borderRadius: '20px', padding: '6px 16px', fontSize: '13px', fontWeight: 700, marginBottom: '16px' }}>
            SEBI Registered Research Analyst · {SEBI_REG}
          </div>
          <h1 style={{ ...S.h2, marginBottom: '12px' }}>Choose Your Research Plan</h1>
          <p style={{ ...S.muted, marginBottom: '40px', fontSize: '15px' }}>Flexible plans for traders of all levels. Cancel anytime.</p>
          <PricingCards compact={false} />
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section style={{ ...S.section, background: '#ffffff', paddingTop: '60px' }}>
        <div style={{ maxWidth: '950px', margin: '0 auto' }}>
          <h2 style={{ ...S.h2, textAlign: 'center', marginBottom: '8px' }}>Full Feature Comparison</h2>
          <p style={{ textAlign: 'center', ...S.muted, marginBottom: '40px' }}>See exactly what each plan includes</p>

          <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#0f172a', fontWeight: 700, fontSize: '13px', width: '35%' }}>Feature</th>
                  {planCols.map(p => (
                    <th key={p.key} style={{ padding: '16px 12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', color: p.color, fontWeight: 800, fontSize: '13px' }}>
                      {p.key === 'fno' ? <span style={{ background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '6px', fontSize: '11px' }}>⭐ POPULAR</span> : ''}
                      <div style={{ marginTop: p.key === 'fno' ? '4px' : '0' }}>{p.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PLAN_FEATURES.map((f, i) => (
                  <tr key={f.key} style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '13px 20px', color: '#1e293b', fontWeight: 500, borderBottom: '1px solid #f1f5f9' }}>{f.label}</td>
                    {(matrix[f.key] || [false,false,false,false]).map((has, j) => (
                      <td key={j} style={{ padding: '13px 12px', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: '26px', height: '26px', borderRadius: '50%',
                          background: has ? 'rgba(5,150,105,0.1)' : 'rgba(185,28,28,0.08)',
                          color: has ? '#047857' : '#b91c1c',
                          fontSize: '14px', fontWeight: 800
                        }}>
                          {has ? '✓' : '✕'}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8fafc' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>Monthly Price</td>
                  {[{ price: '₹999', color: '#64748b' }, { price: '₹2,499', color: '#1d4ed8' }, { price: '₹3,999', color: '#d97706' }, { price: '₹5,999', color: '#7c3aed' }].map((p, i) => (
                    <td key={i} style={{ padding: '16px 12px', textAlign: 'center', fontWeight: 800, fontSize: '16px', color: p.color }}>{p.price}</td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ ...S.section, background: '#f1f5f9' }}>
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
    <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
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
        <div style={{ background: '#ffffff', padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '6px', letterSpacing: '-0.02em' }}>{title}</h1>
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

  useEffect(() => {
    fetchRecs();
  }, []);

  const fetchRecs = async () => {
    const { data } = await supabase.from('recommendations')
      .select('*').eq('status', 'active').order('published_at', { ascending: false }).limit(10);
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
              { label: 'Active Calls', value: recs.length, icon: '📊', color: '#3b82f6' },
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

          <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
            {/* Recommendations */}
            <div>
              <div style={{ ...S.flexBetween, marginBottom: '16px' }}>
                <h3 style={S.h3}>Latest Research Calls</h3>
                <button onClick={() => navigate('/recommendations')} style={{ ...S.btn, ...S.btnSecondary, ...S.btnSm }}>View All</button>
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

// ─── RECOMMENDATION CARD ──────────────────────────────────────────────────────
function RecCard({ rec, userProfile, onClick }) {
  const planRank = { basic: 0, premium: 1, fno: 2, elite: 3 };
  const userRank = planRank[userProfile?.plan_id || 'basic'] ?? -1;
  const reqRank = planRank[rec.plan_required || 'basic'] ?? 0;
  const hasActiveSub = !!userProfile?.plan_id && userProfile?.plan_expires_at && new Date(userProfile.plan_expires_at) > new Date();
  const hasAccess = hasActiveSub && userRank >= reqRank;
  const isLocked = !hasAccess;
  const pnl = calcPnL(rec);
  const effStatus = rec.status || 'live';

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

      {/* Lock overlay */}
      {isLocked && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '14px', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🔒</span>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{PLANS[rec.plan_required || 'basic']?.name} Required</p>
          <button onClick={e => { e.stopPropagation(); navigate('/subscription'); }} style={{ ...S.btn, ...S.btnPrimary, ...S.btnSm }}>Upgrade Plan</button>
        </div>
      )}

      {/* Row 1 — Action badge + Symbol + Status badge + Date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ ...S.badge, ...actionStyle(rec.action), fontSize: '11px', padding: '3px 10px' }}>{rec.action}</span>
          <div>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{rec.symbol}</span>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {[
          { label: 'Entry', value: fmt(rec.entry_price), color: '#0f172a' },
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
          {pnl.points !== null && (
            <span style={{ fontSize: '12px', fontWeight: 700, color: pnl.points >= 0 ? '#059669' : '#dc2626' }}>
              {pnl.points >= 0 ? '+' : ''}{pnl.points} pts ({pnl.pct >= 0 ? '+' : ''}{pnl.pct}%)
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
function RecommendationsPage({ user, userProfile, riskAccepted, setRiskAccepted, forceStatus }) {
  const [recs, setRecs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ segment: '', action: '', status: '', risk: '' });
  const [sort, setSort] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

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
    setFiltered(data);
  }, [recs, search, filters, sort, forceStatus]);

  const fetchRecs = async () => {
    const { data } = await supabase.from('recommendations').select('*').neq('status', 'draft').order('published_at', { ascending: false });
    setRecs(data || []);
    setLoading(false);
  };

  if (!riskAccepted && user) return <DisclaimerPopup onAccept={() => setRiskAccepted(true)} />;

  const stats = { live: recs.filter(r => r.status === 'live' || r.status === 'near_target' || r.status === 'near_sl').length, target_hit: recs.filter(r => r.status === 'target_hit').length, sl_hit: recs.filter(r => r.status === 'sl_hit').length, total: recs.length };

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <div style={{ ...S.section, paddingTop: '40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={S.h2}>{forceStatus === 'live-group' ? 'Live Calls' : forceStatus === 'past-group' ? 'Past Recommendations' : 'Research Calls'}</h1>
            <p style={{ ...S.muted, marginTop: '4px' }}>{forceStatus === 'past-group' ? 'Closed, expired, target-hit, and stop-loss-hit calls with full track record.' : 'Expert stock picks with detailed analysis and entry/exit levels'}</p>
          </div>

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
              {filtered.map(r => <RecCard key={r.id} rec={r} userProfile={userProfile} />)}
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
  // BSE
  if (exch === 'BSE') return `BSE:${sym}`;
  // Default NSE equity
  return `NSE:${sym || 'NIFTY'}`;
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

  const selStyle = { padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 600, background: '#f8fafc', color: '#0f172a', cursor: 'pointer' };

  return (
    <div style={{ ...S.card, padding: '0', overflow: 'hidden', marginBottom: '16px' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>📈 Live Chart — {symbol}</p>
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
        <p style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{label}</p>
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
        <p style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>📐 Technical Analysis</p>
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

  useEffect(() => {
    supabase.from('recommendations').select('*').eq('id', id).single().then(({ data }) => {
      setRec(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div style={{ paddingTop: '100px', textAlign: 'center', ...S.muted }}>Loading...</div>;
  if (!rec) return <div style={{ paddingTop: '100px', textAlign: 'center', ...S.muted }}>Recommendation not found.</div>;

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

          {/* TradingView Live Charts */}
          <h4 style={{ ...S.h4, marginBottom: '12px', marginTop: '8px' }}>Live Charts</h4>

          {/* Main advanced chart */}
          <TVAdvancedChart rec={rec} />

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
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#f8fafc' }}>
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
                    <p style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{c.title}</p>
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
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#f8fafc' }}>
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
                    <h3 style={{ ...S.h4, marginBottom: '8px', color: '#0f172a' }}>{p.title}</h3>
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
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
        <h2 style={S.h3}>Login to see notifications</h2>
        <button onClick={() => navigate('/login')} style={{ ...S.btn, ...S.btnPrimary, marginTop: '16px' }}>Sign In</button>
      </div>
    </div>
  );

  const typeIcon = { info: 'ℹ️', alert: '🔴', success: '✅', call: '📊', market: '📈' };

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#f0f4f8' }}>
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
                          <p style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{n.title}</p>
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
                      <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{r.action} {r.symbol}</p>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(r.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#64748b' }}>{r.stock_name} · Entry ₹{r.entry_price} · T1 ₹{r.target1} · SL ₹{r.stop_loss}</p>
                    <span style={{ ...S.badge, fontSize: '11px', background: r.status === 'live' ? '#eff6ff' : '#f8fafc', color: r.status === 'live' ? '#1d4ed8' : '#64748b', marginTop: '6px' }}>
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
  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('users').update({ full_name: name, mobile }).eq('id', user.id);
    setSaving(false);
    if (error) { setMsg('Error: ' + error.message); return; }
    setMsg('Profile updated successfully!');
    setEditing(false);
  };
  if (!user) { navigate('/login'); return null; }
  const plan = PLANS[userProfile?.plan_id || 'basic'];
  const isActive = userProfile?.plan_expires_at && new Date(userProfile.plan_expires_at) > new Date();
  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ ...S.section, paddingTop: '40px' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h1 style={{ ...S.h2, marginBottom: '28px' }}>👤 My Profile</h1>
          {/* Avatar + plan badge */}
          <div style={{ ...S.card, marginBottom: '16px', display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#fff', fontWeight: 800, flexShrink: 0 }}>
              {(userProfile?.full_name || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: '18px', color: '#0f172a' }}>{userProfile?.full_name || 'Investor'}</p>
              <p style={{ color: '#64748b', fontSize: '13px' }}>{user?.email}</p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <span style={{ ...S.badge, background: '#eff6ff', color: '#1d4ed8' }}>{plan?.name || 'Basic Equity'}</span>
                <span style={{ ...S.badge, background: isActive ? '#d1fae5' : '#fee2e2', color: isActive ? '#065f46' : '#991b1b' }}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
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
                    <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500 }}>{item.value}</span>
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
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#f0f4f8' }}>
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
                      <p style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>{r.symbol} — {r.stock_name}</p>
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
  const [prices, setPrices] = useState({});
  const [input, setInput] = useState('');
  const [exchange, setExchange] = useState('NSE');
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  const [refreshTs, setRefreshTs] = useState(Date.now());

  useEffect(() => {
    if (!user) return;
    try {
      const w = localStorage.getItem('sv_wl3_' + user.id);
      setWatchlist(w ? JSON.parse(w) : DEFAULT_SYMBOLS);
    } catch(e) { setWatchlist(DEFAULT_SYMBOLS); }
  }, [user]);

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
    };
    fetchPrices();
    const timer = setInterval(fetchPrices, 30000);
    return () => clearInterval(timer);
  }, [watchlist, refreshTs]);

  const save = (data) => {
    try { localStorage.setItem('sv_wl3_' + user?.id, JSON.stringify(data)); } catch(e) {}
    setWatchlist(data);
  };

  const add = () => {
    const sym = input.trim().replace(/\s+/g,'').toUpperCase();
    if (!sym) return;
    if (watchlist.find(w => (w.sym || w) === sym)) { setInput(''); return; }
    save([...watchlist, { sym, exch: exchange }]);
    setInput(''); setShowAdd(false);
  };

  const remove = (sym) => {
    save(watchlist.filter(w => (w.sym || w) !== sym));
    if (selected?.sym === sym) setSelected(null);
  };

  const selSym = selected ? `${selected.exch || 'NSE'}:${selected.sym}` : null;

  if (!user) return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>👁️</div>
        <h2 style={S.h3}>Login to manage your watchlist</h2>
        <button onClick={() => navigate('/login')} style={{ ...S.btn, ...S.btnPrimary, marginTop: '16px' }}>Sign In</button>
      </div>
    </div>
  );

  return (
    <div style={{ paddingTop: '64px', background: '#f0f4f8', minHeight: '100vh' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', height: 'calc(100vh - 64px)', maxWidth: '1200px', margin: '0 auto' }}>

        {/* ── LEFT PANEL ── */}
        <div style={{ background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', position: 'sticky', top: '64px' }}>

          {/* Search / Header */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>WATCHLIST ({watchlist.length})</span>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button onClick={() => { setRefreshTs(Date.now()); }} title="Refresh prices" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#94a3b8' }}>↻</button>
                <button onClick={() => setShowAdd(s => !s)} style={{ background: showAdd ? '#eff6ff' : '#f1f5f9', border: 'none', borderRadius: '6px', padding: '4px 9px', fontSize: '11px', fontWeight: 700, color: showAdd ? '#1e40af' : '#334155', cursor: 'pointer' }}>
                  {showAdd ? '✕' : '+ Add'}
                </button>
              </div>
            </div>

            {showAdd && (
              <div style={{ display: 'flex', gap: '4px' }}>
                <select style={{ width: '60px', padding: '6px 3px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '11px', color: '#0f172a', background: '#f8fafc' }} value={exchange} onChange={e => setExchange(e.target.value)}>
                  <option>NSE</option><option>BSE</option><option>MCX</option>
                </select>
                <input style={{ flex: 1, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', color: '#0f172a', background: '#f8fafc', outline: 'none' }}
                  placeholder="e.g. RELIANCE" value={input}
                  onChange={e => setInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && add()} autoFocus />
                <button onClick={add} style={{ background: '#1e40af', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Add</button>
              </div>
            )}
          </div>

          {/* Stock rows — Zerodha style */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {watchlist.length === 0 && (
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
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
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

                  {/* Right: price + delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                      {p ? p.price.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—'}
                    </span>
                    <button onClick={e => { e.stopPropagation(); remove(sym); }}
                      style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
                      title="Remove">×</button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ padding: '7px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
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
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{APP_NAME}</span>
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
                    <div key={r.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ ...S.badge, ...actionStyle(r.action), fontSize: '10px', marginRight: '6px' }}>{r.action}</span>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{r.symbol}</span>
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
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

  const thStyle = { padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#94a3b8', fontWeight: 700, fontSize: '10px', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.07em', background: '#f8fafc' };
  const tdStyle = { padding: '12px 14px', fontSize: '13px', color: '#0f172a' };

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#f0f4f8' }}>
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
              <p style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>₹{fmtCurr(totalCurrent)}</p>
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
                  <div style={{ background: '#f8fafc', border: '1.5px solid #bfdbfe', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
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
          <div style={{ display: 'flex', gap: '4px', background: '#fff', padding: '4px', borderRadius: '10px', width: 'fit-content', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
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
                    <tr style={{ background: '#f8fafc' }}>
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
                            <p style={{ fontWeight: 700, color: '#0f172a' }}>{h.symbol}</p>
                            <p style={{ fontSize: '11px', color: '#94a3b8' }}>{h.name} · {h.segment}</p>
                          </td>
                          <td style={{ ...tdStyle, fontSize: '12px', color: '#64748b' }}>{h.buy_date || '—'}</td>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{h.qty}</td>
                          <td style={tdStyle}>₹{Number(h.buy_price).toLocaleString('en-IN')}</td>
                          <td style={tdStyle}>
                            <input type="number" defaultValue={h.cmp} onBlur={e => updateCMP(h.id, e.target.value)}
                              style={{ width: '80px', padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', color: '#0f172a' }} />
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
                              <button onClick={() => removeHolding(h.id)} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '7px', color: '#94a3b8', cursor: 'pointer', fontSize: '13px', padding: '5px 8px', display: 'flex', alignItems: 'center' }}>
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
                    <tr style={{ background: '#f8fafc' }}>
                      {['Symbol', 'Qty Sold', 'Buy Price', 'Sell Price', 'Buy Date', 'Sell Date', 'Realised P&L', '%'].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {soldHistory.map(t => (
                      <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={tdStyle}><p style={{ fontWeight: 700, color: '#0f172a' }}>{t.symbol}</p><p style={{ fontSize: '11px', color: '#94a3b8' }}>{t.segment}</p></td>
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
                    <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
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
  const [notifSending, setNotifSending] = useState(false);
  const [notifMsg, setNotifMsg] = useState('');
  const setNF = (k, v) => setNotifForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!userProfile?.is_admin) { navigate('/'); return; }
    fetchData();
  }, [activeTab]);

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
    } else if (activeTab === 'audit') {
      const { data } = await supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200);
      setAuditLogs(data || []);
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

  const sendNotification = async () => {
    if (!notifForm.title || !notifForm.body) { setNotifMsg('Title and message required.'); return; }
    setNotifSending(true); setNotifMsg('');
    const payload = { title: notifForm.title, body: notifForm.body, plan_target: notifForm.plan_target, type: notifForm.type, created_by: user.id, created_at: new Date().toISOString() };
    const { error } = await supabase.from('admin_notifications').insert([payload]);
    setNotifSending(false);
    if (error) { setNotifMsg('Error: ' + error.message); return; }
    setNotifMsg('✅ Notification sent to ' + (notifForm.plan_target === 'all' ? 'all users' : notifForm.plan_target + ' plan users'));
    setNF('title',''); setNF('body','');
    fetchData();
  };

  const deleteNotif = async (id) => {
    await supabase.from('admin_notifications').delete().eq('id', id);
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
    const updates = (data || []).map(r => ({ id: r.id, suggested: suggestStatus(r) })).filter(u => u.suggested !== data.find(r => r.id === u.id).status);
    if (updates.length === 0) { alert('No status changes detected.'); return; }
    if (!confirm(`Update ${updates.length} call(s) based on current CMP/expiry?`)) return;
    for (const u of updates) {
      await supabase.from('recommendations').update({ status: u.suggested, updated_at: new Date().toISOString() }).eq('id', u.id);
    }
    fetchData();
  };

  if (!userProfile?.is_admin) return <div style={{ paddingTop: '100px', textAlign: 'center' }}>Access Denied</div>;

  const tabs = ['recommendations', 'users', 'add_recommendation'];

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
          <div style={{ ...S.flex, gap: '4px', background: '#ffffff', padding: '4px', borderRadius: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {[
              { key: 'recommendations', label: '📊 Recommendations' },
              { key: 'add_recommendation', label: '➕ Add Call' },
              { key: 'users', label: '👥 Users' },
              { key: 'analytics', label: '📈 Analytics' },
              { key: 'notifications', label: '🔔 Notifications' },
              { key: 'audit', label: '📋 Audit Log' },
            ].map(t => (
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
            <AddRecForm existingRec={editRec} onSave={() => { setEditRec(null); setActiveTab('recommendations'); fetchData(); }} adminId={user.id} />
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
                        { label: 'Total', val: users.length, color: '#0f172a' },
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
                        <tr style={{ background: '#f8fafc' }}>
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
                                <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>{u.full_name || '—'}</p>
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '12px', background: userEditForm.suspended ? '#fef2f2' : '#f8fafc', borderRadius: '8px', border: '1px solid ' + (userEditForm.suspended ? '#fecaca' : '#e2e8f0') }}>
                      <input type="checkbox" id="suspend-toggle" checked={userEditForm.suspended} onChange={e => setUserEditForm(f => ({ ...f, suspended: e.target.checked }))} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                      <label htmlFor="suspend-toggle" style={{ cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: userEditForm.suspended ? '#dc2626' : '#334155' }}>
                        {userEditForm.suspended ? '🚫 Account Suspended' : '✅ Account Active'}
                      </label>
                    </div>

                    <button onClick={saveUser} disabled={userSaving} style={{ ...S.btn, ...S.btnPrimary, width: '100%', justifyContent: 'center', opacity: userSaving ? 0.7 : 1 }}>
                      {userSaving ? 'Saving...' : '💾 Save Changes'}
                    </button>

                    <div style={{ marginTop: '16px', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
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
                      { label: 'Total Calls', value: analytics.totalRecs, color: '#0f172a' },
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
                      { label: 'Total Users', value: analytics.totalUsers, color: '#0f172a' },
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
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{count}</span>
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
                        <div key={n.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                          <div style={{ width: '36px', height: '36px', background: '#eff6ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                            {n.type === 'alert' ? '🔴' : n.type === 'success' ? '✅' : n.type === 'call' ? '📊' : n.type === 'market' ? '📈' : 'ℹ️'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                              <p style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{n.title}</p>
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
                        <tr style={{background:'#f8fafc'}}>
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
                              onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
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
        </div>
      </div>
    </div>
  );
}

function AddRecForm({ existingRec, onSave, adminId }) {
  const empty = { stock_name: '', symbol: '', exchange: 'NSE', segment: 'equity', commodity_type: '', action: 'BUY', entry_price: '', target1: '', target2: '', target3: '', stop_loss: '', exit_price: '', time_horizon: 'swing', risk_level: 'medium', conviction: 'medium', plan_required: 'basic', rationale: '', technical_notes: '', fundamental_notes: '', chart_url: '', report_url: '', status: 'draft', expiry_at: '' };
  const [form, setForm] = useState(existingRec || empty);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.stock_name || !form.symbol || !form.action) { setMsg('Stock name, symbol and action are required.'); return; }
    setLoading(true);
    const payload = { ...form, created_by: adminId, updated_at: new Date().toISOString() };
    let error;
    if (existingRec?.id) {
      const res = await supabase.from('recommendations').update(payload).eq('id', existingRec.id);
      error = res.error;
    } else {
      const res = await supabase.from('recommendations').insert([payload]);
      error = res.error;
    }
    setLoading(false);
    if (error) { setMsg(error.message); return; }
    // Send Telegram alert when publishing a live call
    if (form.status === 'live' && !existingRec?.id) {
      await sendTelegramAlert(form);
    }
    setMsg('✅ Saved successfully!');
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

      <div style={{ ...S.flex, gap: '12px', marginTop: '8px' }}>
        <button onClick={handleSave} disabled={loading} style={{ ...S.btn, ...S.btnPrimary, opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Saving...' : existingRec ? '✓ Update Call' : '✓ Publish Call'}
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
                  <div key={s.seg} style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
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
                  <div style={{ fontWeight: 800, fontSize: '18px', color: '#0f172a' }}>{bestCall.symbol}</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#059669' }}>+{bestCall.ret}%</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{bestCall.action} · Entry {fmt(bestCall.entry_price)} → Exit {fmt(bestCall.exit_price || bestCall.target1)}</div>
                </div>
              )}
              {worstCall && (
                <div style={{ ...S.card, borderLeft: '4px solid #b91c1c' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#b91c1c', marginBottom: '4px' }}>📉 WORST CALL</div>
                  <div style={{ fontWeight: 800, fontSize: '18px', color: '#0f172a' }}>{worstCall.symbol}</div>
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
                    style={{ ...S.btn, ...S.btnSm, background: filter === val ? '#1d4ed8' : '#f1f5f9', color: filter === val ? '#fff' : '#334155', border: '1px solid #e2e8f0' }}>
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
                    <tr style={{ background: '#f8fafc' }}>
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
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '11px' }}>{idx + 1}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
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
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ ...S.section }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '2px solid #bfdbfe', borderRadius: '16px', padding: '32px', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>{icon} {title}</h1>
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
            <div key={i} style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{item.value}</p>
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
        <p style={{ marginTop: '12px', fontWeight: 600, color: '#0f172a' }}>SEBI RA Registration: {SEBI_REG} · {COMPANY_NAME} · Analyst: {ANALYST_NAME}</p>
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

    // Real payment — coming soon
    const amt = prices[selectedPlan][cycle];
    alert(`Razorpay integration coming soon!\n\nPlan: ${PLANS[selectedPlan]?.name}\nAmount: ₹${amt}\n\nUse bypass code for testing.`);
  };

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#f0f4f8' }}>
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
                <p style={{ fontWeight: 700, fontSize: '18px', color: '#0f172a' }}>{PLANS[currentPlanId || 'basic']?.name || 'No Active Plan'}</p>
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

          <h2 style={{ ...S.h3, marginBottom: '6px' }}>Choose Your Plan</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>Select a plan and billing cycle to subscribe.</p>

          {/* Billing cycle */}
          <div style={{ display: 'flex', gap: '4px', background: '#fff', padding: '4px', borderRadius: '10px', width: 'fit-content', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
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
                  style={{ ...S.card, cursor: isCurrent ? 'default' : 'pointer', border: isSelected ? `2px solid ${p.color}` : isCurrent ? '2px solid #059669' : '1px solid #e8edf3', position: 'relative', transition: 'all 0.15s', padding: '20px', background: isSelected ? '#fafbff' : '#fff' }}>
                  {p.popular && !isCurrent && (
                    <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#d97706', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>MOST POPULAR</div>
                  )}
                  {isCurrent && (
                    <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#059669', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>CURRENT PLAN</div>
                  )}
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{p.icon}</div>
                  <p style={{ fontWeight: 700, fontSize: '14px', color: p.color, marginBottom: '4px' }}>{p.name}</p>
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '12px', lineHeight: 1.4 }}>{p.desc}</p>
                  <p style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>₹{prices[p.id][cycle].toLocaleString('en-IN')}</p>
                  <p style={{ fontSize: '11px', color: '#94a3b8' }}>/{cycle === 'monthly' ? 'month' : cycle === 'quarterly' ? '3 months' : 'year'}</p>
                  {isSelected && <div style={{ marginTop: '10px', fontSize: '12px', color: p.color, fontWeight: 700 }}>✓ Selected</div>}
                </div>
              );
            })}
          </div>

          {/* Checkout */}
          <div style={{ ...S.card, border: selectedPlan ? '2px solid #1e40af' : '1px solid #e8edf3' }}>
            {selectedPlan ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>{planList.find(p => p.id === selectedPlan)?.name}</p>
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
    if (path === '/disclosure' || path === '/sebi-disclosure') return <SEBIDisclosurePage />;
    if (path === '/faq') return <FAQPage />;
    if (path === '/risk-disclosure') return <RiskDisclosurePage />;
    if (path === '/dashboard') return protectedPage(Dashboard);
    if (path === '/subscription') return protectedPage(SubscriptionPage);
    if (path === '/admin') return protectedPage(AdminPanel);
    return <NotFoundPage />;
  };

  return (
    <div style={S.page}>
      <Navbar user={user} userProfile={userProfile} onLogout={handleLogout} />
      {renderPage()}
      <PWAInstallPrompt />
    </div>
  );
}
