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

export default async function Category({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: category } = await supabase.from("portal_categories").select("name,slug,description,category_type").eq("slug", slug).eq("is_active", true).maybeSingle();
  const title = category?.name || builtIn[slug];
  if (!title) notFound();

  let jobs: any[] = [];
  try {
    if (category?.category_type === "department" || category?.category_type === "state" || category?.category_type === "content" || category?.category_type === "employment" || category?.category_type === "exam" || category?.category_type === "education" || category?.category_type === "scheme") {\n      const { data } = await supabase.from("jobs").select("*").eq("status", "published").contains("category_slugs", [slug]).order("created_at", { ascending: false }).limit(100);\n      jobs = data || [];\n    } else if (category?.category_type === "department") {
      const { data } = await supabase.from("jobs").select("*").eq("status", "published").eq("department", category.name).order("created_at", { ascending: false }).limit(100);
      jobs = data || [];
    } else if (category?.category_type === "qualification") {
      const needle = title.replace(/ Jobs$/i, "").replace(/ Pass$/i, "");
      const { data } = await supabase.from("jobs").select("*").eq("status", "published").ilike("qualification", `%${needle}%`).order("created_at", { ascending: false }).limit(100);
      jobs = data || [];
    } else {
      jobs = await getPublishedJobs(title);
    }
  } catch {
    jobs = await getPublishedJobs(title);
  }

  return <>
    <header className="header"><div className="wrap header-inner"><Link className="brand" href="/">रोज़गार साथी</Link><Link href="/categories" className="text-link">← सभी श्रेणियाँ</Link></div></header>
    <main className="wrap page">
      <p className="eyebrow">{category?.category_type === "department" ? "विभागवार भर्ती" : category?.category_type === "qualification" ? "योग्यता के अनुसार भर्ती" : "अपडेट श्रेणी"}</p>
      <h1 className="page-title">{title}</h1>
      <p className="sub">{category?.description || "संबंधित प्रकाशित भर्ती और अपडेट।"}</p>
      {jobs.length ? <div className="job-grid">{jobs.map((job: any) => <JobCard key={job.id} job={job} />)}</div> : <div className="empty">अभी इस श्रेणी में कोई प्रकाशित अपडेट उपलब्ध नहीं है। व्यवस्थापक भर्ती जोड़ते समय सही विभाग/योग्यता चुनें। नई भर्ती प्रकाशित होने पर वह यहाँ दिखाई देगी।</div>}
      <p className="sub"><Link className="text-link" href="/categories">सभी विभाग, योग्यता और राज्यवार अपडेट देखें →</Link></p>
    </main>
  </>;
}
