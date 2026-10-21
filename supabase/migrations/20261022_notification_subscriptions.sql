-- Guest notification subscriptions. No public user account is required.
create table if not exists public.notification_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text,
  phone text,
  email_enabled boolean not null default false,
  whatsapp_enabled boolean not null default false,
  browser_enabled boolean not null default false,
  consent boolean not null default false,
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_active boolean not null default true,
  constraint notification_subscription_contact check (email is not null or phone is not null)
);
create unique index if not exists notification_subscriptions_email_unique
  on public.notification_subscriptions (lower(email)) where email is not null;
create unique index if not exists notification_subscriptions_phone_unique
  on public.notification_subscriptions (phone) where phone is not null;
alter table public.notification_subscriptions enable row level security;
-- Public visitors can submit consented subscriptions; they cannot read, update, or delete subscribers.
drop policy if exists "guest can subscribe to alerts" on public.notification_subscriptions;
create policy "guest can subscribe to alerts" on public.notification_subscriptions
  for insert to anon, authenticated
  with check (
    consent = true
    and ((email_enabled = true and email is not null) or (whatsapp_enabled = true and phone is not null) or browser_enabled = true)
  );
-- Only authenticated admin users should be granted read/update access by a separate admin policy.
comment on table public.notification_subscriptions is 'Guest opt-in preferences. Delivery providers and unsubscribe workflow must be configured before sending messages.';
