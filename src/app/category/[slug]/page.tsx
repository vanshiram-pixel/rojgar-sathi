import Link from "next/link";
import { getPublishedJobs } from "@/lib/data";
import { JobCard } from "@/components/JobCard";

const categories: Record<string, string> = {
  "admit-card": "एडमिट कार्ड",
  result: "रिजल्ट",
  "answer-key": "आंसर की",
  scholarship: "स्कॉलरशिप",
};

export default async function Category({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const title = categories[slug];
  if (!title) {
    return <main className="wrap page"><h1>श्रेणी उपलब्ध नहीं</h1><Link className="text-link" href="/">होम पर जाएँ</Link></main>;
  }
  const jobs = await getPublishedJobs(title);
  return <>
    <header className="header"><div className="wrap header-inner"><Link className="brand" href="/"><span className="brand-mark">UR</span>Updated Rojgar</Link><Link href="/" className="text-link">← होम</Link></div></header>
    <main className="wrap page">
      <h1 className="page-title">{title}</h1>
      <p className="sub">संबंधित प्रकाशित अपडेट।</p>
      {jobs.length ? <div className="job-grid">{jobs.map((job: any) => <JobCard key={job.id} job={job} />)}</div> : <div className="empty">अभी इस श्रेणी में कोई अपडेट प्रकाशित नहीं है।</div>}
    </main>
  </>;
}
