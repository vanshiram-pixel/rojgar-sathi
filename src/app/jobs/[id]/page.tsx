import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdSlot } from "@/components/AdSlot";

export const revalidate = 60;

async function getJob(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  return data;
}

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) return { title: "नौकरी उपलब्ध नहीं है | Rojgar Sathi", robots: { index: false, follow: true } };

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://updated-rojgar.vercel.app").replace(/\/$/, "");
  const title = `${job.title} – ${job.organization} भर्ती | Rojgar Sathi`;
  const description = [job.organization, job.vacancies ? `कुल पद: ${job.vacancies}` : "", job.qualification ? `योग्यता: ${job.qualification}` : "", job.application_end ? `अंतिम तिथि: ${job.application_end}` : ""].filter(Boolean).join("। ").slice(0, 300);
  return {
    title,
    description: description || `${job.title} की पात्रता, आवेदन तिथि और आधिकारिक सूचना Rojgar Sathi पर देखें।`,
    alternates: { canonical: `${siteUrl}/jobs/${job.id}` },
    openGraph: { title, description, type: "article", url: `${siteUrl}/jobs/${job.id}` },
    robots: { index: true, follow: true },
  };
}

const displayDate = (value: string | null | undefined) =>
  value ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric" }) : "आधिकारिक अधिसूचना देखें";

export default async function JobDetail({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: job }, { data: settings }] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", id).eq("status", "published").maybeSingle(),
    supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
  ]);
  if (!job) notFound();

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://updated-rojgar.vercel.app").replace(/\/$/, "");
  const validThrough = job.valid_through || job.application_end || undefined;
  const jobPosting: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description || `${job.title} – विस्तृत जानकारी और पात्रता के लिए आधिकारिक अधिसूचना देखें।`,
    identifier: { "@type": "PropertyValue", name: job.organization, value: String(job.id) },
    hiringOrganization: { "@type": "Organization", name: job.organization },
    url: `${siteUrl}/jobs/${job.id}`,
    datePosted: job.created_at ? new Date(job.created_at).toISOString() : undefined,
    validThrough: validThrough ? new Date(validThrough).toISOString() : undefined,
  };
  if (job.location) {
    jobPosting.jobLocation = {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: job.location, addressCountry: "IN" },
    };
  }
  if (job.salary) jobPosting.baseSalary = { "@type": "MonetaryAmount", currency: "INR", value: { "@type": "QuantitativeValue", value: job.salary } };
  if (job.official_url) jobPosting.applicationContact = { "@type": "ContactPoint", url: job.official_url };
  const safeJobPosting = JSON.stringify(jobPosting, (_key, value) => value === undefined ? undefined : value).replace(/</g, "\\u003c");

  const facts: [string, string][] = [
    ["कुल पद", job.vacancies ? String(job.vacancies) : ""],
    ["विभाग", job.department || ""],
    ["भर्ती का प्रकार", job.recruitment_type || ""],
    ["योग्यता", job.qualification || ""],
    ["आयु सीमा", job.age_limit || ""],
    ["आवेदन शुल्क", job.application_fee || ""],
    ["वेतन", job.salary || ""],
    ["आवेदन शुरू", job.application_start ? displayDate(job.application_start) : ""],
    ["अंतिम तिथि", job.application_end ? displayDate(job.application_end) : ""],
    ["परीक्षा तिथि", job.exam_date ? displayDate(job.exam_date) : ""],
    ["चयन प्रक्रिया", job.selection_process || ""],
    ["कार्य स्थान", job.location || ""],
  ].filter((entry): entry is [string, string] => entry[1].trim().length > 0);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJobPosting }} />
      <header className="header">
        <div className="wrap header-inner">
          <Link className="brand" href="/" aria-label="Rojgar Sathi home"><img className="brand-logo" src="/rojgar-sathi-logo.svg" alt="Rojgar Sathi" /></Link>
          <Link className="text-link" href="/jobs">← सभी नौकरियाँ</Link>
        </div>
      </header>
      <main className="wrap page">
        <article className="detail">
          <span className="tag">{job.category || job.department || "सरकारी नौकरी"}</span>
          <h1>{job.title}</h1>
          <p className="org">{job.organization}</p>
          <p className="sub">अपडेट: {displayDate(job.last_verified_at || job.updated_at || job.created_at)}</p>
          <h2>भर्ती की मुख्य जानकारी</h2>
          <div className="detail-grid">
            {facts.map(([label, value]) => (
              <div className="detail-item" key={label}><small>{label}</small><strong>{value}</strong></div>
            ))}
          </div>
          <h2>भर्ती का विवरण</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{job.description || "विस्तृत जानकारी के लिए आधिकारिक अधिसूचना देखें।"}</p>
          {job.official_source ? <p><strong>आधिकारिक स्रोत: </strong>{job.official_source}</p> : null}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
            {job.official_url ? <a className="btn" href={job.official_url} target="_blank" rel="noopener noreferrer">आधिकारिक वेबसाइट ↗</a> : null}
            {job.notification_url ? <a className="btn secondary" href={job.notification_url} target="_blank" rel="noopener noreferrer">अधिसूचना डाउनलोड ↗</a> : null}
            {job.apply_url ? <a className="btn" href={job.apply_url} target="_blank" rel="noopener noreferrer">आवेदन करें ↗</a> : null}
          </div>
          <p className="sub">महत्वपूर्ण: आवेदन से पहले विभाग की आधिकारिक अधिसूचना से पात्रता, तारीख, शुल्क और अन्य शर्तों की पुष्टि करें। यह पृष्ठ जानकारी के लिए है; भर्ती की शर्तें संबंधित विभाग की अधिसूचना के अनुसार मान्य होंगी।</p>
        </article>
        <AdSlot enabled={settings?.ads_enabled || false} client={settings?.adsense_client || ""} slot={settings?.ad_slot_job || ""} />
      </main>
    </>
  );
}
