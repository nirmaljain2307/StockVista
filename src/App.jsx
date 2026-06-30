import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// ─── SUPABASE ────────────────────────────────────────────────────────────────
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const APP_NAME = 'StockVista';
const SEBI_REG = 'SEBI RA Registration: Pending (Application Under Process)'; // CHANGE once SEBI RA reg. no. is issued
const ANALYST_NAME = 'Nishit Jain';
const COMPANY_NAME = 'NRJ Info Edge Pvt Ltd';
const GRIEVANCE_EMAIL = 'nirmaljain2307@gmail.com';
const CONTACT_EMAIL = 'nirmaljain2307@gmail.com';
const CONTACT_PHONE = '+91-7003950585';

const PLANS = {
  basic: { name: 'Basic Equity', color: '#64748b', monthly: 999 },
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
  // Layout
  page: { minHeight: '100vh', background: '#0a0f1e', color: '#e2e8f0', fontFamily: "'Inter', sans-serif" },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px' },
  section: { padding: '80px 20px' },

  // Navbar
  nav: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, background: 'rgba(10,15,30,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #1e293b', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' },
  navLogo: { fontSize: '20px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  navLogoIcon: { width: '32px', height: '32px', background: 'linear-gradient(135deg, #1d4ed8, #f59e0b)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' },
  navLinks: { display: 'flex', gap: '24px', alignItems: 'center' },
  navLink: { color: '#94a3b8', cursor: 'pointer', fontSize: '14px', fontWeight: 500, transition: 'color 0.2s', padding: '4px 0', border: 'none', background: 'none' },
  navBtn: { background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },

  // Buttons
  btn: { border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '8px' },
  btnPrimary: { background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', color: '#fff' },
  btnSecondary: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' },
  btnGold: { background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#fff' },
  btnSm: { padding: '8px 16px', fontSize: '13px' },
  btnDanger: { background: '#ef4444', color: '#fff' },
  btnGreen: { background: '#10b981', color: '#fff' },

  // Cards
  card: { background: '#111827', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px' },
  cardHover: { transition: 'border-color 0.2s, transform 0.2s' },

  // Form
  formGroup: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: '#e2e8f0', outline: 'none', fontFamily: 'Inter, sans-serif' },
  select: { width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: '#e2e8f0', outline: 'none', fontFamily: 'Inter, sans-serif' },
  textarea: { width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: '#e2e8f0', outline: 'none', fontFamily: 'Inter, sans-serif', resize: 'vertical', minHeight: '80px' },

  // Tags / Badges
  badge: { display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 },
  badgeBuy: { background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' },
  badgeSell: { background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' },
  badgeHold: { background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' },
  badgeAvoid: { background: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.3)' },
  badgeExit: { background: 'rgba(168,85,247,0.15)', color: '#a78bfa', border: '1px solid rgba(168,85,247,0.3)' },
  badgeActive: { background: 'rgba(16,185,129,0.15)', color: '#10b981' },
  badgeClosed: { background: 'rgba(100,116,139,0.15)', color: '#94a3b8' },

  // Text
  h1: { fontSize: 'clamp(32px, 5vw, 60px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' },
  h2: { fontSize: 'clamp(24px, 3vw, 40px)', fontWeight: 700, lineHeight: 1.2 },
  h3: { fontSize: '20px', fontWeight: 700 },
  h4: { fontSize: '16px', fontWeight: 600 },
  muted: { color: '#94a3b8' },
  gold: { color: '#f59e0b' },
  green: { color: '#10b981' },
  red: { color: '#ef4444' },

  // Disclaimer
  disclaimer: { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '12px 16px', fontSize: '12px', color: '#94a3b8', lineHeight: 1.6 },

  // Grid
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },

  // Misc
  flex: { display: 'flex', alignItems: 'center' },
  flexBetween: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  mt8: { marginTop: '8px' },
  mt16: { marginTop: '16px' },
  mt24: { marginTop: '24px' },
  mt32: { marginTop: '32px' },
  mb8: { marginBottom: '8px' },
  mb16: { marginBottom: '16px' },
  divider: { height: '1px', background: '#1e293b', margin: '24px 0' },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (n) => n ? Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—';
const fmtCurr = (n) => n ? '₹' + Number(n).toLocaleString('en-IN') : '₹0';
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
                <div style={{ position: 'absolute', right: 0, top: '44px', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px', width: '300px', zIndex: 100 }}>
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
                <div style={{ position: 'absolute', right: 0, top: '44px', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '8px', width: '200px', zIndex: 100 }}>
                  <p style={{ padding: '8px 12px', fontSize: '12px', ...S.muted }}>{user.email}</p>
                  <div style={{ height: '1px', background: '#334155', margin: '4px 0' }} />
                  {[
                    { label: '📊 Dashboard', path: '/dashboard' },
                    { label: '⚙️ Profile Settings', path: '/profile' },
                    { label: '💳 Subscription', path: '/subscription' },
                    ...(userProfile?.is_admin ? [{ label: '🛡️ Admin Panel', path: '/admin' }] : []),
                  ].map(item => (
                    <button key={item.path} onClick={() => { navigate(item.path); setUserMenu(false); }}
                      style={{ ...S.navLink, display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '8px', color: '#e2e8f0' }}>
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
        <div style={{ position: 'fixed', top: '64px', left: 0, right: 0, bottom: 0, background: '#0a0f1e', zIndex: 999, padding: '24px' }}>
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

  const stats = [
    { label: 'Registered Users', value: '5,000+' },
    { label: 'Research Calls Published', value: '2,500+' },
    { label: 'Average Accuracy', value: '72%+' },
    { label: 'Years Experience', value: '7+' },
  ];

  const steps = [
    { n: '01', title: 'Create Account', desc: 'Sign up and complete your risk profile in minutes.' },
    { n: '02', title: 'Choose Plan', desc: 'Select a research subscription that fits your trading style.' },
    { n: '03', title: 'Accept Risk Disclosure', desc: 'Read and acknowledge our SEBI-mandated risk disclosures.' },
    { n: '04', title: 'Access Research', desc: 'View expert calls with detailed analysis and track performance.' },
  ];

  return (
    <div>
      {/* Hero */}
      <section style={{ paddingTop: '140px', paddingBottom: '80px', textAlign: 'center', background: 'linear-gradient(180deg, #0d1a3a 0%, #0a0f1e 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(29,78,216,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(245,158,11,0.1) 0%, transparent 50%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(29,78,216,0.15)', border: '1px solid rgba(29,78,216,0.3)', borderRadius: '20px', padding: '6px 16px', marginBottom: '24px', fontSize: '13px', color: '#94a3b8' }}>
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
              Start Free Trial →
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

      {/* Stats Bar */}
      <section style={{ background: '#111827', borderTop: '1px solid #1e293b', borderBottom: '1px solid #1e293b', padding: '32px 20px' }}>
        <div style={{ ...S.grid4, maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          {stats.map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: '28px', fontWeight: 800, ...S.gold }}>{s.value}</div>
              <div style={{ fontSize: '13px', ...S.muted, marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Latest Calls Preview */}
      <section style={{ ...S.section, background: '#0a0f1e' }}>
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
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,15,30,0.85)', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔒</div>
                      <p style={{ fontWeight: 700 }}>Subscribe to View</p>
                      <button onClick={e => { e.stopPropagation(); navigate('/pricing'); }} style={{ ...S.btn, ...S.btnPrimary, ...S.btnSm, marginTop: '12px' }}>View Plans</button>
                    </div>
                  </div>
                )}
                <div style={{ ...S.flexBetween, marginBottom: '12px' }}>
                  <div style={{ ...S.flex, gap: '8px' }}>
                    <span style={{ ...S.badge, ...actionStyle(r.action) }}>{r.action}</span>
                    <span style={{ fontSize: '11px', ...S.muted, background: '#1e293b', padding: '2px 8px', borderRadius: '4px' }}>{r.segment}</span>
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
      <section style={{ ...S.section, background: '#080d1a' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#3b82f6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>WHY CHOOSE US</p>
          <h2 style={{ ...S.h2, marginBottom: '48px' }}>Research-First Approach</h2>
          <div style={S.grid3}>
            {features.map((f, i) => (
              <div key={i} style={{ ...S.card, textAlign: 'left', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ width: '48px', height: '48px', background: 'rgba(29,78,216,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '16px' }}>{f.icon}</div>
                <h3 style={{ ...S.h4, marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ fontSize: '14px', ...S.muted, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ ...S.section, background: '#0a0f1e' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#3b82f6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>HOW IT WORKS</p>
          <h2 style={{ ...S.h2, marginBottom: '48px' }}>Simple Steps to Start</h2>
          <div style={S.grid4}>
            {steps.map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '24px 16px' }}>
                <div style={{ fontSize: '48px', fontWeight: 800, color: 'rgba(29,78,216,0.3)', lineHeight: 1, marginBottom: '16px' }}>{s.n}</div>
                <h3 style={{ ...S.h4, marginBottom: '8px' }}>{s.title}</h3>
                <p style={{ fontSize: '13px', ...S.muted, lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section style={{ ...S.section, background: '#080d1a' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#3b82f6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>PRICING</p>
          <h2 style={{ ...S.h2, marginBottom: '8px' }}>Choose Your Research Plan</h2>
          <p style={{ ...S.muted, marginBottom: '48px' }}>Flexible plans designed for traders of all experience levels.</p>
          <PricingCards compact={true} />
          <button onClick={() => navigate('/pricing')} style={{ ...S.btn, ...S.btnSecondary, marginTop: '24px' }}>View Full Plan Comparison →</button>
        </div>
      </section>

      {/* Risk Management */}
      <section style={{ ...S.section, background: '#0a0f1e' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={S.h2}>Risk Management Framework</h2>
            <p style={{ ...S.muted, marginTop: '8px' }}>We follow strict risk management principles in all our research</p>
          </div>
          <div style={S.grid2}>
            {[
              { icon: '📏', title: 'Position Sizing', desc: 'Never risk more than 2-3% of capital on a single trade. We specify lot sizes for F&O trades.' },
              { icon: '🛑', title: 'Stop-Loss Discipline', desc: 'Every research call includes a mandatory stop-loss. Respect it without exception.' },
              { icon: '⚖️', title: 'Risk-Reward Ratio', desc: 'We only publish calls with minimum 1:2 risk-reward ratio. Better setups, better outcomes.' },
              { icon: '🎯', title: 'Capital Allocation', desc: 'Diversify across segments. Avoid concentrating more than 20% in a single stock or sector.' },
            ].map((r, i) => (
              <div key={i} style={{ ...S.card, ...S.flex, gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '28px', flexShrink: 0 }}>{r.icon}</div>
                <div>
                  <h4 style={{ ...S.h4, marginBottom: '4px' }}>{r.title}</h4>
                  <p style={{ fontSize: '13px', ...S.muted, lineHeight: 1.6 }}>{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ ...S.disclaimer, marginTop: '24px' }}>
            ⚠️ <strong>F&O WARNING:</strong> Futures & Options trading involves substantial risk. F&O is a leveraged instrument and can result in losses exceeding your initial investment. Only trade F&O if you have adequate experience and risk capital. This is not suitable for all investors.
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ ...S.section, background: 'linear-gradient(135deg, #0d1a3a 0%, #1a0a2e 100%)' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ ...S.h2, marginBottom: '16px' }}>Ready to Start Your Research Journey?</h2>
          <p style={{ ...S.muted, marginBottom: '32px', lineHeight: 1.7 }}>Join thousands of informed investors. Pick the research plan that fits how you trade.</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')} style={{ ...S.btn, ...S.btnPrimary, fontSize: '16px', padding: '14px 32px' }}>
              Start Free Trial →
            </button>
            <button onClick={() => navigate('/contact')} style={{ ...S.btn, ...S.btnSecondary, fontSize: '16px', padding: '14px 32px' }}>
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
    <footer style={{ background: '#080d1a', borderTop: '1px solid #1e293b', padding: '60px 20px 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '40px', marginBottom: '48px' }}>
          <div>
            <div style={{ ...S.navLogo, marginBottom: '16px' }}>
              <div style={S.navLogoIcon}>📈</div>
              <span>{APP_NAME}</span>
            </div>
            <p style={{ fontSize: '13px', ...S.muted, lineHeight: 1.7, marginBottom: '12px' }}>
              Your trusted partner for stock market research. SEBI Registered Research Analyst.
            </p>
            <p style={{ fontSize: '11px', color: '#475569' }}>SEBI RA Reg: {SEBI_REG}</p>
          </div>
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <p style={{ fontWeight: 700, fontSize: '13px', color: '#e2e8f0', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{section}</p>
              {items.map(item => (
                <button key={item.path} onClick={() => navigate(item.path)}
                  style={{ display: 'block', background: 'none', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer', padding: '4px 0', textAlign: 'left', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
                  onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid #1e293b', padding: '24px 0' }}>
          <div style={{ ...S.disclaimer, marginBottom: '16px' }}>
            <strong>SEBI Research Analyst Registration:</strong> Investment in securities market is subject to market risks. Read all the related documents carefully before investing. The securities quoted are exemplary and are not recommendatory. Past performance is not indicative of future results. The content provided is for educational and informational purposes only. {COMPANY_NAME} | SEBI RA Reg: {SEBI_REG} | Analyst: {ANALYST_NAME}
          </div>
          <div style={{ ...S.flexBetween, flexWrap: 'wrap', gap: '8px' }}>
            <p style={{ fontSize: '12px', color: '#475569' }}>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
            <p style={{ fontSize: '12px', color: '#475569' }}>Made with ❤️ in India</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── PRICING CARDS ────────────────────────────────────────────────────────────
function PricingCards({ compact = false }) {
  const [cycle, setCycle] = useState('monthly');

  const prices = {
    basic: { monthly: 999, quarterly: 2697, halfyearly: 5094, yearly: 8991 },
    premium: { monthly: 2499, quarterly: 6747, halfyearly: 12744, yearly: 22491 },
    fno: { monthly: 3999, quarterly: 10797, halfyearly: 20394, yearly: 35991 },
    elite: { monthly: 5999, quarterly: 16197, halfyearly: 30594, yearly: 53991 },
  };

  const planDefs = [
    { id: 'basic', name: 'Basic Equity', desc: 'Core equity research to get started', color: '#64748b', features: ['basic_recommendations', 'market_updates', 'blog_access', 'equity_recommendations'] },
    { id: 'premium', name: 'Premium Equity', desc: 'Deeper research for serious equity investors', color: '#3b82f6', popular: false, features: ['basic_recommendations', 'market_updates', 'blog_access', 'equity_recommendations', 'ipo_recommendations', 'priority_support'] },
    { id: 'fno', name: 'F&O Pro', desc: 'Most popular for active derivatives traders', color: '#f59e0b', popular: true, features: ['basic_recommendations', 'market_updates', 'blog_access', 'equity_recommendations', 'fno_recommendations', 'intraday_calls', 'options_strategies', 'priority_support'] },
    { id: 'elite', name: 'Elite All Access', desc: 'Complete research suite across every segment', color: '#a78bfa', popular: false, features: Object.keys(PLAN_FEATURES.reduce((a, f) => ({ ...a, [f.key]: true }), {})) },
  ];

  return (
    <div>
      {!compact && (
        <div style={{ display: 'flex', gap: '4px', background: '#111827', padding: '4px', borderRadius: '10px', width: 'fit-content', margin: '0 auto 40px', flexWrap: 'wrap', justifyContent: 'center' }}>
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
                {fmtCurr(prices[plan.id][compact ? 'monthly' : cycle])}
              </span>
              <span style={{ fontSize: '13px', ...S.muted }}>/{compact ? 'mo' : cycle === 'monthly' ? 'month' : cycle}</span>
            </div>
            {!compact && (
              <div style={{ marginBottom: '20px' }}>
                {PLAN_FEATURES.map(f => (
                  <div key={f.key} style={{ ...S.flex, gap: '8px', padding: '5px 0', fontSize: '13px' }}>
                    <span style={{ color: plan.features.includes(f.key) ? '#10b981' : '#334155', fontSize: '15px' }}>
                      {plan.features.includes(f.key) ? '✓' : '✕'}
                    </span>
                    <span style={{ color: plan.features.includes(f.key) ? '#e2e8f0' : '#475569' }}>{f.label}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => navigate('/register')}
              style={{ ...S.btn, width: '100%', justifyContent: 'center', background: plan.popular ? '#f59e0b' : '#1d4ed8', color: plan.popular ? '#000' : '#fff', border: 'none' }}>
              {compact ? 'Subscribe' : 'Subscribe Now'}
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
    { q: 'Can I get a refund?', a: 'We offer a 7-day refund policy for paid plans. Contact us within 7 days of payment if you are not satisfied.' },
    { q: 'Are the recommendations guaranteed?', a: 'No. Research analysis is based on technical and fundamental research but does not guarantee returns. Investment is subject to market risk.' },
  ];

  return (
    <div style={{ paddingTop: '80px' }}>
      <section style={{ ...S.section, textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ ...S.h2, marginBottom: '8px' }}>Choose Your Research Plan</h1>
          <p style={{ ...S.muted, marginBottom: '8px' }}>Flexible plans designed for traders of all experience levels.</p>
          <p style={{ fontSize: '13px', color: '#3b82f6', marginBottom: '40px' }}>All plans include our core features with SEBI-compliant research disclosures.</p>
          <PricingCards compact={false} />
        </div>
      </section>

      {/* Feature comparison table */}
      <section style={{ ...S.section, background: '#080d1a', paddingTop: '0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h3 style={{ ...S.h3, textAlign: 'center', marginBottom: '24px' }}>Full Feature Comparison</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>Feature</th>
                  {['Free', 'Silver', 'Gold', 'Platinum'].map(p => (
                    <th key={p} style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '1px solid #1e293b', color: p === 'Gold' ? '#f59e0b' : '#e2e8f0' }}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PLAN_FEATURES.map((f, i) => {
                  const matrix = {
                    basic_recommendations: [true, true, true, true],
                    market_updates: [true, true, true, true],
                    blog_access: [true, true, true, true],
                    equity_recommendations: [false, true, true, true],
                    fno_recommendations: [false, false, true, true],
                    intraday_calls: [false, false, true, true],
                    options_strategies: [false, false, false, true],
                    ipo_recommendations: [false, false, true, true],
                    telegram_signals: [false, false, false, true],
                    priority_support: [false, false, true, true],
                    one_on_one: [false, false, false, true],
                  };
                  return (
                    <tr key={f.key} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(30,41,59,0.3)' }}>
                      <td style={{ padding: '12px 16px', color: '#e2e8f0' }}>{f.label}</td>
                      {matrix[f.key].map((has, j) => (
                        <td key={j} style={{ padding: '12px 16px', textAlign: 'center', color: has ? '#10b981' : '#334155', fontSize: '18px' }}>
                          {has ? '✓' : '✕'}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ ...S.section, background: '#0a0f1e' }}>
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
    <div style={{ paddingTop: '80px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 20px 40px' }}>
      <div style={{ ...S.card, maxWidth: '440px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ ...S.navLogoIcon, margin: '0 auto 16px', width: '48px', height: '48px', fontSize: '24px' }}>📈</div>
          <h2 style={S.h2}>{APP_NAME}</h2>
          <p style={{ ...S.muted, marginTop: '4px' }}>Welcome back. Sign in to your account.</p>
        </div>
        {err && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#ef4444', marginBottom: '16px' }}>{err}</div>}
        <div style={S.formGroup}>
          <label style={S.label}>Email</label>
          <input style={S.input} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div style={S.formGroup}>
          <div style={{ ...S.flexBetween, marginBottom: '6px' }}>
            <label style={{ ...S.label, marginBottom: 0 }}>Password</label>
            <button onClick={() => navigate('/forgot-password')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '12px', cursor: 'pointer' }}>Forgot password?</button>
          </div>
          <input style={S.input} type="password" placeholder="Enter your password" value={pw} onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>
        <button onClick={handleLogin} disabled={loading} style={{ ...S.btn, ...S.btnPrimary, width: '100%', justifyContent: 'center', marginBottom: '12px', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <div style={{ textAlign: 'center', ...S.muted, fontSize: '12px', margin: '12px 0' }}>OR CONTINUE WITH</div>
        <button onClick={handleGoogle} style={{ ...S.btn, ...S.btnSecondary, width: '100%', justifyContent: 'center', marginBottom: '24px' }}>
          <span>G</span> Continue with Google
        </button>
        <p style={{ textAlign: 'center', fontSize: '14px', ...S.muted }}>
          Don't have an account?{' '}
          <button onClick={() => navigate('/register')} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 600 }}>Sign up</button>
        </p>
      </div>
    </div>
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
    navigate('/dashboard');
    setLoading(false);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 20px 40px' }}>
      <div style={{ ...S.card, maxWidth: '460px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ ...S.navLogoIcon, margin: '0 auto 12px', width: '48px', height: '48px', fontSize: '24px' }}>📈</div>
          <h2 style={S.h2}>Create Account</h2>
          <p style={{ ...S.muted, marginTop: '4px', fontSize: '14px' }}>Join thousands of informed investors</p>
        </div>
        {err && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#ef4444', marginBottom: '16px' }}>{err}</div>}
        <div style={S.formGroup}>
          <label style={S.label}>Full Name *</label>
          <input style={S.input} type="text" placeholder="Your full name" value={form.fullName} onChange={e => set('fullName', e.target.value)} />
        </div>
        <div style={S.formGroup}>
          <label style={S.label}>Email *</label>
          <input style={S.input} type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
        </div>
        <div style={S.formGroup}>
          <label style={S.label}>Mobile (optional)</label>
          <input style={S.input} type="tel" placeholder="+91 XXXXX XXXXX" value={form.mobile} onChange={e => set('mobile', e.target.value)} />
        </div>
        <div style={S.formGroup}>
          <label style={S.label}>Password *</label>
          <input style={S.input} type="password" placeholder="Min 8 characters" value={form.password} onChange={e => set('password', e.target.value)} />
        </div>
        <div style={S.formGroup}>
          <label style={S.label}>Confirm Password *</label>
          <input style={S.input} type="password" placeholder="Confirm your password" value={form.confirm} onChange={e => set('confirm', e.target.value)} />
        </div>
        <div style={{ ...S.flex, gap: '10px', marginBottom: '20px' }}>
          <input type="checkbox" id="agree" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
          <label htmlFor="agree" style={{ fontSize: '13px', ...S.muted, cursor: 'pointer' }}>
            I agree to the{' '}
            <button onClick={() => navigate('/terms')} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '13px' }}>Terms of Service</button>
            {' '}and{' '}
            <button onClick={() => navigate('/privacy')} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '13px' }}>Privacy Policy</button>
          </label>
        </div>
        <button onClick={handleRegister} disabled={loading} style={{ ...S.btn, ...S.btnPrimary, width: '100%', justifyContent: 'center', marginBottom: '12px', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
        <button onClick={async () => await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/dashboard' } })}
          style={{ ...S.btn, ...S.btnSecondary, width: '100%', justifyContent: 'center', marginBottom: '20px' }}>
          G Continue with Google
        </button>
        <p style={{ textAlign: 'center', fontSize: '14px', ...S.muted }}>
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 600 }}>Sign in</button>
        </p>
      </div>
    </div>
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
                    style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '14px', padding: '10px 0', cursor: 'pointer', borderBottom: '1px solid #1e293b' }}
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
  const hasActiveSub = !!userProfile?.plan_id &&
    userProfile?.plan_expires_at && new Date(userProfile.plan_expires_at) > new Date();
  const hasAccess = hasActiveSub && userRank >= reqRank;
  const isLocked = !hasAccess;

  return (
    <div style={{ ...S.card, marginBottom: '12px', cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#1e293b'}
      onClick={onClick || (() => { if (!isLocked) navigate('/recommendations/' + rec.id); })}>
      {isLocked && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,15,30,0.88)', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🔒</span>
          <p style={{ fontSize: '13px', fontWeight: 700 }}>{PLANS[rec.plan_required || 'basic']?.name || 'Basic Equity'} Plan Required</p>
          <button onClick={e => { e.stopPropagation(); navigate('/pricing'); }} style={{ ...S.btn, ...S.btnPrimary, ...S.btnSm }}>Upgrade</button>
        </div>
      )}
      <div style={{ ...S.flexBetween, marginBottom: '8px' }}>
        <div style={{ ...S.flex, gap: '8px' }}>
          <span style={{ ...S.badge, ...actionStyle(rec.action) }}>{rec.action}</span>
          <span style={{ fontSize: '11px', ...S.muted, background: '#1e293b', padding: '2px 8px', borderRadius: '4px' }}>{rec.segment?.toUpperCase()}{rec.commodity_type ? ` · ${rec.commodity_type}` : ''}</span>
          <span style={{ fontSize: '11px', ...S.muted, background: '#1e293b', padding: '2px 8px', borderRadius: '4px' }}>{rec.time_horizon}</span>
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: rec.status === 'target_hit' ? 'rgba(16,185,129,0.15)' : rec.status === 'sl_hit' ? 'rgba(239,68,68,0.15)' : rec.status === 'expired' || rec.status === 'closed' || rec.status === 'archived' ? 'rgba(148,163,184,0.15)' : 'rgba(59,130,246,0.15)', color: rec.status === 'target_hit' ? '#10b981' : rec.status === 'sl_hit' ? '#ef4444' : rec.status === 'expired' || rec.status === 'closed' || rec.status === 'archived' ? '#94a3b8' : '#3b82f6' }}>
            {(rec.status || 'live').replace('_', ' ').toUpperCase()}
          </span>
        </div>
        <span style={{ fontSize: '11px', ...S.muted }}>{new Date(rec.published_at).toLocaleDateString('en-IN')}</span>
      </div>
      <div style={{ ...S.flexBetween }}>
        <div>
          <h4 style={{ ...S.h4 }}>{rec.symbol} <span style={{ fontSize: '12px', fontWeight: 400, ...S.muted }}>({rec.exchange})</span></h4>
          <p style={{ fontSize: '13px', ...S.muted }}>{rec.stock_name}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', ...S.muted }}>Target</div>
          <div style={{ fontWeight: 700, color: '#10b981' }}>{fmt(rec.target1)}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '12px' }}>
        <div><p style={{ fontSize: '10px', ...S.muted }}>Entry</p><p style={{ fontSize: '13px', fontWeight: 600 }}>{fmt(rec.entry_price)}</p></div>
        <div><p style={{ fontSize: '10px', ...S.muted }}>SL</p><p style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444' }}>{fmt(rec.stop_loss)}</p></div>
        <div><p style={{ fontSize: '10px', ...S.muted }}>T1</p><p style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>{fmt(rec.target1)}</p></div>
        <div><p style={{ fontSize: '10px', ...S.muted }}>{rec.exit_price ? 'Exit' : 'Upside'}</p><p style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>{rec.exit_price ? fmt(rec.exit_price) : pct(rec.entry_price, rec.target1)}</p></div>
      </div>
      {(rec.chart_url || rec.report_url) && (
        <div style={{ ...S.flex, gap: '12px', marginTop: '10px' }}>
          {rec.chart_url && <a href={rec.chart_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: '11px', color: '#3b82f6' }}>📈 Chart</a>}
          {rec.report_url && <a href={rec.report_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: '11px', color: '#3b82f6' }}>📄 Report</a>}
        </div>
      )}
      {rec.risk_level && (
        <div style={{ ...S.flex, gap: '6px', marginTop: '10px' }}>
          <span style={{ fontSize: '10px', ...S.muted }}>Risk:</span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: riskColor(rec.risk_level), textTransform: 'capitalize' }}>● {rec.risk_level}</span>
        </div>
      )}
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
              { label: 'Total Calls', value: stats.total, color: '#94a3b8', icon: '📋' },
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
function ChartPlaceholder({ label, icon }) {
  return (
    <div style={{ ...S.card, textAlign: 'center', padding: '32px 16px', opacity: 0.7 }}>
      <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
      <p style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>{label}</p>
      <p style={{ fontSize: '12px', ...S.muted }}>Live charts coming soon.</p>
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
            <span style={{ ...S.badge, background: '#1e293b' }}>{effStatus.replace('_', ' ').toUpperCase()}</span>
            <span style={{ ...S.badge, background: '#1e293b' }}>{rec.time_horizon}</span>
            <span style={{ ...S.badge, background: '#1e293b' }}>Risk: <span style={{ color: riskColor(rec.risk_level) }}>{rec.risk_level}</span></span>
            <span style={{ ...S.badge, background: '#1e293b' }}>{PLANS[rec.plan_required]?.name}</span>
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

          {/* Chart-ready placeholders, disabled until a live feed is connected */}
          <h4 style={{ ...S.h4, marginBottom: '12px' }}>Charts</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <ChartPlaceholder label="Stock Chart" icon="📈" />
            <ChartPlaceholder label="Technical Chart" icon="📐" />
            <ChartPlaceholder label="Candlestick Chart" icon="🕯️" />
            <ChartPlaceholder label="Volume Chart" icon="📊" />
            <ChartPlaceholder label="Support / Resistance" icon="📏" />
            <ChartPlaceholder label="Option Chain" icon="⛓️" />
          </div>

          <div style={{ ...S.disclaimer }}>
            ⚠️ Investment in securities market is subject to market risk. Past performance does not guarantee future returns. This platform does not provide guaranteed profit. SEBI RA Reg: {SEBI_REG}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({ user, userProfile }) {
  const [activeTab, setActiveTab] = useState('recommendations');
  const [recs, setRecs] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editRec, setEditRec] = useState(null);
  const [loading, setLoading] = useState(true);

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
    }
    setLoading(false);
  };

  const deleteRec = async (id) => {
    if (!confirm('Delete this recommendation?')) return;
    await supabase.from('recommendations').delete().eq('id', id);
    fetchData();
  };

  const updateStatus = async (id, status) => {
    await supabase.from('recommendations').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
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
          <div style={{ ...S.flex, gap: '4px', background: '#111827', padding: '4px', borderRadius: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {[
              { key: 'recommendations', label: '📊 Recommendations' },
              { key: 'add_recommendation', label: '➕ Add Call' },
              { key: 'users', label: '👥 Users' },
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
          {activeTab === 'users' && (
            loading ? <div style={{ ...S.card, textAlign: 'center', padding: '40px', ...S.muted }}>Loading...</div> :
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    {['Name', 'Email', 'Plan', 'Admin', 'Joined'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #1e293b', color: '#94a3b8', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '10px 12px' }}>{u.full_name || '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{u.email}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ ...S.badge, background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>{(u.plan_id || 'basic').toUpperCase()}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>{u.is_admin ? '✅' : '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ADD RECOMMENDATION FORM ──────────────────────────────────────────────────
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

  useEffect(() => {
    supabase.from('recommendations').select('*').then(({ data }) => {
      setRecs(data || []);
      setLoading(false);
    });
  }, []);

  const closed = recs.filter(r => ['closed', 'target_hit', 'sl_hit', 'expired'].includes(r.status));
  const targets = recs.filter(r => r.status === 'target_hit');
  const slHit = recs.filter(r => r.status === 'sl_hit');
  const winRate = closed.length ? ((targets.length / closed.length) * 100).toFixed(1) : 0;

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <div style={{ ...S.section, paddingTop: '40px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h1 style={{ ...S.h2, marginBottom: '8px' }}>Performance Report</h1>
          <p style={{ ...S.muted, marginBottom: '32px' }}>Transparent track record of all research calls published on this platform.</p>

          <div style={{ ...S.grid4, marginBottom: '32px' }}>
            {[
              { label: 'Total Calls', value: recs.length, color: '#94a3b8' },
              { label: 'Target Hit', value: targets.length, color: '#10b981' },
              { label: 'Stop Loss Hit', value: slHit.length, color: '#ef4444' },
              { label: 'Win Rate', value: winRate + '%', color: '#f59e0b' },
            ].map((s, i) => (
              <div key={i} style={{ ...S.card, textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '12px', ...S.muted, marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {loading ? (
            <div style={{ ...S.card, textAlign: 'center', padding: '40px', ...S.muted }}>Loading...</div>
          ) : closed.length === 0 ? (
            <div style={{ ...S.card, textAlign: 'center', padding: '60px' }}>
              <p style={{ fontSize: '32px', marginBottom: '12px' }}>📊</p>
              <p style={S.muted}>No closed calls yet. Performance data will appear here.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    {['Stock', 'Action', 'Entry', 'Exit', 'Return', 'Status', 'Date'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #1e293b', color: '#94a3b8', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {closed.map(r => {
                    const ret = r.exit_price && r.entry_price ? (((r.exit_price - r.entry_price) / r.entry_price) * 100).toFixed(1) : null;
                    const isWin = parseFloat(ret) > 0;
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{r.symbol}</td>
                        <td style={{ padding: '10px 12px' }}><span style={{ ...S.badge, ...actionStyle(r.action) }}>{r.action}</span></td>
                        <td style={{ padding: '10px 12px' }}>{fmt(r.entry_price)}</td>
                        <td style={{ padding: '10px 12px' }}>{fmt(r.exit_price) || '—'}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: ret ? (isWin ? '#10b981' : '#ef4444') : '#94a3b8' }}>
                          {ret ? (isWin ? '+' : '') + ret + '%' : '—'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ ...S.badge, background: r.status === 'target_hit' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: r.status === 'target_hit' ? '#10b981' : '#ef4444' }}>
                            {r.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{new Date(r.closed_at || r.updated_at).toLocaleDateString('en-IN')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ ...S.disclaimer, marginTop: '32px' }}>
            ⚠️ Past performance is not indicative of future results. Research calls are for educational purposes only. Returns shown are theoretical based on published entry and exit levels and may differ from actual trading outcomes due to slippage, brokerage, and market conditions.
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// ─── LEGAL PAGES ──────────────────────────────────────────────────────────────
function LegalPage({ title, children }) {
  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <div style={{ ...S.section }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ ...S.h2, marginBottom: '8px' }}>{title}</h1>
          <p style={{ ...S.muted, marginBottom: '32px', fontSize: '13px' }}>Last updated: June 2026</p>
          <div style={{ ...S.card, fontSize: '14px', lineHeight: 1.9, color: '#cbd5e1' }}>
            {children}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function DisclaimerPage() {
  return (
    <LegalPage title="⚠️ Disclaimer">
      <p><strong style={{ color: '#ef4444' }}>IMPORTANT DISCLAIMER — PLEASE READ CAREFULLY</strong></p>
      <p style={{ marginTop: '16px' }}>{APP_NAME} ({COMPANY_NAME}) is a SEBI Registered Research Analyst (Registration No: {SEBI_REG}). Our research and analysis is provided for educational and informational purposes only.</p>
      <p style={{ marginTop: '12px' }}><strong>Investment Risk:</strong> Investment in securities market is subject to market risks. Read all related documents carefully before investing. The securities quoted are exemplary and are not recommendatory. Past performance is not indicative of future results.</p>
      <p style={{ marginTop: '12px' }}><strong>No Guaranteed Returns:</strong> We do not promise, guarantee, or assure any returns or profits. Stock market investments are inherently risky and may result in financial loss.</p>
      <p style={{ marginTop: '12px' }}><strong>F&O Warning:</strong> Futures and Options trading involves substantial risk and is not suitable for all investors. Options can result in total loss of premium paid. Please assess your risk tolerance before trading F&O.</p>
      <p style={{ marginTop: '12px' }}><strong>Not Investment Advice:</strong> Content on this platform is research analysis, not personalized investment advice. Consult a SEBI Registered Investment Advisor for personalized advice.</p>
      <p style={{ marginTop: '12px' }}>For grievances, contact: {GRIEVANCE_EMAIL}</p>
    </LegalPage>
  );
}

function PrivacyPage() {
  return (
    <LegalPage title="🔒 Privacy Policy">
      <p><strong>Data Collection:</strong> We collect name, email, mobile number, and usage data to provide research services. We do not sell your personal data to third parties.</p>
      <p style={{ marginTop: '12px' }}><strong>Data Storage:</strong> Your data is stored securely on Supabase (hosted in India/AWS) and protected by industry-standard encryption.</p>
      <p style={{ marginTop: '12px' }}><strong>Payment Data:</strong> Payment information is processed by Razorpay and is never stored on our servers. We comply with PCI-DSS standards via our payment partner.</p>
      <p style={{ marginTop: '12px' }}><strong>DPDP Act 2023:</strong> We comply with India's Digital Personal Data Protection Act 2023. You have the right to access, correct, or delete your personal data.</p>
      <p style={{ marginTop: '12px' }}><strong>Cookies:</strong> We use essential cookies for authentication and analytics cookies to improve the platform.</p>
      <p style={{ marginTop: '12px' }}>Contact for privacy queries: {CONTACT_EMAIL}</p>
    </LegalPage>
  );
}

function TermsPage() {
  return (
    <LegalPage title="📋 Terms of Service">
      <p><strong>Acceptance:</strong> By using {APP_NAME}, you agree to these terms and our Privacy Policy. If you disagree, please do not use this platform.</p>
      <p style={{ marginTop: '12px' }}><strong>Service:</strong> We provide stock market research and analysis. We are not a stock broker, investment advisor, or portfolio manager.</p>
      <p style={{ marginTop: '12px' }}><strong>Subscriptions:</strong> Subscription fees are charged in advance. Plans auto-renew unless cancelled before the renewal date.</p>
      <p style={{ marginTop: '12px' }}><strong>User Obligations:</strong> You must be 18+ years of age, comply with all applicable laws, and not share your account credentials.</p>
      <p style={{ marginTop: '12px' }}><strong>Intellectual Property:</strong> All research content is owned by {COMPANY_NAME}. You may not reproduce, distribute, or sell our research without written permission.</p>
      <p style={{ marginTop: '12px' }}><strong>Limitation of Liability:</strong> {COMPANY_NAME} shall not be liable for any financial losses arising from use of our research platform.</p>
    </LegalPage>
  );
}

function RefundPage() {
  return (
    <LegalPage title="💳 Refund Policy">
      <p><strong>7-Day Refund:</strong> We offer a full refund within 7 days of purchase if you are not satisfied with our service and have not accessed more than 5 research calls.</p>
      <p style={{ marginTop: '12px' }}><strong>Non-Refundable:</strong> Subscriptions older than 7 days are non-refundable. Partial period refunds are not provided for mid-cycle cancellations.</p>
      <p style={{ marginTop: '12px' }}><strong>Process:</strong> Email {CONTACT_EMAIL} with your registered email and order ID. Refunds are processed within 5-7 business days to the original payment method.</p>
      <p style={{ marginTop: '12px' }}><strong>Note:</strong> Market losses due to trading based on our research are not eligible for refund. Please read our Disclaimer carefully.</p>
    </LegalPage>
  );
}

function GrievancePage() {
  return (
    <LegalPage title="📮 Grievance Redressal">
      <p><strong>SEBI Grievance Mechanism:</strong> As a SEBI Registered Research Analyst, we have a formal grievance redressal mechanism in place.</p>
      <p style={{ marginTop: '12px' }}><strong>Level 1 — Company:</strong> Email: {GRIEVANCE_EMAIL} | Phone: {CONTACT_PHONE} | Response within 3 business days.</p>
      <p style={{ marginTop: '12px' }}><strong>Level 2 — SEBI SCORES:</strong> If unresolved within 30 days, you may file a complaint at SEBI SCORES portal: <strong>scores.sebi.gov.in</strong></p>
      <p style={{ marginTop: '12px' }}><strong>Level 3 — Online Dispute Resolution:</strong> You may also file a complaint at <strong>smartodr.in</strong> (SEBI's ODR platform).</p>
      <p style={{ marginTop: '12px' }}><strong>Grievance Officer:</strong> {ANALYST_NAME} | {COMPANY_NAME} | Email: {GRIEVANCE_EMAIL}</p>
    </LegalPage>
  );
}

function SEBIDisclosurePage() {
  return (
    <LegalPage title="🛡️ SEBI RA Disclosure">
      <p><strong>Registration Details:</strong></p>
      <p style={{ marginTop: '8px' }}>Name: {ANALYST_NAME}</p>
      <p>Company: {COMPANY_NAME}</p>
      <p>SEBI Registration No: {SEBI_REG}</p>
      <p>Type: Individual Research Analyst</p>
      <p style={{ marginTop: '16px' }}><strong>Conflict of Interest Disclosure:</strong> The Research Analyst or his/her associates may or may not hold positions in the securities mentioned in research calls. All disclosures are made in accordance with SEBI (Research Analysts) Regulations, 2014 as amended.</p>
      <p style={{ marginTop: '12px' }}><strong>Source of Compensation:</strong> The Research Analyst is compensated through subscription fees from users. We do not receive any compensation from companies whose securities are analyzed.</p>
      <p style={{ marginTop: '12px' }}><strong>Regulatory Compliance:</strong> We comply with SEBI (Research Analysts) Regulations, 2014 and all amendments thereto, including the November 2025 amendment.</p>
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
            <p style={{ fontSize: '14px', lineHeight: 1.8, color: '#cbd5e1' }}>To provide SEBI-compliant, research-backed equity and F&O analysis to retail investors in India, helping them make informed investment decisions based on thorough technical and fundamental analysis — not tips or speculation.</p>
          </div>
          <div style={{ ...S.card, marginBottom: '20px' }}>
            <h3 style={{ ...S.h3, marginBottom: '12px' }}>📊 Research Methodology</h3>
            <p style={{ fontSize: '14px', lineHeight: 1.8, color: '#cbd5e1' }}>Every research call is backed by: Technical Analysis (price action, indicators, chart patterns), Fundamental Analysis (earnings, valuations, sector outlook), Risk Assessment (risk-reward ratio minimum 1:2), Clear entry, multiple targets, and stop-loss levels.</p>
          </div>
          <div style={{ ...S.card, marginBottom: '20px' }}>
            <h3 style={{ ...S.h3, marginBottom: '12px' }}>🛡️ SEBI Compliance</h3>
            <p style={{ fontSize: '14px', lineHeight: 1.8, color: '#cbd5e1' }}>We are SEBI Registered Research Analysts (Reg: {SEBI_REG}) complying with SEBI (Research Analysts) Regulations, 2014 and the November 2025 amendments. All research comes with mandatory risk disclosures.</p>
          </div>
          <div style={{ ...S.card }}>
            <h3 style={{ ...S.h3, marginBottom: '12px' }}>📞 Contact</h3>
            <p style={{ fontSize: '14px', color: '#cbd5e1' }}>Email: {CONTACT_EMAIL}</p>
            <p style={{ fontSize: '14px', color: '#cbd5e1' }}>Grievance: {GRIEVANCE_EMAIL}</p>
            <p style={{ fontSize: '14px', color: '#cbd5e1' }}>Phone: {CONTACT_PHONE}</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// ─── SUBSCRIPTION PAGE ────────────────────────────────────────────────────────
function SubscriptionPage({ user, userProfile }) {
  const plan = PLANS[userProfile?.plan_id || 'basic'];
  const isActive = userProfile?.plan_expires_at && new Date(userProfile.plan_expires_at) > new Date();

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <div style={{ ...S.section, paddingTop: '40px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h1 style={{ ...S.h2, marginBottom: '32px' }}>💳 Subscription</h1>
          <div style={{ ...S.card, marginBottom: '24px' }}>
            <h3 style={{ ...S.h3, marginBottom: '16px' }}>Current Plan</h3>
            <div style={{ ...S.flex, gap: '16px' }}>
              <div style={{ width: '56px', height: '56px', background: 'rgba(245,158,11,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
                {userProfile?.plan_id === 'basic' ? '📊' : userProfile?.plan_id === 'premium' ? '📈' : userProfile?.plan_id === 'fno' ? '⚡' : '💎'}
              </div>
              <div>
                <p style={{ fontWeight: 800, fontSize: '20px', color: plan?.color }}>{plan?.name} Plan</p>
                {isActive ? (
                  <p style={{ fontSize: '13px', ...S.muted }}>
                    Active · Expires {new Date(userProfile.plan_expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                ) : (
                  <p style={{ fontSize: '13px', color: '#ef4444' }}>Free / Inactive</p>
                )}
              </div>
            </div>
            {!isActive && (
              <button onClick={() => navigate('/pricing')} style={{ ...S.btn, ...S.btnGold, marginTop: '20px', width: '100%', justifyContent: 'center' }}>
                ⬆️ Upgrade to Premium
              </button>
            )}
          </div>
          <button onClick={() => navigate('/pricing')} style={{ ...S.btn, ...S.btnSecondary, width: '100%', justifyContent: 'center' }}>
            View All Plans & Upgrade
          </button>
        </div>
      </div>
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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase.from('users').select('*').eq('id', session.user.id).single();
        setUserProfile(profile);
      }
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase.from('users').select('*').eq('id', session.user.id).single();
        setUserProfile(profile);
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
    if (path === '/performance') return <PerformancePage />;
    if (path === '/about') return <AboutPage />;
    if (path === '/disclaimer') return <DisclaimerPage />;
    if (path === '/privacy') return <PrivacyPage />;
    if (path === '/terms') return <TermsPage />;
    if (path === '/refund') return <RefundPage />;
    if (path === '/grievance') return <GrievancePage />;
    if (path === '/disclosure' || path === '/sebi-disclosure') return <SEBIDisclosurePage />;
    if (path === '/dashboard') return protectedPage(Dashboard);
    if (path === '/subscription') return protectedPage(SubscriptionPage);
    if (path === '/admin') return protectedPage(AdminPanel);
    return <NotFoundPage />;
  };

  return (
    <div style={S.page}>
      <Navbar user={user} userProfile={userProfile} onLogout={handleLogout} />
      {renderPage()}
    </div>
  );
}
