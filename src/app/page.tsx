import Link from "next/link";
import { Search, BriefcaseBusiness, GraduationCap, FileCheck2, Trophy, ArrowUpRight, ShieldCheck, BellRing, ClipboardList, BookOpenCheck } from "lucide-react";
import { getPublishedJobs, getSettings } from "@/lib/data";
import { JobCard } from "@/components/JobCard";
import { AdSlot } from "@/components/AdSlot";

export const revalidate = 60;

const sections = [
  { title: "सरकारी नौकरी", items: [["Latest Jobs", "/jobs"], ["Rajasthan Govt Jobs", "/jobs"], ["Central Govt Jobs", "/jobs"], ["Upcoming Vacancies", "/jobs"]] },
  { title: "प्रवेश-पत्र व परिणाम", items: [["Admit Card", "/category/admit-card"], ["Latest Results", "/category/result"], ["Answer Key", "/category/answer-key"], ["Exam Schedule", "/jobs"]] },
  { title: "विद्यार्थी कॉर्नर", items: [["Scholarships", "/category/scholarship"], ["Admissions", "/jobs"], ["University Updates", "/jobs"], ["Syllabus & Exams", "/jobs"]] },
];

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [settings, jobs] = await Promise.all([getSettings(), getPublishedJobs(q)]);
  const nav = settings.navigation || [];
  return <>
    <div className="topbar"><div className="wrap topbar-inner"><span>रोज़गार, परीक्षा और छात्रवृत्ति की जानकारी</span><span><ShieldCheck size={13} /> आधिकारिक स्रोतों से पुष्टि करें</span></div></div>
    <header className="header"><div className="wrap header-inner">
      <Link className="brand" href="/">{settings.logo_url ? <img src={settings.logo_url} alt={settings.brand_name} style={{ width: 42, height: 42, objectFit: "contain" }} /> : <span className="brand-mark">RS</span>}<span>{settings.brand_name}<small className="brand-tagline">{settings.tagline}</small></span></Link>
      <nav className="nav">{nav.map((n, i) => <Link key={i} href={n.href}>{n.label}</Link>)}<Link href="/admin/login">Admin</Link></nav>
      <Link className="mobile-menu text-link" href="/jobs">नौकरियाँ →</Link>
    </div></header>
    <nav className="portal-nav"><div className="wrap portal-nav-inner">
      <Link href="/">होम</Link><Link href="/jobs">Latest Jobs</Link><Link href="/category/admit-card">Admit Card</Link><Link href="/category/result">Results</Link><Link href="/category/answer-key">Answer Key</Link><Link href="/category/scholarship">Scholarship</Link>
    </div></nav>
    <main>
      <section className="portal-hero"><div className="wrap">
        <div className="portal-intro"><div><span className="eyebrow"><BellRing size={14} /> रोज़गार साथी • Latest Updates</span><h1>{settings.home_hero_title}</h1><p>{settings.home_hero_subtitle}</p></div>
          <div className="portal-trust"><ShieldCheck size={25}/><strong>सही जानकारी, सही समय पर</strong><small>आवेदन से पहले आधिकारिक नोटिफिकेशन ज़रूर पढ़ें।</small></div>
        </div>
        <form action="/jobs" className="searchbar"><Search size={20} className="search-icon"/><input name="q" defaultValue={q} placeholder="भर्ती, विभाग, पद या योग्यता खोजें..." /><button className="btn" type="submit">खोजें <ArrowUpRight size={17}/></button></form>
        <div className="portal-shortcuts"><Link href="/jobs"><BriefcaseBusiness/>Latest Jobs</Link><Link href="/category/admit-card"><ClipboardList/>Admit Card</Link><Link href="/category/result"><Trophy/>Results</Link><Link href="/category/scholarship"><GraduationCap/>Scholarships</Link><Link href="/jobs"><BookOpenCheck/>Education Updates</Link></div>
      </div></section>
      <div className="wrap portal-ad"><AdSlot enabled={settings.ads_enabled} client={settings.adsense_client} slot={settings.ad_slot_home}/></div>
      <section className="section portal-section"><div className="wrap"><div className="section-head"><div><h2>{q ? `“${q}” के खोज परिणाम` : "लेटेस्ट सरकारी नौकरियाँ"}</h2><div className="sub">नई भर्ती, आवेदन की जानकारी और ज़रूरी अपडेट एक जगह।</div></div><Link className="text-link" href="/jobs">सभी नौकरियाँ देखें →</Link></div>
        {jobs.length ? <div className="job-grid">{jobs.slice(0, 6).map((job: any) => <JobCard key={job.id} job={job}/>)}</div> : <div className="empty"><BriefcaseBusiness size={30} style={{ margin: "0 auto 12px" }}/><strong className="empty-title">अभी कोई प्रकाशित भर्ती उपलब्ध नहीं है</strong><span>नई भर्ती अपडेट के लिए बाद में देखें।</span></div>}
      </div></section>
      <section className="section portal-section portal-categories"><div className="wrap"><div className="section-head"><div><h2>सभी महत्वपूर्ण अपडेट</h2><div className="sub">अपनी ज़रूरत के अनुसार जानकारी चुनें।</div></div></div><div className="portal-columns">
        {sections.map(section => <div className="portal-box" key={section.title}><h3>{section.title}</h3><ul>{section.items.map(([label, href]) => <li key={label}><Link href={href}>{label}<ArrowUpRight size={13}/></Link></li>)}</ul></div>)}
      </div></div></section>
      <section className="section portal-section"><div className="wrap"><div className="section-head"><div><h2>लोकप्रिय श्रेणियाँ</h2><div className="sub">नौकरी और परीक्षा से जुड़े सीधे लिंक।</div></div></div><div className="category-grid">
        {[[ "💼", "सरकारी नौकरी", "/jobs" ], [ "🎫", "एडमिट कार्ड", "/category/admit-card" ], [ "🏆", "रिजल्ट", "/category/result" ], [ "🎓", "छात्रवृत्ति", "/category/scholarship" ]].map(([icon, label, href]) => <Link className="category" href={href} key={href}><span>{icon}</span>{label}<ArrowUpRight size={15}/></Link>)}
      </div></div></section>
    </main>
    <footer className="footer"><div className="wrap footer-inner"><div><div className="brand footer-brand"><span className="brand-mark">RS</span>{settings.brand_name}</div><p className="footer-description">{settings.tagline}. हम उपयोगकर्ताओं को आधिकारिक स्रोतों तक पहुँचने में सहायता करते हैं।</p></div><div className="footer-links"><Link href="/privacy">गोपनीयता नीति</Link><Link href="/disclaimer">अस्वीकरण</Link><small>किसी भी भर्ती की पुष्टि संबंधित आधिकारिक वेबसाइट से करें।</small></div></div></footer>
  </>;
}
