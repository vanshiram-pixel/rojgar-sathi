import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublishedJobs } from "@/lib/data";
import { JobCard } from "@/components/JobCard";

const builtIn: Record<string, string> = {
  "admit-card": "एडमिट कार्ड",
  result: "रिजल्ट",
  "answer-key": "आंसर की",
  scholarship: "स्कॉलरशिप",
  schemes: "सरकारी योजनाएँ",
  "central-government-jobs": "Central Government Jobs",
  "defence-jobs": "Defence Jobs",
  "police-paramilitary-jobs": "Police & Paramilitary",
  "railway-jobs": "Railway Jobs",
  "teaching-jobs": "Teaching & Education Jobs",
  "banking-insurance-jobs": "Banking & Insurance",
  "ssc-staff-selection-jobs": "SSC & Staff Selection",
  "upsc-civil-services-jobs": "UPSC & Civil Services",
  "state-psc-jobs": "State PSC & Commissions",
  "health-medical-jobs": "Health & Medical",
  "engineering-technical-jobs": "Engineering & Technical",
  "court-judiciary-jobs": "Courts & Judiciary",
  "agriculture-animal-husbandry-jobs": "Agriculture & Animal Husbandry",
  "psu-government-company-jobs": "PSU & Government Companies",
  "local-body-district-jobs": "Local Bodies & District Jobs",
  "apprenticeship-internship-jobs": "Apprenticeship & Internship",
  "8th-pass-jobs": "8th Pass Jobs",
  "10th-pass-jobs": "10th Pass Jobs",
  "12th-pass-jobs": "12th Pass Jobs",
  "iti-jobs": "ITI Jobs",
  "diploma-jobs": "Diploma Jobs",
  "graduate-jobs": "Graduate Jobs",
  "postgraduate-jobs": "Postgraduate Jobs",
  "professional-specialist-jobs": "Professional & Specialist Jobs",
};

function stateNameForLegacy(title: string) {
  return title.replace(/ सरकारी नौकरी$/i, "").replace(/ Jobs$/i, "").trim();
}

export default async function Category({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: category } = await supabase
    .from("portal_categories")
    .select("name,slug,description,category_type")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  const title = category?.name || builtIn[slug];
  if (!title) notFound();

  let jobs: any[] = [];
  try {
    if (slug === "latest-jobs" || slug === "latest-notifications") {
      const allPublished = await supabase.from("jobs").select("*").eq("status", "published")
        .order("created_at", { ascending: false }).limit(100);
      jobs = allPublished.data || [];
    } else if (["latest-admit-cards", "latest-results", "latest-answer-keys"].includes(slug)) {
      const legacyLabel = slug === "latest-admit-cards" ? "एडमिट कार्ड" : slug === "latest-results" ? "रिजल्ट" : "आंसर की";
      const byType = await supabase.from("jobs").select("*").eq("status", "published")
        .or("category.ilike.%" + legacyLabel + "%,recruitment_type.ilike.%" + legacyLabel + "%")
        .order("created_at", { ascending: false }).limit(100);
      const byTag = await supabase.from("jobs").select("*").eq("status", "published")
        .contains("category_slugs", [slug]).order("created_at", { ascending: false }).limit(100);
      const unique = new Map<string, any>();
      [...(byType.data || []), ...(byTag.data || [])].forEach((job: any) => unique.set(job.id, job));
      jobs = [...unique.values()].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (category) {
      const tagged = await supabase.from("jobs").select("*").eq("status", "published")
        .contains("category_slugs", [slug]).order("created_at", { ascending: false }).limit(100);
      if (!tagged.error) jobs = tagged.data || [];
      if (category.category_type === "department" && !jobs.length) {
        const byDepartment = await supabase.from("jobs").select("*").eq("status", "published")
          .eq("department_slug", slug).order("created_at", { ascending: false }).limit(100);
        jobs = byDepartment.data || [];
      }
      if (category.category_type === "state") {
        const byState = await supabase.from("jobs").select("*").eq("status", "published")
          .eq("state_slug", slug).order("created_at", { ascending: false }).limit(100);
        const merged = new Map<string, any>();
        [...jobs, ...(byState.data || [])].forEach((job: any) => merged.set(job.id, job));
        jobs = [...merged.values()];
      }

      if (!jobs.length && category.category_type === "qualification") {
        const needle = title.replace(/ Jobs$/i, "").replace(/ Pass$/i, "");
        const legacy = await supabase.from("jobs").select("*").eq("status", "published")
          .ilike("qualification", "%" + needle + "%").order("created_at", { ascending: false }).limit(100);
        jobs = legacy.data || [];
      } else if (!jobs.length && category.category_type === "department") {
        const legacy = await supabase.from("jobs").select("*").eq("status", "published")
          .eq("department", category.name).order("created_at", { ascending: false }).limit(100);
        jobs = legacy.data || [];
      } else if (!jobs.length && category.category_type === "state") {
        const stateName = stateNameForLegacy(title);
        const legacy = await supabase.from("jobs").select("*").eq("status", "published")
          .ilike("location", "%" + stateName.replace(/[%_,]/g, " ") + "%")
          .order("created_at", { ascending: false }).limit(100);
        jobs = legacy.data || [];
      } else if (!jobs.length && ["content", "scheme", "education", "exam", "employment"].includes(category.category_type)) {
        const legacy = await supabase.from("jobs").select("*").eq("status", "published")
          .ilike("category", "%" + title.replace(/[%_,]/g, " ") + "%")
          .order("created_at", { ascending: false }).limit(100);
        jobs = legacy.data || [];
      }
    } else {
      jobs = await getPublishedJobs(title);
    }
  } catch {
    jobs = await getPublishedJobs(title);
  }

  const contentTypeBySlug: Record<string, string> = {
    "latest-admit-cards": "admit_card",
    "latest-results": "result",
    "latest-answer-keys": "answer_key",
    "latest-scholarships": "scholarship",
    "latest-government-schemes": "scheme",
    "latest-notifications": "",
    "central-government-updates": "",
    "state-government-updates": "",
    scholarship: "scholarship",
    "government-schemes": "scheme",
    schemes: "scheme",
    admissions: "admission",
    "university-updates": "university_update",
    "exam-updates": "exam_update",
    "admit-card": "admit_card",
    result: "result",
    "answer-key": "answer_key",
  };
  let contentItems: any[] = [];
  try {
    const queries: any[] = [];
    const contentType = contentTypeBySlug[slug];
    if (contentType) {
      queries.push(supabase.from("content_items").select("*").eq("status", "published").eq("content_type", contentType).order("created_at", { ascending: false }).limit(100));
    }
    if (slug === "latest-jobs" || slug === "latest-notifications" || slug === "central-government-updates" || slug === "state-government-updates") {
      const level = slug === "central-government-updates" ? "central" : slug === "state-government-updates" ? "state" : null;
      let q = supabase.from("content_items").select("*").eq("status", "published").order("created_at", { ascending: false }).limit(100);
      if (level) q = q.eq("government_level", level);
      queries.push(q);
    }
    if (category?.category_type === "department") {
      queries.push(supabase.from("content_items").select("*").eq("status", "published").eq("department_slug", slug).order("created_at", { ascending: false }).limit(100));
    }
    if (category?.category_type === "state") {
      queries.push(supabase.from("content_items").select("*").eq("status", "published").eq("state_slug", slug).order("created_at", { ascending: false }).limit(100));
    }
    queries.push(supabase.from("content_items").select("*").eq("status", "published").contains("category_slugs", [slug]).order("created_at", { ascending: false }).limit(100));
    const results = await Promise.all(queries);
    const unique = new Map<string, any>();
    results.forEach((result: any) => (result.data || []).forEach((item: any) => unique.set(item.id, item)));
    contentItems = [...unique.values()].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch {
    contentItems = [];
  }

  return (
    <>
      <header className="header">
        <div className="wrap header-inner">
          <Link className="brand" href="/">रोज़गार साथी</Link>
          <Link href="/categories" className="text-link">← सभी श्रेणियाँ</Link>
        </div>
      </header>
      <main className="wrap page">
        <p className="eyebrow">रोज़गार साथी · श्रेणीवार अपडेट</p>
        <h1 className="page-title">{title}</h1>
        <p className="sub">{category?.description || "इस श्रेणी से जुड़ी प्रकाशित सूचनाएँ और अवसर। आवेदन से पहले आधिकारिक अधिसूचना अवश्य पढ़ें।"}</p>
        {contentItems.length ? (
          <section className="section">
            <h2>योजनाएँ और विद्यार्थी अपडेट</h2>
            <div className="job-grid">
              {contentItems.map((item: any) => (
                <article className="job-card" key={item.id}>
                  {item.image_url ? <img src={item.image_url} alt={item.title} style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 10 }} /> : null}
                  <span className="tag">{item.government_level === "state" ? (item.state_name || "राज्य सरकार") : item.government_level === "central" ? "केंद्र सरकार" : item.government_level}</span>
                  <h3>{item.title}</h3>
                  <p className="sub">{item.summary || item.eligibility || ""}</p>
                  {item.application_end ? <p className="sub">अंतिम तिथि: {item.application_end}</p> : null}
                  <Link className="text-link" href={"/updates/" + item.slug}>पूरी जानकारी →</Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}
        {jobs.length ? (
          <section className="section">
            <h2>संबंधित भर्ती</h2>
            <div className="job-grid">{jobs.map((job: any) => <JobCard key={job.id} job={job} />)}</div>
          </section>
        ) : null}
        {!contentItems.length && !jobs.length ? (
          <div className="empty">इस श्रेणी में अभी कोई प्रकाशित जानकारी नहीं मिली। आधिकारिक स्रोत से सत्यापित सूचना उपलब्ध होने पर यहाँ दिखाई जाएगी।</div>
        ) : null}
      </main>
    </>
  );
}
