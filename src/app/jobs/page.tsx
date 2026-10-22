import Link from "next/link";
import { getPublishedJobs, getSettings } from "@/lib/data";
import { JobCard } from "@/components/JobCard";
import { JobTable } from "@/components/JobTable";
import { AdSlot } from "@/components/AdSlot";
export const revalidate = 60;
export default async function Jobs({ searchParams }: { searchParams: Promise<{ q?: string; view?: string }> }) {
 const { q = "", view = "table" } = await searchParams;
 const [jobs, settings] = await Promise.all([getPublishedJobs(q), getSettings()]);
 const query = q ? "q=" + encodeURIComponent(q) + "&" : "";
 return <><header className="header"><div className="wrap header-inner"><Link className="brand" href="/" aria-label="Rojgar Sathi home"><img className="brand-logo" src="/rojgar-sathi-logo.svg" alt="Rojgar Sathi" /></Link><Link className="text-link" href="/">← होम</Link></div></header><main className="wrap page">
 <div className="vacancy-page-heading"><div><span className="eyebrow">ROJGAR SATHI · LATEST UPDATES</span><h1 className="page-title">सरकारी नौकरियाँ</h1><p className="sub">नई भर्तियाँ, पदों की संख्या, योग्यता और अंतिम तिथि एक जगह देखें। आवेदन से पहले आधिकारिक अधिसूचना ज़रूर जाँचें।</p></div><div className="vacancy-count"><strong>{jobs.length}</strong><span>प्रकाशित भर्तियाँ</span></div></div>
 <form action="/jobs" className="page-tools"><input name="q" defaultValue={q} placeholder="भर्ती, संस्था, विभाग या योग्यता खोजें..." aria-label="भर्ती खोजें"/><button className="btn">खोजें</button></form>
 <div className="vacancy-inline-ad"><AdSlot enabled={settings.ads_enabled} client={settings.adsense_client} slot={settings.ad_slot_job} compact label="भर्ती सूची के बीच विज्ञापन"/></div>
 <div className="vacancy-toolbar"><div><strong>{q ? "“" + q + "” के परिणाम" : "लेटेस्ट वैकेंसी लिस्ट"}</strong><span>अंतिम तिथि और पदों की जानकारी</span></div><div className="vacancy-view-switch" aria-label="सूची का दृश्य"><Link aria-current={view !== "cards" ? "page" : undefined} className={view !== "cards" ? "selected" : ""} href={"/jobs?" + query + "view=table"}>टेबल व्यू</Link><Link aria-current={view === "cards" ? "page" : undefined} className={view === "cards" ? "selected" : ""} href={"/jobs?" + query + "view=cards"}>कार्ड व्यू</Link></div></div>
 {jobs.length ? (view === "cards" ? <div className="job-grid">{jobs.map((job: any) => <JobCard key={job.id} job={job}/>)}</div> : <JobTable jobs={jobs} />) : <div className="empty">इस खोज में कोई प्रकाशित भर्ती नहीं मिली। दूसरी भर्ती या विभाग का नाम खोजकर देखें।</div>}
 <div className="vacancy-inline-ad"><AdSlot enabled={settings.ads_enabled} client={settings.adsense_client} slot={settings.ad_slot_job} compact label="भर्ती सूची के अंत में विज्ञापन"/></div>
 </main></>;
}