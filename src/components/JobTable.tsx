import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";

type Job = {
  id: string;
  title: string;
  organization?: string | null;
  department?: string | null;
  category?: string | null;
  location?: string | null;
  vacancies?: string | number | null;
  qualification?: string | null;
  application_start?: string | null;
  application_end?: string | null;
  featured?: boolean | null;
  status?: string | null;
  apply_url?: string | null;
  official_url?: string | null;
  notification_url?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "अधिसूचना देखें";
  const date = new Date(value.slice(0, 10) + "T00:00:00");
  return Number.isNaN(date.getTime())
    ? "अधिसूचना देखें"
    : date.toLocaleDateString("hi-IN", { day: "numeric", month: "short", year: "numeric" });
}

function safeExternalUrl(...values: (string | null | undefined)[]) {
  for (const value of values) {
    if (!value) continue;
    try {
      const url = new URL(value);
      if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
    } catch {
      // Ignore malformed or non-HTTP(S) links from stored recruitment data.
    }
  }
  return null;
}

export function JobTable({ jobs, label = "लेटेस्ट सरकारी भर्तियाँ" }: { jobs: Job[]; label?: string }) {
  if (!jobs.length) {
    return <div className="empty">अभी कोई प्रकाशित भर्ती उपलब्ध नहीं है। नई भर्तियाँ प्रकाशित होने पर यहाँ दिखाई देंगी।</div>;
  }

  return (
    <div className="vacancy-table-shell">
      <div className="vacancy-table-scroll">
        <table className="vacancy-table">
          <caption className="sr-only">{label}</caption>
          <thead>
            <tr>
              <th scope="col">क्र.</th>
              <th scope="col">भर्ती / संस्था</th>
              <th scope="col">विभाग</th>
              <th scope="col">कुल पद</th>
              <th scope="col">योग्यता</th>
              <th scope="col">आवेदन शुरू</th>
              <th scope="col">अंतिम तिथि</th>
              <th scope="col">स्थिति</th>
              <th scope="col">विवरण / आवेदन</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job, index) => {
              const directApplyUrl = safeExternalUrl(job.apply_url);
              const referenceUrl = safeExternalUrl(job.official_url, job.notification_url);
              const applyUrl = directApplyUrl || referenceUrl;
              return (
                <tr key={job.id}>
                  <td>{index + 1}</td>
                  <td>
                    <Link className="vacancy-title-link" href={`/jobs/${job.id}`}>{job.title}</Link>
                    <span className="vacancy-org">{job.organization || "विभाग की आधिकारिक सूचना देखें"}</span>
                    <span className="vacancy-tags">
                      {job.featured ? <span className="vacancy-featured">★ प्रमुख भर्ती</span> : null}
                      <span>{job.category || "सरकारी नौकरी"}</span>
                    </span>
                  </td>
                  <td>{job.department || "—"}</td>
                  <td>{job.vacancies || "—"}</td>
                  <td>{job.qualification || "अधिसूचना देखें"}</td>
                  <td><span className="vacancy-date"><CalendarDays size={14} />{formatDate(job.application_start)}</span></td>
                  <td><span className="vacancy-date"><CalendarDays size={14} />{formatDate(job.application_end)}</span></td>
                  <td><span className="vacancy-status">{job.status === "published" ? "प्रकाशित" : job.status || "उपलब्ध"}</span></td>
                  <td>
                    <div className="vacancy-actions">
                      <Link className="vacancy-open" href={`/jobs/${job.id}`}>विवरण <ArrowUpRight size={14} /></Link>
                      {applyUrl ? <a className="vacancy-open" href={applyUrl} target="_blank" rel="noopener noreferrer">{directApplyUrl ? "आवेदन ↗" : "आधिकारिक लिंक ↗"}</a> : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="vacancy-mobile-list" aria-label={label}>
        {jobs.map((job, index) => {
          const directApplyUrl = safeExternalUrl(job.apply_url);
              const referenceUrl = safeExternalUrl(job.official_url, job.notification_url);
              const applyUrl = directApplyUrl || referenceUrl;
          return (
            <article className="vacancy-mobile-card" key={job.id}>
              <div className="vacancy-mobile-meta">
                <span>#{index + 1} · {job.category || "सरकारी नौकरी"}</span>
                {job.featured ? <span className="vacancy-featured">★ प्रमुख</span> : null}
              </div>
              <h3><Link href={`/jobs/${job.id}`}>{job.title}</Link></h3>
              <p className="vacancy-org">{job.organization || "विभाग की आधिकारिक सूचना देखें"}</p>
              <div className="vacancy-mobile-facts">
                <span><b>विभाग</b>{job.department || "—"}</span>
                <span><b>कुल पद</b>{job.vacancies || "—"}</span>
                <span><b>योग्यता</b>{job.qualification || "अधिसूचना देखें"}</span>
                <span><b>स्थान</b><MapPin size={13} />{job.location || "भारत"}</span>
                <span><b>आवेदन शुरू</b><CalendarDays size={13} />{formatDate(job.application_start)}</span>
                <span><b>अंतिम तिथि</b><CalendarDays size={13} />{formatDate(job.application_end)}</span>
              </div>
              <div className="vacancy-mobile-actions">
                <Link className="vacancy-mobile-action" href={`/jobs/${job.id}`}>पूरी जानकारी <ArrowUpRight size={15} /></Link>
                {applyUrl ? <a className="vacancy-mobile-action" href={applyUrl} target="_blank" rel="noopener noreferrer">{directApplyUrl ? "आवेदन करें ↗" : "आधिकारिक लिंक ↗"}</a> : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
