# STOCK RESEARCH PLATFORM — SETUP GUIDE

## Files in this project:
- src/App.jsx — Complete React SPA (~1100 lines)
- index.html — Entry HTML
- package.json — Dependencies
- vite.config.js — Vite config
- vercel.json — SPA routing for Vercel
- .env.example — Environment variables template
- supabase_schema.sql — Complete DB schema

---

## STEP 1: Create New GitHub Repo
1. Go to github.com → New Repository
2. Name: your-app-name (e.g., nrj-research)
3. Private repo recommended
4. Copy all files into the repo

---

## STEP 2: Supabase Setup
1. Go to supabase.com → New Project (Mumbai region)
2. Copy your Project URL and anon key
3. Go to SQL Editor → Run the entire supabase_schema.sql
4. Go to Authentication → Settings:
   - Enable Email provider
   - Set Site URL to your Vercel domain
   - Add redirect URL: https://yourdomain.com/dashboard
5. (Optional) Enable Google OAuth provider

---

## STEP 3: Customize App Constants
In src/App.jsx, update these constants at the top:
  const APP_NAME = 'Your App Name';
  const SEBI_REG = 'INH000XXXXXX';      // Your SEBI RA reg number
  const ANALYST_NAME = 'Your Name';
  const COMPANY_NAME = 'Your Company';
  const GRIEVANCE_EMAIL = 'grievance@yourdomain.com';
  const CONTACT_EMAIL = 'contact@yourdomain.com';
  const CONTACT_PHONE = '+91-XXXXXXXXXX';

Also update plan prices if needed (search "const prices" in App.jsx).

---

## STEP 4: Vercel Deployment
1. Go to vercel.com → New Project → Import GitHub repo
2. Framework: Vite
3. Add Environment Variables:
   VITE_SUPABASE_URL = https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY = your_anon_key
   VITE_RAZORPAY_KEY = rzp_test_xxx (or live key)
4. Deploy → Get your domain

---

## STEP 5: Make Yourself Admin
After your first login, run this in Supabase SQL Editor:
  UPDATE users SET is_admin = true WHERE email = 'your@email.com';

Then go to /admin to access the admin panel.

---

## STEP 6: Update Workflow (same as Plan Our Future)
1. Edit src/App.jsx locally
2. GitHub Desktop → Commit "Update App.jsx" → Push
3. Vercel auto-deploys in ~15 seconds

---

## ROUTES:
/ → Landing Page
/login → Sign In
/register → Create Account
/pricing → Plans & Pricing
/recommendations → Research Calls (public, with paywall)
/performance → Performance Report
/dashboard → User Dashboard (protected)
/subscription → Manage Subscription (protected)
/admin → Admin Panel (admin only)
/about → About Us
/disclaimer → Disclaimer
/privacy → Privacy Policy
/terms → Terms of Service
/refund → Refund Policy
/grievance → Grievance Redressal
/sebi-disclosure → SEBI RA Disclosure

---

## SUPABASE TABLES CREATED:
- users (extends auth.users)
- plans (Free, Silver, Gold, Platinum pre-seeded)
- subscriptions
- recommendations (main content table)
- recommendation_updates (audit trail)
- payments
- notifications
- research_reports
- audit_logs
- disclosures
- watchlist
- portfolio

---

## RAZORPAY INTEGRATION (future step):
Create api/verify-payment.js (Edge Function on Vercel) 
same as Plan Our Future's verify-payment.js pattern.
