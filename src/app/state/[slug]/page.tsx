import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JobCard } from "@/components/JobCard";

export const revalidate = 60;

export default async function StateJobsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: state } = await supabase.from("portal_categories").select("name,slug,description,category_type").eq("slug", slug).eq("category_type", "state").eq("is_active", true).maybeSingle();
  if (!state) notFound();

  const { data: tagged } = await supabase.from("jobs").select("*").eq("status", "published").contains("category_slugs", [slug]).order("created_at", { ascending: false }).limit(100);
  const { data: byLocation } = await supabase.from("jobs").select("*").eq("status", "published").ilike("location", `%${state.name.replace(/[%_,]/g, " ")}%`).order("created_at", { ascending: false }).limit(100);
  const uniqueJobs = new Map<string, any>();
  [...(tagged || []), ...(byLocation || [])].forEach((job: any) => uniqueJobs.set(job.id, job));
  const jobs = [...uniqueJobs.values()].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return <>
    <header className="header"><div className="wrap header-inner"><Link className="brand" href="/">रोज़गार साथी</Link><Link href="/categories" className="text-link">← सभी श्रेणियाँ</Link></div></header>
    <main className="wrap page">
      <p className="eyebrow">राज्यवार भर्ती</p>
      <h1 className="page-title">{state.name} सरकारी नौकरी</h1>
      <p className="sub">{state.description || `${state.name} की सरकारी भर्ती, एडमिट कार्ड, परिणाम और परीक्षा अपडेट।`}</p>
      <div className="notice">यहाँ वही भर्ती दिखाई जाएगी जिसकी लोकेशन में “{state.name}” दर्ज है। सही तारीख और पात्रता के लिए आधिकारिक नोटिफिकेशन जाँचें।</div>
      {jobs.length ? <div className="job-grid">{jobs.map((job: any) => <JobCard key={job.id} job={job} />)}</div> : <div className="empty">इस राज्य के लिए अभी कोई प्रकाशित भर्ती नहीं मिली। व्यवस्थापक भर्ती जोड़ते समय स्थान में “{state.name}” लिखे।</div>}
    </main>
  </>;
}
