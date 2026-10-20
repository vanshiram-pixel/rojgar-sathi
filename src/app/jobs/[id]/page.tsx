import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data";
import { AdSlot } from "@/components/AdSlot";
export const revalidate=60;
export default async function JobDetail({params}:{params:Promise<{id:string}>}) {
 const {id}=await params; const supabase=await createClient();
 const [{data:job},{data:settings}]=await Promise.all([
  supabase.from("jobs").select("*").eq("id",id).eq("status","published").maybeSingle(),
  supabase.from("site_settings").select("*").eq("id",1).maybeSingle()
 ]);
 if(!job) notFound();
 const date=(d:string|null)=>d?new Date(d+"T00:00:00").toLocaleDateString("hi-IN",{day:"numeric",month:"long",year:"numeric"}):"अधिसूचना देखें";
 return <><header className="header"><div className="wrap header-inner"><Link className="brand" href="/"><span className="brand-mark">UR</span>{settings?.brand_name||"Updated Rojgar"}</Link><Link className="text-link" href="/jobs">← सभी नौकरियाँ</Link></div></header><main className="wrap page"><div className="detail"><span className="tag">{job.category}</span><h1>{job.title}</h1><p className="org">{job.organization}</p><div className="detail-grid">{[["कुल पद",job.vacancies||"अधिसूचना देखें"],["योग्यता",job.qualification||"आधिकारिक नोटिस देखें"],["आवेदन शुरू",date(job.application_start)],["अंतिम तिथि",date(job.application_end)],["परीक्षा तिथि",date(job.exam_date)],["स्थान",job.location]].map(([k,v])=><div className="detail-item" key={k}><small>{k}</small><strong>{v}</strong></div>)}</div><h2>भर्ती का विवरण</h2><p style={{whiteSpace:"pre-wrap"}}>{job.description||"विस्तृत जानकारी के लिए आधिकारिक अधिसूचना देखें।"}</p><div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:24}}>{job.official_url?<a className="btn" href={job.official_url} target="_blank" rel="noopener noreferrer">आधिकारिक वेबसाइट ↗</a>:null}{job.notification_url?<a className="btn secondary" href={job.notification_url} target="_blank" rel="noopener noreferrer">अधिसूचना डाउनलोड ↗</a>:null}</div><p className="sub">सूचना: आवेदन से पहले विभाग की आधिकारिक अधिसूचना से तारीख, पात्रता और शुल्क की पुष्टि करें।</p></div><AdSlot enabled={settings?.ads_enabled||false} client={settings?.adsense_client||""} slot={settings?.ad_slot_job||""}/></main></>;
}