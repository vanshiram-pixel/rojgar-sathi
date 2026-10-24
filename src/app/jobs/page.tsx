import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data";
import { JobCard } from "@/components/JobCard";
import { JobTable } from "@/components/JobTable";
import { AdSlot } from "@/components/AdSlot";

export const revalidate = 60;

type SearchParams = {
  q?: string;
  view?: string;
  department?: string;
  state?: string;
  qualification?: string;
  recruitmentType?: string;
  status?: string;
  from?: string;
  to?: string;
};

type PortalCategory = { name: string; slug: string; category_type: string; sort_order: number };

function indiaToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function deadlineOf(job: any): string {
  return String(job.valid_through || job.application_end || "");
}

function applicationStatus(job: any, today: string): "upcoming" | "open" | "closing-soon" | "expired" {
  const start = String(job.application_start || "");
  const deadline = deadlineOf(job);
  if (start && start > today) return "upcoming";
  if (deadline && deadline < today) return "expired";
  if (deadline) {
    const daysRemaining = Math.floor(
      (Date.parse(deadline + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) / 86400000,
    );
    if (daysRemaining >= 0 && daysRemaining <= 7) return "closing-soon";
  }
  return "open";
}

function makeViewUrl(params: SearchParams, view: "table" | "cards"): string {
  const url = new URLSearchParams();
  for (const key of ["q", "department", "state", "qualification", "recruitmentType", "status", "from", "to"] as const) {
    const value = params[key];
    if (value) url.set(key, value);
  }
  url.set("view", view);
  return "/jobs?" + url.toString();
}

export default async function Jobs({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const q = (params.q || "").trim();
  const view = params.view === "cards" ? "cards" : "table";
  const department = params.department || "";
  const state = params.state || "";
  const qualification = (params.qualification || "").trim();
  const recruitmentType = params.recruitmentType || "";
  const status = params.status || "";
  const from = params.from || "";
  const to = params.to || "";
  const today = indiaToday();
  const safeTerm = q.replace(/[%,_.*()\\"]/g, " ").trim();

  const supabase = await createClient();
  const [settings, categoryResult, jobsResult] = await Promise.all([
    getSettings(),
    supabase
      .from("portal_categories")
      .select("name,slug,category_type,sort_order")
      .eq("is_active", true)
      .in("category_type", ["department", "state", "qualification"])
      .order("sort_order", { ascending: true }),
    (async () => {
      let query = supabase
        .from("jobs")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(500);
      if (safeTerm) {
        query = query.or(
          "title.ilike.%" + safeTerm + "%,organization.ilike.%" + safeTerm +
          "%,category.ilike.%" + safeTerm + "%,department.ilike.%" + safeTerm +
          "%,qualification.ilike.%" + safeTerm + "%",
        );
      }
      if (department) query = query.eq("department_slug", department);
      if (state) query = query.eq("state_slug", state);
      if (qualification) query = query.ilike("qualification", "%" + qualification.replace(/[%_]/g, " ") + "%");
      if (recruitmentType) query = query.eq("recruitment_type", recruitmentType);
      return query;
    })(),
  ]);

  const categories = (categoryResult.data || []) as PortalCategory[];
  const departments = categories.filter((item) => item.category_type === "department");
  const states = categories.filter((item) => item.category_type === "state");
  const qualifications = categories.filter((item) => item.category_type === "qualification");
  const allJobs = jobsResult.data || [];
  const jobs = allJobs.filter((job: any) => {
    const currentStatus = applicationStatus(job, today);
    const deadline = deadlineOf(job);
    if (status === "open" && currentStatus !== "open" && currentStatus !== "closing-soon") return false;
    if (status && status !== "open" && currentStatus !== status) return false;
    if (from && (!deadline || deadline < from)) return false;
    if (to && (!deadline || deadline > to)) return false;
    return true;
  });

  const activeFilterCount = [q, department, state, qualification, recruitmentType, status, from, to].filter(Boolean).length;

  return (
    <>
      <header className="header">
        <div className="wrap header-inner">
          <Link className="brand" href="/" aria-label="Rojgar Sathi home">
            <img className="brand-logo" src="/rojgar-sathi-logo.svg" alt="Rojgar Sathi" />
          </Link>
          <Link className="text-link" href="/">← होम</Link>
        </div>
      </header>
      <main className="wrap page">
        <div className="vacancy-page-heading">
          <div>
            <span className="eyebrow">ROJGAR SATHI · LATEST UPDATES</span>
            <h1 className="page-title">सरकारी नौकरियाँ</h1>
            <p className="sub">विभाग, राज्य, योग्यता, भर्ती के प्रकार और आवेदन की स्थिति के अनुसार खोजें। आवेदन से पहले आधिकारिक अधिसूचना ज़रूर जाँचें।</p>
          </div>
          <div className="vacancy-count"><strong>{jobs.length}</strong><span>मिलती-जुलती भर्तियाँ</span></div>
        </div>

        <form action="/jobs" method="get" className="job-filter-panel">
          <div className="job-filter-search">
            <label htmlFor="job-query">भर्ती खोजें</label>
            <input id="job-query" name="q" defaultValue={q} placeholder="भर्ती, संस्था, विभाग या योग्यता..." />
          </div>
          <div className="job-filter-grid">
            <label>विभाग
              <select name="department" defaultValue={department}>
                <option value="">सभी विभाग</option>
                {departments.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
              </select>
            </label>
            <label>राज्य / केंद्रशासित प्रदेश
              <select name="state" defaultValue={state}>
                <option value="">सभी राज्य</option>
                {states.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
              </select>
            </label>
            <label>योग्यता
              <select name="qualification" defaultValue={qualification}>
                <option value="">सभी योग्यताएँ</option>
                {qualifications.map((item) => <option key={item.slug} value={item.name}>{item.name}</option>)}
                {!qualifications.length && ["8वीं पास", "10वीं पास", "12वीं पास", "ITI", "डिप्लोमा", "स्नातक", "स्नातकोत्तर"].map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label>भर्ती का प्रकार
              <select name="recruitmentType" defaultValue={recruitmentType}>
                <option value="">सभी प्रकार</option>
                {["सरकारी नौकरी", "निजी नौकरी", "अप्रेंटिसशिप", "इंटर्नशिप", "संविदा भर्ती"].map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label>आवेदन की स्थिति
              <select name="status" defaultValue={status}>
                <option value="">सभी स्थितियाँ</option>
                <option value="open">आवेदन जारी</option>
                <option value="closing-soon">अंतिम तिथि नज़दीक (7 दिन)</option>
                <option value="upcoming">जल्द शुरू</option>
                <option value="expired">समय-सीमा समाप्त</option>
              </select>
            </label>
            <label>अंतिम तिथि — से
              <input type="date" name="from" defaultValue={from} />
            </label>
            <label>अंतिम तिथि — तक
              <input type="date" name="to" defaultValue={to} />
            </label>
          </div>
          <div className="job-filter-actions">
            <button className="btn" type="submit">भर्तियाँ खोजें</button>
            <Link className="text-link" href="/jobs">फ़िल्टर हटाएँ</Link>
            <span className="sub">{activeFilterCount ? `${activeFilterCount} फ़िल्टर लागू` : "सभी प्रकाशित भर्तियाँ"}</span>
          </div>
        </form>

        <div className="vacancy-inline-ad"><AdSlot enabled={settings.ads_enabled} client={settings.adsense_client} slot={settings.ad_slot_job} /></div>
        <div className="vacancy-toolbar">
          <div>
            <strong>{q ? `“${q}” के परिणाम` : "लेटेस्ट वैकेंसी लिस्ट"}</strong>
            <span>स्थिति और अंतिम तिथि उपलब्ध जानकारी के आधार पर दिखाई जाती है।</span>
          </div>
          <div className="vacancy-view-switch" aria-label="सूची का दृश्य">
            <Link aria-current={view === "table" ? "page" : undefined} className={view === "table" ? "selected" : ""} href={makeViewUrl(params, "table")}>टेबल व्यू</Link>
            <Link aria-current={view === "cards" ? "page" : undefined} className={view === "cards" ? "selected" : ""} href={makeViewUrl(params, "cards")}>कार्ड व्यू</Link>
          </div>
        </div>
        {jobs.length ? (
          view === "cards"
            ? <div className="job-grid">{jobs.map((job: any) => <JobCard key={job.id} job={job} />)}</div>
            : <JobTable jobs={jobs} />
        ) : (
          <div className="empty">
            इस फ़िल्टर में कोई प्रकाशित भर्ती नहीं मिली। विभाग या राज्य हटाकर, या फ़िल्टर बदलकर फिर खोजें।
          </div>
        )}
        <div className="vacancy-inline-ad"><AdSlot enabled={settings.ads_enabled} client={settings.adsense_client} slot={settings.ad_slot_job} /></div>
      </main>
    </>
  );
}
