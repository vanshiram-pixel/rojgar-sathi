# Updated Rojgar

A separate Hindi-first jobs and careers platform built with Next.js + Supabase. Branding, theme, home layout, navigation, splash/PWA assets, SEO settings and ad slots are managed from the admin panel—no code edits for normal content/design changes.

## Run locally
1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env.local` and enter your Supabase project URL and anon/publishable key.
3. In Supabase SQL Editor, run `supabase/schema.sql`.
4. Create a user in Supabase Authentication. In SQL Editor, grant that user admin access:
   `insert into public.admin_users (user_id) select id from auth.users where email = 'YOUR-ADMIN-EMAIL';`
5. Run `npm install`, then `npm run dev`. Open `http://localhost:3000`.
6. Sign in at `/admin/login`.

## Important
- Never put the Supabase service-role key in browser environment variables.
- Admin pages and writes require an authenticated user present in `admin_users`; database RLS policies enforce this too.
- Job listings are blank until added in Admin. Do not publish unverified recruitment dates or claims.
- PWA installation is supported from compatible browsers. Native Play Store publishing requires a separate Android packaging/signing/release step.
- AdSense IDs and placements can be configured in Admin after the publisher account/domain are approved.
- Before production launch, configure the production URL, test authentication/RLS, add privacy/terms/contact pages, and verify official-source links.
