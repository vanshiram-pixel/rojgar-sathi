-- Rojgar Sathi: user accounts and personalized alert preferences.
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  state text not null default 'Rajasthan',
  qualification text not null default '',
  categories text[] not null default array['Rajasthan Govt Jobs']::text[],
  email_alerts boolean not null default true,
  alert_frequency text not null default 'daily' check (alert_frequency in ('instant','daily','weekly')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.user_profiles enable row level security;
drop policy if exists "users read own profile" on public.user_profiles;
create policy "users read own profile" on public.user_profiles for select to authenticated using (auth.uid() = user_id);
drop policy if exists "users insert own profile" on public.user_profiles;
create policy "users insert own profile" on public.user_profiles for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "users update own profile" on public.user_profiles;
create policy "users update own profile" on public.user_profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "users delete own profile" on public.user_profiles;
create policy "users delete own profile" on public.user_profiles for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.user_alert_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  channel text not null default 'email' check (channel in ('email')),
  sent_at timestamptz not null default now(),
  unique(user_id, job_id, channel)
);
alter table public.user_alert_log enable row level security;
drop policy if exists "users read own alert log" on public.user_alert_log;
create policy "users read own alert log" on public.user_alert_log for select to authenticated using (auth.uid() = user_id);
-- Sending alert records must be performed only by a trusted server/service role; no client insert policy.
