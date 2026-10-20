-- Rojgar Sathi universal taxonomy upgrade (idempotent).
-- Run this AFTER the previous portal/category/content migrations.
-- One record can power global latest lists, type-specific lists, state pages and department pages.

alter table public.portal_categories
  drop constraint if exists portal_categories_category_type_check;
alter table public.portal_categories
  add constraint portal_categories_category_type_check
  check (category_type in ('content','state','exam','education','scheme','employment','department','qualification'));

alter table public.jobs
  add column if not exists state_slug text not null default '',
  add column if not exists department_slug text not null default '',
  add column if not exists primary_category_slug text not null default '';

alter table public.content_items
  add column if not exists state_slug text not null default '',
  add column if not exists department_slug text not null default '',
  add column if not exists primary_category_slug text not null default '';

create index if not exists jobs_state_slug_status_created_idx
  on public.jobs (state_slug, status, created_at desc);
create index if not exists jobs_department_slug_status_created_idx
  on public.jobs (department_slug, status, created_at desc);
create index if not exists jobs_primary_category_slug_status_created_idx
  on public.jobs (primary_category_slug, status, created_at desc);
create index if not exists content_items_state_slug_status_created_idx
  on public.content_items (state_slug, status, created_at desc);
create index if not exists content_items_department_slug_status_created_idx
  on public.content_items (department_slug, status, created_at desc);
create index if not exists content_items_primary_category_slug_status_created_idx
  on public.content_items (primary_category_slug, status, created_at desc);

-- Canonical content-type landing pages. These are navigation taxonomy, not fabricated posts.
insert into public.portal_categories
  (name, slug, category_type, description, parent_slug, sort_order, is_active)
values
  ('Latest Notifications', 'latest-notifications', 'content', 'सभी प्रकार की नवीनतम आधिकारिक सूचनाएँ', '', 6, true),
  ('Latest Admit Cards', 'latest-admit-cards', 'content', 'सभी राज्यों और विभागों के नवीनतम प्रवेश-पत्र', '', 7, true),
  ('Latest Results', 'latest-results', 'content', 'सभी राज्यों और विभागों के नवीनतम परिणाम', '', 8, true),
  ('Latest Answer Keys', 'latest-answer-keys', 'content', 'सभी परीक्षाओं की नवीनतम उत्तर कुंजियाँ', '', 9, true),
  ('Latest Scholarships', 'latest-scholarships', 'education', 'केंद्र और राज्य की छात्रवृत्तियों की साझा नवीनतम सूची', '', 10, true),
  ('Latest Government Schemes', 'latest-government-schemes', 'scheme', 'केंद्र और राज्य की सरकारी योजनाओं की साझा नवीनतम सूची', '', 11, true),
  ('Central Government Updates', 'central-government-updates', 'content', 'केंद्र सरकार से जुड़ी भर्ती, परीक्षा, योजना और अन्य सूचनाएँ', '', 12, true),
  ('State Government Updates', 'state-government-updates', 'content', 'सभी राज्यों की भर्ती, परीक्षा, योजना और अन्य सूचनाएँ', '', 13, true)
on conflict (slug) do update set
  name = excluded.name,
  category_type = excluded.category_type,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true;

-- Preserve legacy values; do not guess state/department slugs from free-text values.
-- Admin forms should store canonical state_slug and department_slug for new/edited records.
