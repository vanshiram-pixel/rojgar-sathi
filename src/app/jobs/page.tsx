import Link from "next/link";
import { getPublishedJobs } from "@/lib/data";
import { JobCard } from "@/components/JobCard";
export const revalidate=60;
export default async function Jobs({searchParams}:{searchParams:Promise<{q?:string}>}) {
 const {q=""}=await searchParams; const jobs=await getPublishedJobs(q);
 return <><header className="header"><div className="wrap header-inner"><Link className="brand" href="/"><span className="brand-mark">UR</span>Updated Rojgar</Link><Link className="text-link" href="/">← होम</Link></div></header><main className="wrap page"><h1 className="page-title">सरकारी नौकरियाँ</h1><p className="sub">भर्ती खोजें और आधिकारिक आवेदन लिंक देखें।</p><form action="/jobs" className="page-tools"><input name="q" defaultValue={q} placeholder="नौकरी या विभाग खोजें..."/><button className="btn">खोजें</button></form>{jobs.length?<div className="job-grid">{jobs.map((job:any)=><JobCard key={job.id} job={job}/>)}</div>:<div className="empty">इस खोज में कोई प्रकाशित भर्ती नहीं मिली।</div>}</main></>;
}