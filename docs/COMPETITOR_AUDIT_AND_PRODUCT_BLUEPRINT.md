# Rojgar Sathi — Competitor Audit & Product Blueprint
Audit date: 2026-10-20

## Scope
Reviewed the public-facing structures of FreeJobAlert, SarkariResult, the official Employment News portal, Rajasthan Recruitment Portal, and Google Search Central guidance for job structured data and people-first content. This is a public-page/product audit, not access to private analytics or a guarantee of ranking outcomes.

## Competitor patterns worth learning from
- **FreeJobAlert:** separates fresh job notifications, closing-soon reminders, education-based discovery, state notifications, answer keys, syllabus and education results. Its breadth is a useful content taxonomy benchmark.
- **SarkariResult:** makes Latest Jobs, Admit Cards, Results, Answer Keys, Syllabus and Admissions immediately discoverable. Individual job summaries surface vacancies, dates, fees, eligibility and application links.
- **Employment News (Government of India):** organizes listings by issued date, recruiting organization, post, appointment method and last date; also offers advanced search.
- **Rajasthan Recruitment Portal:** demonstrates the value of a state-specific recruitment hub, one-time registration context and candidate lifecycle from advertisement to application/exam/result.
- **Google Search Central:** JobPosting structured data belongs only on a single, complete job detail page—not on category/search lists. The structured data must match visible content; expired roles and pages without a real apply route create policy risks. Search performance cannot be guaranteed by markup alone.
Sources:
- https://www.freejobalert.com/
- https://www.sarkariresult.com/
- https://employmentnews.gov.in/newemp/AllJobs.aspx?k=All
- https://www.recruitment.rajasthan.gov.in/recruitmentlogin
- https://developers.google.com/search/docs/appearance/structured-data/job-posting
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content

## Audit findings in the current Rojgar Sathi code
1. The home page repeats overlapping navigation: top navigation, portal navigation, hero shortcuts, a “popular categories” grid and category sections point to several of the same destinations.
2. Many department/state shortcuts currently point to /jobs rather than a dedicated department or state landing page. That makes labels appear more specific than the experience behind them.
3. The existing category table supports broad content/state/exam/education/scheme/employment types, but not a first-class department taxonomy.
4. The admin job form has organization, category, location, qualification, dates and links, but no explicit department, recruitment type, age range, fee, pay scale, selection process, official source/verification timestamp, or expiry workflow.
5. The public job search currently filters only title, organization and category; it is not yet a full multi-facet search.
6. Category pages search jobs by display title text, which is fragile when category names differ from the value stored on a job.
7. SEO metadata is site-wide; job-specific metadata and valid JobPosting structured data need a per-job audit. Sitemap/indexing and expired-job behavior also need testing.
8. Email alerts are deliberately out of scope until the final phase, per product decision.

## Product direction
### Information architecture
One primary navigation system; no repeated button clusters. Keep high-intent global destinations in the header, use a single prominent search, and group the rest into purposeful sections:
- Jobs: Latest, Closing Soon, Upcoming, Central Government, State Government, Rajasthan.
- Department: Defence, Police & Paramilitary, Railway, Teaching & Education, Banking & Insurance, SSC/Staff Selection, UPSC/Civil Services, State PSC, Health & Medical, Engineering/Technical, Courts/Judiciary, Agriculture/Animal Husbandry, Public Sector/PSU, Local Bodies, Apprenticeship/Internships.
- Candidate status: Admit Card/Exam City, Exam Date/Postponement, Answer Key/Objection, Result, Cut-off/Merit List, Document Verification/Interview.
- Education: Scholarships, Admissions/Counselling, University/College updates, Board Exams, Syllabus, Previous Papers.
- Browse by eligibility: 8th, 10th, 12th, ITI, Diploma, Graduate, Postgraduate, Professional/Technical qualification.
- Browse by geography: Central and every State/UT; state pages must have their own useful content and working filters.

### Job detail page content standard
Recruiting body and advertisement number; department and post names; total/category-wise vacancies where verified; application start/last date and exam dates; eligibility/qualification; age limits and relaxations; fee; salary/pay level; selection process; physical/medical standards where relevant; application steps; required documents; official notification and apply links; source and last-verified date; correction/extension notices; related recruitment updates. Only show fields that are known; do not fabricate.

### Search/filter standard
Search text + department + state + qualification + recruitment type + status (open/closing soon/upcoming/closed) + date range. Filter state should be shareable via URL. Empty results should explain how to broaden the search.

### Trust and SEO standard
- Human-reviewed facts, source links, clear last-verified timestamp, corrections policy, About/Contact/editorial policy.
- Unique useful text on each department/state landing page, not copied boilerplate or thin pages.
- Unique title/description/canonical per page; crawlable links; clean sitemap; correct robots and redirects.
- JobPosting JSON-LD only on eligible, complete, open individual job pages and matching visible content. Expire/remove or accurately mark closed jobs; never mark list pages as JobPosting.
- Core Web Vitals, mobile usability, accessibility, no intrusive ad placement, and ad slots that do not disrupt the application details.
- Measure Google Search Console indexing, queries, CTR and page-level issues. Ranking is never guaranteed.

## Implementation sequence
1. Consolidate repeated home navigation and make department entry points unique.
2. Add first-class department categories and seed a consistent initial taxonomy.
3. Add department/state/qualification fields and real multi-filter search to job listings and admin entry.
4. Upgrade the individual job detail template and validation/expiry handling.
5. Audit metadata, sitemap, canonical URLs, structured data, redirects and indexing.
6. QA all public routes and admin CRUD against the live database.
7. Email/personalized alerts last.
