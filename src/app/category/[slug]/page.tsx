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
    if (category) {
      const tagged = await supabase.from("jobs").select("*").eq("status", "published")
        .contains("category_slugs", [slug]).order("created_at", { ascending: false }).limit(100);
      if (!tagged.error) jobs = tagged.data || [];

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
        {jobs.length ? (
          <div className="job-grid">{jobs.map((job: any) => <JobCard key={job.id} job={job} />)}</div>
        ) : (
          <div className="empty">इस श्रेणी में अभी कोई प्रकाशित जानकारी नहीं मिली। आधिकारिक स्रोत से सत्यापित सूचना उपलब्ध होने पर यहाँ दिखाई जाएगी।</div>
        )}
      </main>
    </>
  );
}
