import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { JobCard } from "@/components/JobCard";

export const revalidate = 60;

export default async function UnifiedSearch({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const term = q.trim().replaceAll("%"," ").replaceAll("_"," ").replaceAll(","," ").replaceAll("."," ").replaceAll(":"," ").replaceAll("("," ").replaceAll(")"," ").replaceAll("\\"," ").replaceAll("*"," ").replaceAll('"'," ");
  const supabase = await createClient();
  let jobs: any[] = [];
  let items: any[] = [];

  try {
    let query = supabase.from("jobs").select("*").eq("status", "published").order("created_at", { ascending: false }).limit(50);
    if (term) query = query.or("title.ilike.%" + term + "%,organization.ilike.%" + term + "%,category.ilike.%" + term + "%,department.ilike.%" + term + "%,qualification.ilike.%" + term + "%");
    const result = await query;
    jobs = result.data || [];
  } catch {
    jobs = [];
  }

  try {
    let query = supabase.from("content_items").select("*").eq("status", "published").order("created_at", { ascending: false }).limit(50);
    if (term) query = query.or("title.ilike.%" + term + "%,summary.ilike.%" + term + "%,department.ilike.%" + term + "%,state_name.ilike.%" + term + "%,body.ilike.%" + term + "%");
    const result = await query;
    items = result.data || [];
  } catch {
    items = [];
  }

  return (
    <>
      <header className="header"><div className="wrap header-inner">
        <Link className="brand" href="/" aria-label="Rojgar Sathi home"><img className="brand-logo" src="/rojgar-sathi-logo.svg" alt="Rojgar Sathi" /></Link>
        <Link className="text-link" href="/categories">विभाग व श्रेणियाँ →</Link>
      </div></header>
      <main className="wrap page">
        <h1 className="page-title">सभी अपडेट खोजें</h1>
        <p className="sub">नौकरी, छात्रवृत्ति, सरकारी योजना, प्रवेश और परीक्षा अपडेट एक ही जगह खोजें।</p>
        <form action="/search" className="page-tools">
          <input name="q" defaultValue={q} placeholder="जैसे SSC, छात्रवृत्ति, राजस्थान, योजना…" aria-label="खोज शब्द" />
          <button className="btn" type="submit">खोजें</button>
        </form>
        {q ? <p className="sub">“{q}” के लिए {jobs.length + items.length} परिणाम मिले।</p> : <p className="sub">हाल की प्रकाशित जानकारी दिखाई जा रही है।</p>}

        <section className="section">
          <div className="section-head"><h2>नौकरियाँ ({jobs.length})</h2><Link className="text-link" href="/jobs">सभी नौकरियाँ →</Link></div>
          {jobs.length ? <div className="job-grid">{jobs.map((job) => <JobCard key={job.id} job={job} />)}</div> : <div className="empty">इस खोज में कोई प्रकाशित नौकरी नहीं मिली।</div>}
        </section>

        <section className="section">
          <div className="section-head"><h2>छात्रवृत्ति, योजनाएँ और अन्य अपडेट ({items.length})</h2><Link className="text-link" href="/category/government-schemes">सरकारी योजनाएँ →</Link></div>
          {items.length ? <div className="job-grid">{items.map((item) => (
            <article className="job-card" key={item.id}>
              {item.image_url ? <img src={item.image_url} alt={item.title} style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 10 }} /> : null}
              <span className="tag">{item.content_type.replace(/_/g, " ")} · {item.state_name || item.government_level}</span>
              <h3>{item.title}</h3>
              <p className="sub">{item.summary || item.eligibility || ""}</p>
              {item.application_end ? <p className="sub">अंतिम तिथि: {item.application_end}</p> : null}
              <Link className="text-link" href={"/updates/" + item.slug}>पूरी जानकारी →</Link>
            </article>
          ))}</div> : <div className="empty">इस खोज में कोई प्रकाशित योजना या विद्यार्थी अपडेट नहीं मिला।</div>}
        </section>
      </main>
    </>
  );
}
