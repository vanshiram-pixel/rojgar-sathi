-- Rojgar Sathi canonical branding migration.
-- Run once in the Supabase SQL Editor after the current schema/migrations.
-- This updates existing site settings without changing uploaded custom assets.
update public.site_settings
set
  brand_name = 'Rojgar Sathi',
  splash_title = case when lower(trim(coalesce(splash_title, ''))) in ('updated rojgar', 'rojgar sathi') then 'Rojgar Sathi' else splash_title end,
  seo_title = case when lower(trim(coalesce(seo_title, ''))) like 'updated rojgar%' then regexp_replace(seo_title, '^Updated[[:space:]]+Rojgar', 'Rojgar Sathi', 'i') else coalesce(nullif(seo_title, ''), 'Rojgar Sathi | सरकारी नौकरी') end,
  logo_url = case when coalesce(trim(logo_url), '') = '' then '/rojgar-sathi-logo.svg' else logo_url end,
  updated_at = now()
where id = 1;

-- Keep database defaults aligned for future fresh installs.
alter table public.site_settings alter column brand_name set default 'Rojgar Sathi';
alter table public.site_settings alter column splash_title set default 'Rojgar Sathi';
alter table public.site_settings alter column seo_title set default 'Rojgar Sathi | सरकारी नौकरी';
alter table public.site_settings alter column logo_url set default '/rojgar-sathi-logo.svg';
