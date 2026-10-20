import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

async function getContent(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("content_items").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getContent(slug);
  if (!item) return { title: "जानकारी उपलब्ध नहीं | Rojgar Sathi", robots: { index: false, follow: true } };
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://updated-rojgar.vercel.app").replace(/\/$/, "");
  return {
    title: item.title + " | Rojgar Sathi",
    description: (item.summary || item.eligibility || item.title).slice(0, 300),
    alternates: { canonical: site + "/updates/" + item.slug },
    openGraph: { title: item.title, description: item.summary || item.title, url: site + "/updates/" + item.slug, type: "article" }
  };
}

const labels: Record<string, string> = {
  scholarship: "छात्रवृत्ति", scheme: "सरकारी योजना", admission: "प्रवेश",
  university_update: "विश्वविद्यालय अपडेट", admit_card: "एडमिट कार्ड",
  result: "रिजल्ट", answer_key: "आंसर की", exam_update: "परीक्षा अपडेट",
  employment_update: "रोजगार अपडेट"
};

export default async function UpdateDetail({ params }: Props) {
  const { slug } = await params;
  const item = await getContent(slug);
  if (!item) notFound();

  return (
    <>
      <header className="header"><div className="wrap header-inner">
        <Link className="brand" href="/">रोज़गार साथी</Link>
        <Link className="text-link" href="/categories">← सभी श्रेणियाँ</Link>
      </div></header>
      <main className="wrap page">
        <article className="detail">
          <span className="tag">{labels[item.content_type] || "अपडेट"} · {item.government_level === "central" ? "केंद्र सरकार" : item.government_level === "state" ? (item.state_name || "राज्य सरकार") : item.government_level}</span>
          <h1 className="page-title">{item.title}</h1>
          <p className="sub">{item.department ? item.department + " · " : ""}अंतिम सत्यापन: {item.last_verified_at ? new Date(item.last_verified_at).toLocaleDateString("hi-IN") : "सत्यापन तिथि उपलब्ध नहीं"}</p>
          {item.image_url ? <img src={item.image_url} alt={item.title} style={{ width: "100%", maxHeight: 420, objectFit: "contain", margin: "18px 0", borderRadius: 12 }} /> : null}
          {item.summary ? <p className="org">{item.summary}</p> : null}
          {item.application_start || item.application_end ? <div className="detail-grid">
            {item.application_start ? <div className="detail-item"><small>आवेदन शुरू</small><strong>{item.application_start}</strong></div> : null}
            {item.application_end ? <div className="detail-item"><small>अंतिम तिथि</small><strong>{item.application_end}</strong></div> : null}
          </div> : null}
          {item.eligibility ? <><h2>पात्रता</h2><p style={{ whiteSpace: "pre-wrap" }}>{item.eligibility}</p></> : null}
          {item.benefits ? <><h2>लाभ / सहायता</h2><p style={{ whiteSpace: "pre-wrap" }}>{item.benefits}</p></> : null}
          {item.required_documents ? <><h2>आवश्यक दस्तावेज़</h2><p style={{ whiteSpace: "pre-wrap" }}>{item.required_documents}</p></> : null}
          {item.body ? <><h2>विस्तृत जानकारी</h2><p style={{ whiteSpace: "pre-wrap" }}>{item.body}</p></> : null}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
            {item.official_url ? <a className="btn" href={item.official_url} target="_blank" rel="noopener noreferrer">आधिकारिक वेबसाइट / आवेदन ↗</a> : null}
            {item.notification_url ? <a className="btn secondary" href={item.notification_url} target="_blank" rel="noopener noreferrer">आधिकारिक अधिसूचना ↗</a> : null}
          </div>
          <p className="sub" style={{ marginTop: 24 }}>आवेदन करने से पहले संबंधित सरकारी विभाग या संस्था के आधिकारिक पोर्टल पर पात्रता, तारीख, लाभ और शर्तों की पुष्टि करें।</p>
        </article>
      </main>
    </>
  );
}
