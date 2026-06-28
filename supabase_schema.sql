-- ============================================================
-- STOCK RESEARCH PLATFORM - SUPABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. USERS (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  email text unique not null,
  mobile text,
  plan_id text default 'free',
  plan_expires_at timestamptz,
  is_admin boolean default false,
  risk_accepted boolean default false,
  risk_accepted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.users enable row level security;
create policy "Users can read own data" on public.users for select using (auth.uid() = id);
create policy "Users can update own data" on public.users for update using (auth.uid() = id);
create policy "Admin full access users" on public.users for all using (
  exists (select 1 from public.users where id = auth.uid() and is_admin = true)
);

-- 2. PLANS
create table public.plans (
  id text primary key,
  name text not null,
  description text,
  price_monthly numeric(10,2) default 0,
  price_quarterly numeric(10,2),
  price_halfyearly numeric(10,2),
  price_yearly numeric(10,2),
  price_lifetime numeric(10,2),
  features jsonb,
  segments text[], -- ['equity','fno','intraday','options']
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);
alter table public.plans enable row level security;
create policy "Anyone can read plans" on public.plans for select using (true);
create policy "Admin can manage plans" on public.plans for all using (
  exists (select 1 from public.users where id = auth.uid() and is_admin = true)
);

-- Insert default plans
insert into public.plans (id, name, description, price_monthly, price_quarterly, price_halfyearly, price_yearly, segments, features, sort_order) values
('free', 'Free', 'Basic access for beginners', 0, 0, 0, 0, ARRAY['equity'], '{"basic_recommendations":true,"market_updates":true,"blog_access":true,"equity_recommendations":false,"fno_recommendations":false,"intraday_calls":false,"options_strategies":false,"ipo_recommendations":false,"telegram_signals":false,"priority_support":false,"one_on_one":false}', 0),
('silver', 'Silver', 'Perfect for beginners starting their trading journey', 999, 2697, 5094, 8991, ARRAY['equity'], '{"basic_recommendations":true,"market_updates":true,"blog_access":true,"equity_recommendations":true,"fno_recommendations":false,"intraday_calls":false,"options_strategies":false,"ipo_recommendations":false,"telegram_signals":false,"priority_support":false,"one_on_one":false}', 1),
('gold', 'Gold', 'Most popular for active traders', 2499, 6747, 12744, 22491, ARRAY['equity','fno','intraday'], '{"basic_recommendations":true,"market_updates":true,"blog_access":true,"equity_recommendations":true,"fno_recommendations":true,"intraday_calls":true,"options_strategies":false,"ipo_recommendations":true,"telegram_signals":false,"priority_support":true,"one_on_one":false}', 2),
('platinum', 'Platinum', 'Complete solution for serious investors', 4999, 13497, 25494, 44991, ARRAY['equity','fno','intraday','options'], '{"basic_recommendations":true,"market_updates":true,"blog_access":true,"equity_recommendations":true,"fno_recommendations":true,"intraday_calls":true,"options_strategies":true,"ipo_recommendations":true,"telegram_signals":true,"priority_support":true,"one_on_one":true}', 3);

-- 3. SUBSCRIPTIONS
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  plan_id text references public.plans(id),
  billing_cycle text check (billing_cycle in ('monthly','quarterly','halfyearly','yearly','lifetime')),
  amount_paid numeric(10,2),
  starts_at timestamptz default now(),
  expires_at timestamptz,
  status text default 'active' check (status in ('active','expired','cancelled','pending')),
  payment_id text,
  razorpay_order_id text,
  created_at timestamptz default now()
);
alter table public.subscriptions enable row level security;
create policy "Users read own subscriptions" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Admin full access subscriptions" on public.subscriptions for all using (
  exists (select 1 from public.users where id = auth.uid() and is_admin = true)
);

-- 4. RECOMMENDATIONS
create table public.recommendations (
  id uuid default gen_random_uuid() primary key,
  stock_name text not null,
  symbol text not null,
  exchange text check (exchange in ('NSE','BSE','MCX')) default 'NSE',
  segment text check (segment in ('equity','futures','options','commodity')) default 'equity',
  action text check (action in ('BUY','SELL','HOLD','AVOID','EXIT')) not null,
  entry_price numeric(12,2),
  target1 numeric(12,2),
  target2 numeric(12,2),
  target3 numeric(12,2),
  stop_loss numeric(12,2),
  cmp numeric(12,2),
  lot_size int default 1,
  time_horizon text check (time_horizon in ('intraday','swing','positional','longterm')) default 'swing',
  risk_level text check (risk_level in ('low','medium','high')) default 'medium',
  conviction text check (conviction in ('low','medium','high')) default 'medium',
  rationale text,
  technical_notes text,
  fundamental_notes text,
  chart_image_url text,
  plan_required text references public.plans(id) default 'silver',
  status text check (status in ('active','closed','target_hit','sl_hit','expired','updated')) default 'active',
  exit_price numeric(12,2),
  exit_date timestamptz,
  exit_reason text,
  published_at timestamptz default now(),
  closed_at timestamptz,
  created_by uuid references public.users(id),
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);
alter table public.recommendations enable row level security;
create policy "Users read recommendations by plan" on public.recommendations for select using (
  status = 'active' and (
    plan_required = 'free' or
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
      and u.plan_expires_at > now()
      and (
        (plan_required = 'silver' and u.plan_id in ('silver','gold','platinum')) or
        (plan_required = 'gold' and u.plan_id in ('gold','platinum')) or
        (plan_required = 'platinum' and u.plan_id = 'platinum')
      )
    ) or
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  )
);
create policy "Admin manage recommendations" on public.recommendations for all using (
  exists (select 1 from public.users where id = auth.uid() and is_admin = true)
);

-- 5. RECOMMENDATION UPDATES (audit trail)
create table public.recommendation_updates (
  id uuid default gen_random_uuid() primary key,
  recommendation_id uuid references public.recommendations(id) on delete cascade,
  updated_by uuid references public.users(id),
  change_type text, -- 'status_change','price_update','note_added'
  old_values jsonb,
  new_values jsonb,
  note text,
  created_at timestamptz default now()
);
alter table public.recommendation_updates enable row level security;
create policy "Admin read updates" on public.recommendation_updates for all using (
  exists (select 1 from public.users where id = auth.uid() and is_admin = true)
);

-- 6. PAYMENTS
create table public.payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id),
  plan_id text references public.plans(id),
  billing_cycle text,
  amount numeric(10,2),
  currency text default 'INR',
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  status text default 'pending' check (status in ('pending','success','failed','refunded')),
  created_at timestamptz default now()
);
alter table public.payments enable row level security;
create policy "Users read own payments" on public.payments for select using (auth.uid() = user_id);
create policy "Admin full access payments" on public.payments for all using (
  exists (select 1 from public.users where id = auth.uid() and is_admin = true)
);

-- 7. NOTIFICATIONS
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id),
  title text not null,
  message text,
  type text check (type in ('recommendation','target','sl','subscription','general')) default 'general',
  is_read boolean default false,
  recommendation_id uuid references public.recommendations(id),
  created_at timestamptz default now()
);
alter table public.notifications enable row level security;
create policy "Users read own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users update own notifications" on public.notifications for update using (auth.uid() = user_id);
create policy "Admin manage notifications" on public.notifications for all using (
  exists (select 1 from public.users where id = auth.uid() and is_admin = true)
);

-- 8. RESEARCH REPORTS
create table public.research_reports (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  file_url text,
  plan_required text references public.plans(id) default 'silver',
  published_at timestamptz default now(),
  created_by uuid references public.users(id),
  created_at timestamptz default now()
);
alter table public.research_reports enable row level security;
create policy "Users read reports by plan" on public.research_reports for select using (
  exists (
    select 1 from public.users u where u.id = auth.uid()
    and (
      plan_required = 'free' or
      (u.plan_id in ('silver','gold','platinum') and u.plan_expires_at > now())
    )
  ) or exists (select 1 from public.users where id = auth.uid() and is_admin = true)
);
create policy "Admin manage reports" on public.research_reports for all using (
  exists (select 1 from public.users where id = auth.uid() and is_admin = true)
);

-- 9. AUDIT LOGS
create table public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id),
  action text not null,
  entity_type text, -- 'recommendation','user','subscription'
  entity_id text,
  details jsonb,
  ip_address text,
  created_at timestamptz default now()
);
alter table public.audit_logs enable row level security;
create policy "Admin read audit logs" on public.audit_logs for select using (
  exists (select 1 from public.users where id = auth.uid() and is_admin = true)
);
create policy "System insert audit logs" on public.audit_logs for insert with check (true);

-- 10. DISCLOSURES
create table public.disclosures (
  id uuid default gen_random_uuid() primary key,
  type text, -- 'conflict_of_interest','sebi_registration','grievance'
  content text,
  updated_at timestamptz default now(),
  updated_by uuid references public.users(id)
);
alter table public.disclosures enable row level security;
create policy "Anyone read disclosures" on public.disclosures for select using (true);
create policy "Admin manage disclosures" on public.disclosures for all using (
  exists (select 1 from public.users where id = auth.uid() and is_admin = true)
);

-- 11. WATCHLIST
create table public.watchlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  symbol text not null,
  stock_name text,
  exchange text default 'NSE',
  added_at timestamptz default now(),
  unique(user_id, symbol)
);
alter table public.watchlist enable row level security;
create policy "Users manage own watchlist" on public.watchlist for all using (auth.uid() = user_id);

-- 12. PORTFOLIO
create table public.portfolio (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  symbol text not null,
  stock_name text,
  exchange text default 'NSE',
  quantity numeric(10,2),
  buy_price numeric(12,2),
  buy_date date,
  segment text default 'equity',
  created_at timestamptz default now()
);
alter table public.portfolio enable row level security;
create policy "Users manage own portfolio" on public.portfolio for all using (auth.uid() = user_id);

-- Trigger: auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger: updated_at auto-update
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_users_updated_at before update on public.users
  for each row execute procedure public.set_updated_at();
create trigger set_rec_updated_at before update on public.recommendations
  for each row execute procedure public.set_updated_at();
