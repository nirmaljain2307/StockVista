-- StockVista migration: Step 2-4 upgrade
-- Run this in Supabase SQL Editor (evynjctkqxbqkzniueqr.supabase.co project)

-- 1. New columns on recommendations
alter table recommendations
  add column if not exists exit_price numeric,
  add column if not exists commodity_type text,
  add column if not exists chart_url text,
  add column if not exists report_url text,
  add column if not exists expiry_at timestamptz;

-- 2. Migrate old status values to the new enum
update recommendations set status = 'live' where status = 'active';
update recommendations set status = 'closed' where status = 'updated';

-- 3. Migrate old plan_id values on users (from earlier Step 1 rename)
update users set plan_id = 'premium' where plan_id = 'silver';
update users set plan_id = 'fno' where plan_id = 'gold';
update users set plan_id = 'elite' where plan_id = 'platinum';
update users set plan_id = 'basic' where plan_id = 'free' or plan_id is null;

-- 4. Storage bucket for chart images and PDF reports
insert into storage.buckets (id, name, public)
values ('rec-media', 'rec-media', true)
on conflict (id) do nothing;

-- Public read policy (charts/reports are shown to entitled users client-side,
-- bucket itself is public so <img>/<a href> tags work without signed URLs)
create policy if not exists "Public read rec-media"
  on storage.objects for select
  using (bucket_id = 'rec-media');

-- Only admins can upload (adjust the is_admin check to match your users table)
create policy if not exists "Admin upload rec-media"
  on storage.objects for insert
  with check (
    bucket_id = 'rec-media'
    and exists (select 1 from users where id = auth.uid() and is_admin = true)
  );

create policy if not exists "Admin update rec-media"
  on storage.objects for update
  using (
    bucket_id = 'rec-media'
    and exists (select 1 from users where id = auth.uid() and is_admin = true)
  );
