# Rojgar Sathi

Rojgar Sathi is a Hindi-first jobs and careers platform built with Next.js and Supabase. The public website supports recruitment listings, category/state pages, search and shareable recruitment filters, job details, and responsive table/card layouts.

## Run locally

1. Install Node.js 22 or newer.
2. Copy `.env.example` to `.env.local` and set your Supabase project URL and anon/publishable key.
3. For a new local database, use the Supabase CLI and apply the repository's migration history in order. Do not apply only one migration or run `schema.sql` on top of an already-migrated database without reviewing the schema first.
4. Create a user in Supabase Authentication. Grant that user admin access through the documented admin-user workflow in the project's SQL setup; never place admin credentials in client code.
5. Run `npm install`, `npm run typecheck`, `npm run lint`, `npm run build`, then `npm run dev`. Open `http://localhost:3000`.
6. Sign in at `/admin/login`.

## Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: public client connection settings. Keep row-level security (RLS) enabled.
- `NEXT_PUBLIC_SITE_URL`: canonical public site URL; use `https://rojgar-sathi-main.vercel.app` in the current production deployment.
- `OPENAI_API_KEY` and optionally `OPENAI_MODEL`: server-side admin AI draft assistance. The AI produces drafts only; an admin must verify all facts and publish manually.
- `RESEND_API_KEY` and `RESEND_FROM_EMAIL`: server-side email-alert delivery. Use a sender/domain authorized in Resend.
- `SUPABASE_SERVICE_ROLE_KEY`: server-side email-recipient lookup only. Treat it as a secret; never prefix it with `NEXT_PUBLIC_`, commit a real value, or expose it in browser code.

Optional integrations remain inactive until valid credentials, domain authorization, and end-to-end tests are complete.

## Security and publishing

- Never put a Supabase service-role/secret key in browser environment variables.
- Admin pages and writes require an authenticated user present in `admin_users`; database RLS policies must enforce this too.
- Job listings are blank until added in Admin. Do not publish unverified recruitment dates, vacancies, eligibility, or official links.
- The admin AI assistant does not verify the original government notice and never publishes automatically. Human verification is mandatory.
- PWA installation is supported from compatible browsers. Native Play Store publishing requires a separate Android packaging/signing/release step.
- AdSense publisher authorization belongs in `public/ads.txt`; configure matching `ca-pub-...` client and ad-slot IDs only after the publisher account and canonical domain are approved.
- Before public launch, test admin login, RLS, create/edit/publish/archive, categories, image upload, expiry-review workflow, user preferences, email alerts, AI draft generation, legal routes, sitemap, robots and `/ads.txt`.
- Keep the old `updated-rojgar.vercel.app` URL as a redirect to the canonical Rojgar Sathi domain. Do not operate it as a separate brand/project.

## Release checks

Run `npm run typecheck`, `npm run lint`, `npm audit --omit=dev`, and `npm run build`. GitHub Actions runs these checks on pull requests and pushes to `main`. A successful build is necessary but not sufficient: verify Supabase Auth security settings, isolated staging workflows, all external integrations, verified live content, and production smoke tests before declaring the public launch complete.
