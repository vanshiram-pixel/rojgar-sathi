-- Rojgar Sathi: department-wise discovery and richer recruitment metadata.
-- Run after the base schema and 20261020_portal_categories_and_layout.sql.

alter table public.portal_categories
  drop constraint if exists portal_categories_category_type_check;

alter table public.portal_categories
  add constraint portal_categories_category_type_check
  check (category_type in ('content','state','exam','education','scheme','employment','department','qualification'));

alter table public.jobs
  add column if not exists department text not null default '',
  add column if not exists recruitment_type text not null default 'सरकारी नौकरी',
  add column if not exists age_limit text not null default '',
  add column if not exists application_fee text not null default '',
  add column if not exists salary text not null default '',
  add column if not exists selection_process text not null default '',
  add column if not exists official_source text not null default '',
  add column if not exists last_verified_at timestamptz,
  add column if not exists valid_through date;

create index if not exists jobs_department_status_created_idx
  on public.jobs (department, status, created_at desc);
create index if not exists jobs_location_status_created_idx
  on public.jobs (location, status, created_at desc);
create index if not exists jobs_valid_through_idx
  on public.jobs (valid_through);

insert into public.portal_categories (name, slug, category_type, description, parent_slug, sort_order) values
('Defence Jobs','defence-jobs','department','Army, Navy, Air Force, Coast Guard, DRDO and defence civilian recruitment.','',201),
('Police & Paramilitary','police-paramilitary-jobs','department','Police, CAPF, constable, SI, ASI, inspector and force recruitment.','',202),
('Railway Jobs','railway-jobs','department','RRB/RRC recruitment including NTPC, ALP, Technician, Group D and apprentices.','',203),
('Teaching & Education Jobs','teaching-jobs','department','School teachers, lecturers, professors, TET and education department posts.','',204),
('Banking & Insurance','banking-insurance-jobs','department','Public-sector banks, RBI, insurance companies and financial institutions.','',205),
('SSC & Staff Selection','ssc-staff-selection-jobs','department','SSC and staff selection examinations, CGL, CHSL, MTS, Stenographer and related posts.','',206),
('UPSC & Civil Services','upsc-civil-services-jobs','department','UPSC civil services, NDA, CDS, CAPF, engineering and other commission examinations.','',207),
('State PSC & Commissions','state-psc-jobs','department','RPSC and other state public service commissions and recruitment boards.','',208),
('Health & Medical','health-medical-jobs','department','Doctors, nurses, pharmacists, technicians, public health and hospital recruitment.','',209),
('Engineering & Technical','engineering-technical-jobs','department','Engineering, IT, science, technician, operator and technical posts.','',210),
('Courts & Judiciary','court-judiciary-jobs','department','Supreme Court, High Courts, district courts, judicial services and court staff.','',211),
('Agriculture & Animal Husbandry','agriculture-animal-husbandry-jobs','department','Agriculture, horticulture, veterinary, livestock and rural development posts.','',212),
('PSU & Government Companies','psu-government-company-jobs','department','Public sector undertakings, energy, oil, mining, power and government companies.','',213),
('Local Bodies & District Jobs','local-body-district-jobs','department','Municipal bodies, district offices, panchayats and local government recruitment.','',214),
('Apprenticeship & Internship','apprenticeship-internship-jobs','department','Trade apprenticeships, graduate apprenticeships and internship opportunities.','',215),
('8th Pass Jobs','8th-pass-jobs','qualification','Recruitments accepting 8th-pass qualification; always check the notification.','',301),
('10th Pass Jobs','10th-pass-jobs','qualification','Recruitments accepting 10th-pass qualification; always check the notification.','',302),
('12th Pass Jobs','12th-pass-jobs','qualification','Recruitments accepting 12th-pass qualification; always check the notification.','',303),
('ITI Jobs','iti-jobs','qualification','ITI and trade-certificate eligible recruitment.','',304),
('Diploma Jobs','diploma-jobs','qualification','Diploma-level technical and non-technical recruitment.','',305),
('Graduate Jobs','graduate-jobs','qualification','Recruitments requiring a bachelor degree or equivalent.','',306),
('Postgraduate Jobs','postgraduate-jobs','qualification','Recruitments requiring postgraduate qualifications.','',307),
('Professional & Specialist Jobs','professional-specialist-jobs','qualification','Specialist roles requiring professional or regulated qualifications.','',308)
on conflict (slug) do update set
  name=excluded.name,
  category_type=excluded.category_type,
  description=excluded.description,
  parent_slug=excluded.parent_slug,
  sort_order=excluded.sort_order,
  is_active=true;
