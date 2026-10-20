-- Rojgar Sathi content hub: verified scholarships, government schemes, admissions and exam updates.
-- Run once in Supabase SQL Editor after the existing portal category migrations.

alter table public.jobs
  add column if not exists image_url text not null default '';

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content_type text not null check (content_type in ('scholarship','scheme','admission','university_update','admit_card','result','answer_key','exam_update','employment_update')),
  government_level text not null default 'central' check (government_level in ('central','state','university','district','private')),
  state_name text not null default '',
  department text not null default '',
  summary text not null default '',
  body text not null default '',
  eligibility text not null default '',
  benefits text not null default '',
  required_documents text not null default '',
  application_start date,
  application_end date,
  official_url text not null default '',
  notification_url text not null default '',
  image_url text not null default '',
  category_slugs text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  featured boolean not null default false,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_items_type_status_idx
  on public.content_items (content_type, status, created_at desc);
create index if not exists content_items_level_state_idx
  on public.content_items (government_level, state_name, status);
create index if not exists content_items_dates_idx
  on public.content_items (application_end);
create index if not exists content_items_category_slugs_gin_idx
  on public.content_items using gin (category_slugs);

alter table public.content_items enable row level security;
drop policy if exists "public read published content items" on public.content_items;
create policy "public read published content items" on public.content_items
  for select to anon, authenticated using (status = 'published' or public.is_site_admin());
drop policy if exists "admins insert content items" on public.content_items;
create policy "admins insert content items" on public.content_items
  for insert to authenticated with check (public.is_site_admin());
drop policy if exists "admins update content items" on public.content_items;
create policy "admins update content items" on public.content_items
  for update to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
drop policy if exists "admins delete content items" on public.content_items;
create policy "admins delete content items" on public.content_items
  for delete to authenticated using (public.is_site_admin());

insert into public.portal_categories (name, slug, category_type, description, parent_slug, sort_order, is_active)
values
  ('Scholarships & Student Aid', 'scholarship', 'education', 'छात्रवृत्ति, फीस सहायता और विद्यार्थी लाभ की सत्यापित सूचनाएँ', '', 10, true),
  ('Government Schemes', 'government-schemes', 'scheme', 'केंद्र और राज्य सरकार की योजनाएँ, पात्रता, लाभ और आवेदन लिंक', '', 11, true),
  ('Admissions', 'admissions', 'education', 'कॉलेज, विश्वविद्यालय और अन्य प्रवेश सूचनाएँ', '', 12, true),
  ('University Updates', 'university-updates', 'education', 'विश्वविद्यालय, कॉलेज, परीक्षा और परिणाम अपडेट', '', 13, true),
  ('Exam Updates', 'exam-updates', 'exam', 'परीक्षा तिथि, कैलेंडर और आधिकारिक परीक्षा सूचनाएँ', '', 14, true)
on conflict (slug) do update set
  name = excluded.name,
  category_type = excluded.category_type,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true;

-- Public image reads; uploads are restricted to authenticated site admins.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('content-images', 'content-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "public read content images" on storage.objects;
create policy "public read content images" on storage.objects
  for select to anon, authenticated using (bucket_id = 'content-images');
drop policy if exists "admins upload content images" on storage.objects;
create policy "admins upload content images" on storage.objects
  for insert to authenticated with check (bucket_id = 'content-images' and public.is_site_admin());
drop policy if exists "admins update content images" on storage.objects;
create policy "admins update content images" on storage.objects
  for update to authenticated using (bucket_id = 'content-images' and public.is_site_admin())
  with check (bucket_id = 'content-images' and public.is_site_admin());
drop policy if exists "admins delete content images" on storage.objects;
create policy "admins delete content images" on storage.objects
  for delete to authenticated using (bucket_id = 'content-images' and public.is_site_admin());

-- Verified active scholarship notices checked on 2026-10-20 against the National Scholarship Portal.
-- These are live notices, not sample/demo records. Re-check the official portal before reposting after the deadline.
insert into public.content_items
  (title, slug, content_type, government_level, state_name, department, summary, body, eligibility, benefits,
   required_documents, application_start, application_end, official_url, notification_url, category_slugs,
   status, featured, last_verified_at)
values
  (
    'PM-USP CSSS Scholarship 2026-27 — Renewal Applications',
    'pm-usp-csss-renewal-2026-27',
    'scholarship', 'central', '', 'Ministry of Education',
    'राष्ट्रीय छात्रवृत्ति पोर्टल पर PM-USP Central Sector Scheme of Scholarship for College and University Students की renewal application 31 अक्टूबर 2026 तक खुली बताई गई है।',
    'राष्ट्रीय छात्रवृत्ति पोर्टल के Academic Year 2026-27 announcements के अनुसार renewal आवेदन की अंतिम तिथि 31-10-2026 है। Institute verification की अंतिम तिथि 15-11-2026 और L2 verification की अंतिम तिथि 30-11-2026 बताई गई है। यह पोस्ट केवल renewal आवेदन के लिए है; fresh application की स्थिति और पात्रता आधिकारिक पोर्टल पर जाँचें।',
    'यह renewal आवेदन उन विद्यार्थियों के लिए है जो संबंधित योजना की मौजूदा पात्रता और renewal शर्तें पूरी करते हैं। पात्रता, शैक्षणिक प्रदर्शन, दस्तावेज़ और अन्य शर्तें आधिकारिक योजना निर्देशों से सत्यापित करें।',
    'योजना के अनुसार पात्र विद्यार्थियों को छात्रवृत्ति सहायता; राशि और पात्रता आधिकारिक निर्देशों के अधीन।',
    'पिछले आवेदन/OTR विवरण, शैक्षणिक प्रमाण, बैंक और अन्य दस्तावेज़ जो आधिकारिक आवेदन पोर्टल माँगे।',
    '2026-06-01', '2026-10-31',
    'https://scholarships.gov.in/Students', 'https://scholarships.gov.in/',
    array['scholarship','university-updates'], 'published', true, '2026-10-20T00:00:00Z'
  ),
  (
    'PM-USP Special Scholarship Scheme for J&K and Ladakh — Renewal 2026-27',
    'pm-usp-special-scholarship-jk-ladakh-renewal-2026-27',
    'scholarship', 'central', 'Jammu and Kashmir', 'Ministry of Education',
    'National Scholarship Portal के अनुसार PM-USP Special Scholarship Scheme for Jammu Kashmir and Ladakh की renewal application की अंतिम तिथि 31 अक्टूबर 2026 है।',
    'National Scholarship Portal के Academic Year 2026-27 announcement में renewal application 31-10-2026 तक खुली बताई गई है। Institute verification की अंतिम तिथि 15-11-2026 और L2 verification की अंतिम तिथि 30-11-2026 है। Fresh application, पात्रता और लागू क्षेत्र की स्थिति आधिकारिक पोर्टल पर जाँचें।',
    'जम्मू-कश्मीर और लद्दाख के पात्र विद्यार्थियों के लिए योजना-विशिष्ट renewal शर्तें लागू होंगी। अंतिम पात्रता और दस्तावेज़ आधिकारिक दिशा-निर्देश से जाँचें।',
    'योजना के नियमों के अनुसार छात्रवृत्ति सहायता; लाभ और राशि आधिकारिक योजना दिशानिर्देशों के अधीन।',
    'OTR, पिछली आवेदन जानकारी, शैक्षणिक प्रमाण और पोर्टल द्वारा माँगे गए दस्तावेज़।',
    '2026-06-01', '2026-10-31',
    'https://scholarships.gov.in/Students', 'https://scholarships.gov.in/All-Scholarships',
    array['scholarship','jammu-and-kashmir'], 'published', true, '2026-10-20T00:00:00Z'
  ),
  (
    'PM Scholarship Scheme for Wards of Martyred Police Personnel — 2026-27',
    'pm-scholarship-martyred-police-personnel-2026-27',
    'scholarship', 'central', '', 'Ministry of Home Affairs',
    'National Scholarship Portal पर इस merit-based scholarship के लिए आवेदन 31 अक्टूबर 2026 तक खुला दिखाया गया है।',
    'National Scholarship Portal की 2026-27 scholarship listing के अनुसार scheme open date 01-06-2026 और student application deadline 31-10-2026 है। Defective application और institute verification की deadline 15-11-2026 तथा DNO/SNO/MNO verification की deadline 30-11-2026 दिखाई गई है। पात्रता और आवश्यक सेवा/शहादत प्रमाणपत्र आधिकारिक scheme guidelines से जाँचें।',
    'राज्य/केंद्रशासित प्रदेश पुलिस कर्मियों के उन पात्र आश्रितों के लिए जिनकी मृत्यु आतंकवादी/नक्सली हमले में हुई हो; विस्तृत पात्रता और अपवाद आधिकारिक दिशा-निर्देशों के अनुसार।',
    'छात्रवृत्ति सहायता योजना-निर्देशों के अनुसार; राशि और नवीनीकरण नियम आधिकारिक पोर्टल पर जाँचें।',
    'पात्रता प्रमाणपत्र, शैक्षणिक रिकॉर्ड, बैंक विवरण और पोर्टल द्वारा माँगे गए अन्य दस्तावेज़।',
    '2026-06-01', '2026-10-31',
    'https://scholarships.gov.in/All-Scholarships', 'https://scholarships.gov.in/',
    array['scholarship'], 'published', true, '2026-10-20T00:00:00Z'
  )
on conflict (slug) do update set
  title=excluded.title,
  summary=excluded.summary,
  body=excluded.body,
  eligibility=excluded.eligibility,
  benefits=excluded.benefits,
  required_documents=excluded.required_documents,
  application_start=excluded.application_start,
  application_end=excluded.application_end,
  official_url=excluded.official_url,
  notification_url=excluded.notification_url,
  category_slugs=excluded.category_slugs,
  status=excluded.status,
  featured=excluded.featured,
  last_verified_at=excluded.last_verified_at,
  updated_at=now();
