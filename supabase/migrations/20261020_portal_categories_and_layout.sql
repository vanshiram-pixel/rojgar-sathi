-- Rojgar Sathi: configurable all-India categories and public layout controls.
-- Run this migration in Supabase SQL Editor after reviewing it.

alter table public.site_settings
  add column if not exists topbar_text text not null default 'रोज़गार, परीक्षा और छात्रवृत्ति की जानकारी',
  add column if not exists footer_text text not null default 'रोज़गार साथी — आधिकारिक नोटिफिकेशन पढ़कर ही आवेदन करें।',
  add column if not exists footer_links jsonb not null default '[{"label":"हमारे बारे में","href":"/about"},{"label":"संपर्क","href":"/contact"},{"label":"गोपनीयता नीति","href":"/privacy"},{"label":"अस्वीकरण","href":"/disclaimer"}]'::jsonb,
  add column if not exists header_style text not null default 'classic',
  add column if not exists footer_style text not null default 'columns',
  add column if not exists home_layout jsonb not null default '{"hero":"search","categories":"grid","latest":"list","sidebar":true}'::jsonb,
  add column if not exists custom_css text not null default '';

create table if not exists public.portal_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category_type text not null default 'content' check (category_type in ('content','state','exam','education','scheme','employment')),
  description text not null default '',
  parent_slug text not null default '',
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists portal_categories_active_order_idx on public.portal_categories(is_active, sort_order, name);
alter table public.portal_categories enable row level security;
drop policy if exists "public read active portal categories" on public.portal_categories;
create policy "public read active portal categories" on public.portal_categories for select to anon, authenticated using (is_active = true or public.is_site_admin());
drop policy if exists "admins insert portal categories" on public.portal_categories;
create policy "admins insert portal categories" on public.portal_categories for insert to authenticated with check (public.is_site_admin());
drop policy if exists "admins update portal categories" on public.portal_categories;
create policy "admins update portal categories" on public.portal_categories for update to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
drop policy if exists "admins delete portal categories" on public.portal_categories;
create policy "admins delete portal categories" on public.portal_categories for delete to authenticated using (public.is_site_admin());

insert into public.portal_categories (name, slug, category_type, description, sort_order) values
('Latest Jobs','latest-jobs','content','सभी नई भर्ती सूचनाएँ',1),
('Central Government Jobs','central-government-jobs','content','केंद्र सरकार और केंद्रीय संस्थान',2),
('State Government Jobs','state-government-jobs','content','राज्यवार सरकारी भर्तियाँ',3),
('Rajasthan Govt Jobs','rajasthan-govt-jobs','state','राजस्थान की सरकारी भर्तियाँ',4),
('Admit Card','admit-card','content','प्रवेश-पत्र और हॉल टिकट',5),
('Results','result','content','परीक्षा परिणाम',6),
('Answer Key','answer-key','content','उत्तर कुंजी और आपत्ति सूचना',7),
('Syllabus','syllabus','content','पाठ्यक्रम और परीक्षा पैटर्न',8),
('Exam Calendar','exam-calendar','content','परीक्षा कैलेंडर और कार्यक्रम',9),
('Admissions','admissions','education','प्रवेश और आवेदन',10),
('Scholarships','scholarship','education','छात्रवृत्ति योजनाएँ',11),
('University Updates','university-updates','education','विश्वविद्यालय और कॉलेज अपडेट',12),
('Board Exams','board-exams','education','स्कूल बोर्ड परीक्षा अपडेट',13),
('Government Schemes','government-schemes','scheme','केंद्र और राज्य की योजनाएँ',14),
('Apprenticeship','apprenticeship','employment','अप्रेंटिसशिप और प्रशिक्षण',15),
('Answer Objection','answer-objection','content','उत्तर कुंजी पर आपत्ति',16),
('Cut Off','cut-off','content','कटऑफ और मेरिट सूची',17),
('Previous Papers','previous-papers','education','पिछले वर्षों के प्रश्नपत्र',18),
('Result Merit List','merit-list','content','मेरिट सूची और चयन सूची',19),
('Private Jobs','private-jobs','employment','निजी क्षेत्र की नौकरियाँ',20),
('Internships','internships','employment','इंटर्नशिप और प्रशिक्षण अवसर',21),
('Career & Skill','career-skill','education','कौशल, करियर और रोजगार मार्गदर्शन',22)
on conflict (slug) do update set name=excluded.name, description=excluded.description, sort_order=excluded.sort_order;

-- Indian state/UT landing categories. These are navigational categories; publish verified jobs separately.
insert into public.portal_categories (name, slug, category_type, description, sort_order) values
('Andhra Pradesh','andhra-pradesh','state','आंध्र प्रदेश की भर्ती और परीक्षा अपडेट',101),
('Arunachal Pradesh','arunachal-pradesh','state','अरुणाचल प्रदेश की भर्ती और परीक्षा अपडेट',102),
('Assam','assam','state','असम की भर्ती और परीक्षा अपडेट',103),
('Bihar','bihar','state','बिहार की भर्ती और परीक्षा अपडेट',104),
('Chhattisgarh','chhattisgarh','state','छत्तीसगढ़ की भर्ती और परीक्षा अपडेट',105),
('Goa','goa','state','गोवा की भर्ती और परीक्षा अपडेट',106),
('Gujarat','gujarat','state','गुजरात की भर्ती और परीक्षा अपडेट',107),
('Haryana','haryana','state','हरियाणा की भर्ती और परीक्षा अपडेट',108),
('Himachal Pradesh','himachal-pradesh','state','हिमाचल प्रदेश की भर्ती और परीक्षा अपडेट',109),
('Jharkhand','jharkhand','state','झारखंड की भर्ती और परीक्षा अपडेट',110),
('Karnataka','karnataka','state','कर्नाटक की भर्ती और परीक्षा अपडेट',111),
('Kerala','kerala','state','केरल की भर्ती और परीक्षा अपडेट',112),
('Madhya Pradesh','madhya-pradesh','state','मध्य प्रदेश की भर्ती और परीक्षा अपडेट',113),
('Maharashtra','maharashtra','state','महाराष्ट्र की भर्ती और परीक्षा अपडेट',114),
('Manipur','manipur','state','मणिपुर की भर्ती और परीक्षा अपडेट',115),
('Meghalaya','meghalaya','state','मेघालय की भर्ती और परीक्षा अपडेट',116),
('Mizoram','mizoram','state','मिजोरम की भर्ती और परीक्षा अपडेट',117),
('Nagaland','nagaland','state','नागालैंड की भर्ती और परीक्षा अपडेट',118),
('Odisha','odisha','state','ओडिशा की भर्ती और परीक्षा अपडेट',119),
('Punjab','punjab','state','पंजाब की भर्ती और परीक्षा अपडेट',120),
('Rajasthan','rajasthan','state','राजस्थान की भर्ती और परीक्षा अपडेट',121),
('Sikkim','sikkim','state','सिक्किम की भर्ती और परीक्षा अपडेट',122),
('Tamil Nadu','tamil-nadu','state','तमिलनाडु की भर्ती और परीक्षा अपडेट',123),
('Telangana','telangana','state','तेलंगाना की भर्ती और परीक्षा अपडेट',124),
('Tripura','tripura','state','त्रिपुरा की भर्ती और परीक्षा अपडेट',125),
('Uttar Pradesh','uttar-pradesh','state','उत्तर प्रदेश की भर्ती और परीक्षा अपडेट',126),
('Uttarakhand','uttarakhand','state','उत्तराखंड की भर्ती और परीक्षा अपडेट',127),
('West Bengal','west-bengal','state','पश्चिम बंगाल की भर्ती और परीक्षा अपडेट',128),
('Andaman and Nicobar Islands','andaman-and-nicobar-islands','state','अंडमान और निकोबार द्वीपसमूह की भर्ती अपडेट',129),
('Chandigarh','chandigarh','state','चंडीगढ़ की भर्ती अपडेट',130),
('Dadra and Nagar Haveli and Daman and Diu','dadra-nagar-haveli-daman-diu','state','दादरा एवं नगर हवेली और दमन एवं दीव की भर्ती अपडेट',131),
('Delhi','delhi','state','दिल्ली की भर्ती और परीक्षा अपडेट',132),
('Jammu and Kashmir','jammu-and-kashmir','state','जम्मू-कश्मीर की भर्ती और परीक्षा अपडेट',133),
('Ladakh','ladakh','state','लद्दाख की भर्ती अपडेट',134),
('Lakshadweep','lakshadweep','state','लक्षद्वीप की भर्ती अपडेट',135),
('Puducherry','puducherry','state','पुदुचेरी की भर्ती अपडेट',136)
on conflict (slug) do update set name=excluded.name, description=excluded.description, sort_order=excluded.sort_order;
