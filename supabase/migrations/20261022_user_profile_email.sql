-- Keep the verified account email available for server-side email alerts.
-- Idempotent because this may be applied after a manual hotfix.
alter table public.user_profiles
  add column if not exists email text not null default '';

create index if not exists user_profiles_alerts_idx
  on public.user_profiles (email_alerts, alert_frequency);

-- Backfill existing profiles from Supabase Auth; do not trust a user-entered email.
update public.user_profiles as profile
set email = auth_user.email
from auth.users as auth_user
where profile.user_id = auth_user.id
  and coalesce(btrim(profile.email), '') = ''
  and coalesce(btrim(auth_user.email), '') <> '';
