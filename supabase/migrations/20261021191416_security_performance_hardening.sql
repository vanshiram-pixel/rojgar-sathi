-- Security and performance hardening for Rojgar Sathi.
-- Idempotent, additive changes only; no user content is deleted.

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog, public, pg_temp
as $function$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  );
$function$;

revoke all on function public.is_site_admin() from public;
revoke all on function public.is_site_admin() from anon;
grant execute on function public.is_site_admin() to authenticated;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public, pg_temp
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

drop policy if exists "public read published content" on public.content_items;
drop policy if exists "public read published content items" on public.content_items;
drop policy if exists "admins insert content items" on public.content_items;
drop policy if exists "admins update content items" on public.content_items;
drop policy if exists "admins delete content items" on public.content_items;

create policy "anon read published content items" on public.content_items
  for select to anon using (status = 'published');
create policy "authenticated read published content items" on public.content_items
  for select to authenticated using (status = 'published' or public.is_site_admin());

drop policy if exists "public read active portal categories" on public.portal_categories;
create policy "anon read active portal categories" on public.portal_categories
  for select to anon using (is_active = true);
create policy "authenticated read active portal categories" on public.portal_categories
  for select to authenticated using (is_active = true or public.is_site_admin());

drop policy if exists "admins insert content" on public.content_items;
create policy "admins insert content" on public.content_items
  for insert to authenticated with check (public.is_site_admin());
drop policy if exists "admins update content" on public.content_items;
create policy "admins update content" on public.content_items
  for update to authenticated using (public.is_site_admin())
  with check (public.is_site_admin());
drop policy if exists "admins delete content" on public.content_items;
create policy "admins delete content" on public.content_items
  for delete to authenticated using (public.is_site_admin());

drop policy if exists "admins read own admin record" on public.admin_users;
create policy "admins read own admin record" on public.admin_users
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "users read own profile" on public.user_profiles;
create policy "users read own profile" on public.user_profiles
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "users insert own profile" on public.user_profiles;
create policy "users insert own profile" on public.user_profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "users update own profile" on public.user_profiles;
create policy "users update own profile" on public.user_profiles
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "users delete own profile" on public.user_profiles;
create policy "users delete own profile" on public.user_profiles
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "users read own alert log" on public.user_alert_log;
create policy "users read own alert log" on public.user_alert_log
  for select to authenticated using ((select auth.uid()) = user_id);

create index if not exists user_alert_log_job_id_idx on public.user_alert_log(job_id);
