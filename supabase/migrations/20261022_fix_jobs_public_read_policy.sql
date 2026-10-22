-- Fix public job reads without requiring anon to execute the admin-only helper.
drop policy if exists "public read published jobs" on public.jobs;
drop policy if exists "anon read published jobs" on public.jobs;
drop policy if exists "authenticated read published jobs" on public.jobs;

create policy "anon read published jobs" on public.jobs
  for select to anon using (status = 'published');

create policy "authenticated read published jobs" on public.jobs
  for select to authenticated using (status = 'published' or public.is_site_admin());