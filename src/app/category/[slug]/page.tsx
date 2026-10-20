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
};

export default async function Category({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: category } = await supabase.from("portal_categories").select("name,slug,description,category_type").eq("slug", slug).eq("is_active", true).maybeSingle();
  const title = category?.name || builtIn[slug];
  if (!title) notFound();
  const jobs = await getPublishedJobs(title);
  return <>
    <header className="header"><div className="wrap header-inner"><Link className="brand" href="/">रोज़गार साथी</Link><Link href="/categories" className="text-link">← सभी श्रेणियाँ</Link></div></header>
    <main className="wrap page">
      <p className="eyebrow">अपडेट श्रेणी</p>
      <h1 className="page-title">{title}</h1>
      <p className="sub">{category?.description || "संबंधित प्रकाशित भर्ती और अपडेट।"}</p>
      {jobs.length ? <div className="job-grid">{jobs.map((job: any) => <JobCard key={job.id} job={job} />)}</div> : <div className="empty">अभी इस श्रेणी में कोई अपडेट प्रकाशित नहीं है। व्यवस्थापक इस श्रेणी में संबंधित भर्ती जोड़कर प्रकाशित कर सकते हैं।</div>}
      <p className="sub"><Link className="text-link" href="/categories">सभी श्रेणियाँ और राज्यवार अपडेट देखें →</Link></p>
    </main>
  </>;
}
