-- Expiry, archive and admin-approved official update review workflow.
-- Run after 20261020_universal_taxonomy_upgrade.sql.
create table if not exists public.official_update_proposals (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('jobs','content_items')),
  target_id uuid not null,
  target_title text not null default '',
  official_url text not null default '',
  proposed_changes jsonb not null default '{}'::jsonb,
  evidence_note text not null default '',
  source_checked_at timestamptz,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by text not null default '',
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists official_update_proposals_status_created_idx
  on public.official_update_proposals(status, created_at desc);
alter table public.official_update_proposals enable row level security;
drop policy if exists "admins read official update proposals" on public.official_update_proposals;
create policy "admins read official update proposals" on public.official_update_proposals
  for select to authenticated using (public.is_site_admin());
drop policy if exists "admins insert official update proposals" on public.official_update_proposals;
create policy "admins insert official update proposals" on public.official_update_proposals
  for insert to authenticated with check (public.is_site_admin());
drop policy if exists "admins update official update proposals" on public.official_update_proposals;
create policy "admins update official update proposals" on public.official_update_proposals
  for update to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
drop policy if exists "admins delete official update proposals" on public.official_update_proposals;
create policy "admins delete official update proposals" on public.official_update_proposals
  for delete to authenticated using (public.is_site_admin());

-- Record admin decisions and content changes for auditability.
create table if not exists public.content_change_audit (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('jobs','content_items')),
  target_id uuid not null,
  target_title text not null default '',
  action text not null,
  details jsonb not null default '{}'::jsonb,
  actor text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists content_change_audit_target_created_idx
  on public.content_change_audit(target_type, target_id, created_at desc);
alter table public.content_change_audit enable row level security;
drop policy if exists "admins read content change audit" on public.content_change_audit;
create policy "admins read content change audit" on public.content_change_audit
  for select to authenticated using (public.is_site_admin());
drop policy if exists "admins insert content change audit" on public.content_change_audit;
create policy "admins insert content change audit" on public.content_change_audit
  for insert to authenticated with check (public.is_site_admin());
