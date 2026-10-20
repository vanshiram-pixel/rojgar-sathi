import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Building2, GraduationCap, Users, ExternalLink, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data";
import { AdSlot } from "@/components/AdSlot";

export const revalidate = 60;

type Job = {
  id: string; title: string; organization: string; category: string; location: string;
  vacancies: string; qualification: string; application_start: string | null;
  application_end: string | null; exam_date: string | null; official_url: string;
  notification_url: string; description: string; status: string; updated_at?: string;
};

async function getJob(id: string): Promise<Job | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("jobs").select("*").eq("id", id).eq("status", "published").maybeSingle();
    if (error || !data) return null;
    return data as Job;
  } catch { return null; }
}

function dateLabel(value: string | null) {
  if (!value) return "आधिकारिक अधिसूचना देखें";
  const date = new Date(value + "T00:00:00");
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric" });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) return { title: "भर्ती उपलब्ध नहीं | Rojgar Sathi", robots: { index: false, follow: true } };
  const settings = await getSettings();
  const description = [job.organization, job.qualification, job.application_end ? "अंतिम तिथि " + dateLabel(job.application_end) : ""].filter(Boolean).join(" · ").slice(0, 155);
  return {
    title: `${job.title} | ${settings.brand_name}`,
    description: description || `${job.title} की भर्ती जानकारी, पात्रता, तिथि और आधिकारिक आवेदन लिंक।`,
    alternates: { canonical: `/jobs/${job.id}` },
    openGraph: { title: `${job.title} | ${settings.brand_name}`, description: description || job.title, type: "article" }
  };
}

export default async function JobDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) notFound();
  const settings = await getSettings();
  const jsonLd = {
    "@context": "https://schema.org", "@type": "JobPosting", title: job.title,
    description: job.description || job.qualification || job.title,
    datePosted: job.updated_at || undefined,
    validThrough: job.application_end ? new Date(job.application_end + "T23:59:59").toISOString() : undefined,
    hiringOrganization: { "@type": "Organization", name: job.organization || "संबंधित विभाग" },
    employmentType: "FULL_TIME",
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.location || "India", addressCountry: "IN" } },
    url: job.official_url || undefined
  };
  return <>
    <header className="header"><div className="wrap header-inner"><Link className="brand" href="/"><span className="brand-mark">RS</span>{settings.brand_name}</Link><Link className="text-link" href="/jobs">← सभी भर्तियाँ</Link></div></header>
    <main className="wrap page">
      <nav aria-label="Breadcrumb" className="sub"><Link href="/">होम</Link> / <Link href="/jobs">सरकारी नौकरियाँ</Link> / भर्ती विवरण</nav>
      <article className="admin-card" style={{ marginTop: 18 }}>
        <span className="tag">{job.category || "सरकारी नौकरी"}</span>
        <h1 className="page-title" style={{ marginTop: 12 }}>{job.title}</h1>
        <p className="sub">{job.organization || "संबंधित विभाग"} · अंतिम अपडेट: {dateLabel(job.updated_at || null)}</p>
        <div className="form-grid" style={{ marginTop: 24 }}>
          <div><p className="sub"><Building2 size={15} style={{ display: "inline" }} /> विभाग / संस्था</p><strong>{job.organization || "अधिसूचना देखें"}</strong></div>
          <div><p className="sub"><MapPin size={15} style={{ display: "inline" }} /> स्थान</p><strong>{job.location || "भारत"}</strong></div>
          <div><p className="sub"><Users size={15} style={{ display: "inline" }} /> कुल पद</p><strong>{job.vacancies || "अधिसूचना देखें"}</strong></div>
          <div><p className="sub"><GraduationCap size={15} style={{ display: "inline" }} /> योग्यता</p><strong>{job.qualification || "आधिकारिक नोटिफिकेशन देखें"}</strong></div>
          <div><p className="sub"><CalendarDays size={15} style={{ display: "inline" }} /> आवेदन शुरू</p><strong>{dateLabel(job.application_start)}</strong></div>
          <div><p className="sub"><CalendarDays size={15} style={{ display: "inline" }} /> अंतिम तिथि</p><strong>{dateLabel(job.application_end)}</strong></div>
          <div><p className="sub"><CalendarDays size={15} style={{ display: "inline" }} /> परीक्षा तिथि</p><strong>{dateLabel(job.exam_date)}</strong></div>
        </div>
        {job.description ? <section style={{ marginTop: 28 }}><h2>भर्ती का विवरण</h2><div style={{ whiteSpace: "pre-wrap", lineHeight: 1.85 }}>{job.description}</div></section> : null}
        <div className="job-actions" style={{ justifyContent: "flex-start", flexWrap: "wrap", marginTop: 26 }}>
          {job.official_url ? <a className="btn" href={job.official_url} target="_blank" rel="noopener noreferrer">आधिकारिक वेबसाइट <ExternalLink size={16} /></a> : null}
          {job.notification_url ? <a className="small-btn" href={job.notification_url} target="_blank" rel="noopener noreferrer"><FileText size={15} /> आधिकारिक नोटिफिकेशन</a> : null}
          {!job.official_url && !job.notification_url ? <p className="sub">आधिकारिक आवेदन/नोटिफिकेशन लिंक अभी उपलब्ध नहीं है। आवेदन से पहले संबंधित विभाग की वेबसाइट पर पुष्टि करें।</p> : null}
        </div>
      </article>
      <p className="sub" style={{ marginTop: 18 }}>महत्वपूर्ण: यह सूचना-सहायक वेबसाइट है, सरकारी वेबसाइट नहीं। पात्रता, शुल्क, तारीख और आवेदन प्रक्रिया को आधिकारिक नोटिफिकेशन से अवश्य सत्यापित करें।</p>
      <AdSlot enabled={settings.ads_enabled} client={settings.adsense_client} slot={settings.ad_slot_job} />
    </main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
  </>;
}
