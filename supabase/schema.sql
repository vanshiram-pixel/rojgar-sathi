create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  brand_name text not null default 'Rojgar Sathi',
  tagline text not null default 'सरकारी नौकरी और करियर की सही जानकारी',
  logo_url text not null default '/rojgar-sathi-logo.svg',
  favicon_url text not null default '',
  splash_image_url text not null default '',
  splash_title text not null default 'Rojgar Sathi',
  splash_subtitle text not null default 'आपके भविष्य की सही शुरुआत',
  primary_color text not null default '#155eef',
  accent_color text not null default '#12b981',
  background_color text not null default '#f5f7fb',
  theme_mode text not null default 'light' check (theme_mode in ('light','dark','system')),
  font_family text not null default 'system',
  layout_preset text not null default 'modern' check (layout_preset in ('modern','compact','editorial')),
  home_hero_title text not null default 'अपनी अगली नौकरी यहाँ खोजें',
  home_hero_subtitle text not null default 'सरकारी भर्ती, एडमिट कार्ड, रिजल्ट और छात्रवृत्ति अपडेट',
  show_latest_jobs boolean not null default true,
  show_admission boolean not null default true,
  show_scholarships boolean not null default true,
  show_schemes boolean not null default true,
  navigation jsonb not null default '[{"label":"सरकारी नौकरी","href":"/jobs"},{"label":"एडमिट कार्ड","href":"/category/admit-card"},{"label":"रिजल्ट","href":"/category/result"},{"label":"स्कॉलरशिप","href":"/category/scholarship"}]'::jsonb,
  seo_title text not null default 'Rojgar Sathi | सरकारी नौकरी',
  seo_description text not null default 'सरकारी नौकरी, भर्ती, एडमिट कार्ड, रिजल्ट और स्कॉलरशिप की जानकारी।',
  ads_enabled boolean not null default false,
  adsense_client text not null default '',
  ad_slot_home text not null default '',
  ad_slot_job text not null default '',
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organization text not null default '',
  category text not null default 'सरकारी नौकरी',
  location text not null default 'भारत',
  vacancies text not null default '',
  qualification text not null default '',
  application_start date,
  application_end date,
  exam_date date,
  official_url text not null default '',
  notification_url text not null default '',
  description text not null default '',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists jobs_status_date_idx on public.jobs(status, application_end desc);
create index if not exists jobs_category_idx on public.jobs(category);

alter table public.admin_users enable row level security;
alter table public.site_settings enable row level security;
alter table public.jobs enable row level security;

create or replace function public.is_site_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admin_users where user_id = auth.uid()); $$;

drop policy if exists "admins read own admin record" on public.admin_users;
create policy "admins read own admin record" on public.admin_users for select to authenticated using (user_id = auth.uid());
drop policy if exists "public can read site settings" on public.site_settings;
create policy "public can read site settings" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "admins update site settings" on public.site_settings;
create policy "admins update site settings" on public.site_settings for update to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
drop policy if exists "admins insert site settings" on public.site_settings;
create policy "admins insert site settings" on public.site_settings for insert to authenticated with check (public.is_site_admin());

drop policy if exists "public read published jobs" on public.jobs;
create policy "public read published jobs" on public.jobs for select to anon, authenticated using (status = 'published' or public.is_site_admin());
drop policy if exists "admins insert jobs" on public.jobs;
create policy "admins insert jobs" on public.jobs for insert to authenticated with check (public.is_site_admin());
drop policy if exists "admins update jobs" on public.jobs;
create policy "admins update jobs" on public.jobs for update to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
drop policy if exists "admins delete jobs" on public.jobs;
create policy "admins delete jobs" on public.jobs for delete to authenticated using (public.is_site_admin());

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists jobs_touch_updated_at on public.jobs;
create trigger jobs_touch_updated_at before update on public.jobs for each row execute function public.touch_updated_at();
drop trigger if exists settings_touch_updated_at on public.site_settings;
create trigger settings_touch_updated_at before update on public.site_settings for each row execute function public.touch_updated_at();

-- Optional public storage bucket for brand assets. For production, use strict file type/size rules.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('brand-assets','brand-assets',true,5242880,array['image/png','image/jpeg','image/webp','image/svg+xml','image/x-icon'])
on conflict (id) do nothing;
drop policy if exists "public read brand assets" on storage.objects;
create policy "public read brand assets" on storage.objects for select using (bucket_id = 'brand-assets');
drop policy if exists "admins upload brand assets" on storage.objects;
create policy "admins upload brand assets" on storage.objects for insert to authenticated with check (bucket_id = 'brand-assets' and public.is_site_admin());
drop policy if exists "admins update brand assets" on storage.objects;
create policy "admins update brand assets" on storage.objects for update to authenticated using (bucket_id = 'brand-assets' and public.is_site_admin()) with check (bucket_id = 'brand-assets' and public.is_site_admin());
drop policy if exists "admins delete brand assets" on storage.objects;
create policy "admins delete brand assets" on storage.objects for delete to authenticated using (bucket_id = 'brand-assets' and public.is_site_admin());
