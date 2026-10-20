-- User contact preferences for WhatsApp notifications (safe to run more than once).
alter table public.user_profiles
  add column if not exists phone_number text,
  add column if not exists whatsapp_notifications boolean not null default false,\n  add column if not exists whatsapp_opt_in boolean not null default false,\n  add column if not exists whatsapp_alerts boolean not null default false,
  add column if not exists whatsapp_verified_at timestamptz;

comment on column public.user_profiles.phone_number is 'User-provided phone number in international format; do not treat as verified without OTP.';
comment on column public.user_profiles.whatsapp_notifications is 'Explicit opt-in for WhatsApp notifications.';\ncomment on column public.user_profiles.whatsapp_opt_in is 'User consent to receive WhatsApp notifications.';\ncomment on column public.user_profiles.whatsapp_alerts is 'Whether WhatsApp alerts are enabled for this profile.';
comment on column public.user_profiles.whatsapp_verified_at is 'Set only after successful phone ownership verification.';
