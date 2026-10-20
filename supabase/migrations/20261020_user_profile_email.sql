-- Store the verified account email for server-side personalized notifications.
alter table public.user_profiles add column if not exists email text not null default '';
create index if not exists user_profiles_alerts_idx on public.user_profiles(email_alerts, alert_frequency);
