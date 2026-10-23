-- Final live-audit cleanup for Rojgar Sathi.
-- Keep exactly one public SELECT policy per role on published content.
-- The duplicate policies were functionally equivalent and generated Supabase performance warnings.
drop policy if exists "public read published content" on public.content_items;
drop policy if exists "anon read published content" on public.content_items;
drop policy if exists "anon read published content items" on public.content_items;
drop policy if exists "authenticated read published content" on public.content_items;
drop policy if exists "authenticated read published content items" on public.content_items;

create policy "anon read published content items" on public.content_items
  for select to anon using (status = 'published');

create policy "authenticated read published content items" on public.content_items
  for select to authenticated using (status = 'published' or public.is_site_admin());

-- Ensure the existing Rajasthan contractual sanitation recruitment appears in
-- the active Local Bodies & District Jobs category as well as its state/category pages.
update public.jobs
set category_slugs = array(
  select distinct tag
  from unnest(coalesce(category_slugs, '{}'::text[]) || array['local-body-district-jobs']::text[]) as tags(tag)
  order by tag
)
where status = 'published'
  and department_slug = 'local-self-government-rajasthan'
  and not ('local-body-district-jobs' = any(coalesce(category_slugs, '{}'::text[])));
