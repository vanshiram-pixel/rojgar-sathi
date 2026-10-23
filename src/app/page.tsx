import Link from "next/link";
import { Search, BriefcaseBusiness, GraduationCap, Trophy, ArrowUpRight, ShieldCheck, ClipboardList, BookOpenCheck, Landmark, TrainFront, Stethoscope, GraduationCap as TeacherIcon, Shield, Building2 } from "lucide-react";
import { getPublishedJobs, getSettings } from "@/lib/data";
import { JobTable } from "@/components/JobTable";
import { AdSlot } from "@/components/AdSlot";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;

const departments = [
  { title: "Defence Jobs", hindi: "रक्षा भर्ती", href: "/category/defence-jobs", detail: "Army, Navy, Air Force, Coast Guard, DRDO", icon: Shield },
  { title: "Police & Paramilitary", hindi: "पुलिस एवं अर्धसैनिक बल", href: "/category/police-paramilitary-jobs", detail: "Constable, SI, CAPF और अन्य पद", icon: ShieldCheck },
  { title: "Railway Jobs", hindi: "रेलवे भर्ती", href: "/category/railway-jobs", detail: "RRB, RRC, NTPC, ALP, Technician", icon: TrainFront },
  { title: "Teaching Jobs", hindi: "शिक्षक एवं शिक्षा विभाग", href: "/category/teaching-jobs", detail: "Teacher, Lecturer, Professor, TET", icon: TeacherIcon },
  { title: "Banking & Insurance", hindi: "बैंकिंग एवं बीमा", href: "/category/banking-insurance-jobs", detail: "Bank, RBI, Insurance और वित्तीय संस्थान", icon: Landmark },
  { title: "SSC & Staff Selection", hindi: "SSC एवं कर्मचारी चयन", href: "/category/ssc-staff-selection-jobs", detail: "CGL, CHSL, MTS और अन्य परीक्षाएँ", icon: ClipboardList },
  { title: "Health & Medical", hindi: "स्वास्थ्य एवं चिकित्सा", href: "/category/health-medical-jobs", detail: "Nursing, Medical, Pharmacist, Technician", icon: Stethoscope },
  { title: "PSU & Government Companies", hindi: "PSU एवं सरकारी कंपनियाँ", href: "/category/psu-government-company-jobs", detail: "Power, Oil, Mining और सार्वजनिक उपक्रम", icon: Building2 },
];

const updates = [
  { title: "Admit Card & Exam City", detail: "प्रवेश-पत्र, परीक्षा शहर और हॉल टिकट", href: "/category/admit-card", icon: ClipboardList },
  { title: "Results & Merit Lists", detail: "परिणाम, चयन सूची और कटऑफ", href: "/category/result", icon: Trophy },
  { title: "Answer Keys", detail: "उत्तर कुंजी और आपत्ति की जानकारी", href: "/category/answer-key", icon: BookOpenCheck },
  { title: "Scholarships & Admissions", detail: "छात्रवृत्ति, प्रवेश और काउंसलिंग", href: "/category/scholarship", icon: GraduationCap },
  { title: "Government Schemes", detail: "केंद्र और राज्य सरकार की योजनाएँ", href: "/category/government-schemes", icon: Landmark },
  { title: "University Updates", detail: "विश्वविद्यालय, कॉलेज और परीक्षा अपडेट", href: "/category/university-updates", icon: BookOpenCheck },
];

const qualifications = [
  ["8वीं पास", "/category/8th-pass-jobs"],
  ["10वीं पास", "/category/10th-pass-jobs"],
  ["12वीं पास", "/category/12th-pass-jobs"],
  ["ITI", "/category/iti-jobs"],
  ["डिप्लोमा", "/category/diploma-jobs"],
  ["ग्रेजुएट", "/category/graduate-jobs"],
  ["पोस्ट ग्रेजुएट", "/category/postgraduate-jobs"],
];

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string; email_verified?: string }> }) {
  const { q = "", email_verified = "" } = await searchParams;
  const [settings, jobs] = await Promise.all([getSettings(), getPublishedJobs(q)]);
  let departmentLinks = departments;
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("portal_categories").select("name,slug,description").eq("category_type", "department").eq("is_active", true).order("sort_order");
    if (data?.length) {
      const iconBySlug: Record<string, typeof Shield> = {
        "defence-jobs": Shield, "police-paramilitary-jobs": ShieldCheck, "railway-jobs": TrainFront,
        "teaching-jobs": TeacherIcon, "banking-insurance-jobs": Landmark, "health-medical-jobs": Stethoscope,
        "psu-government-company-jobs": Building2,
      };
      departmentLinks = data.map((item: any) => ({
        title: item.name,
        hindi: item.name,
        href: `/category/${item.slug}`,
        detail: item.description,
        icon: iconBySlug[item.slug] || BriefcaseBusiness,
      }));
    }
  } catch {}

  return <>
    <div className="topbar"><div className="wrap topbar-inner"><span>{settings.topbar_text || "रोज़गार, परीक्षा और छात्रवृत्ति की जानकारी"}</span><span><ShieldCheck size={13} /> आवेदन से पहले आधिकारिक सूचना जाँचें</span></div></div>
    <header className="header"><div className="wrap header-inner">
      <Link className="brand" href="/"><img className="brand-logo" src="/rojgar-sathi-logo.svg" alt="Rojgar Sathi logo" /><span className="brand-tagline">{settings.tagline}</span></Link>
      <nav className="nav">
        <Link href="/jobs">Latest Jobs</Link>
        <Link href="/categories">विभाग व श्रेणियाँ</Link>
        <Link href="/category/admit-card">Admit Card</Link>
        <Link href="/category/result">Results</Link>
        <Link href="/category/scholarship">Scholarships</Link>
        <Link href="/category/government-schemes">Schemes</Link>
        <Link href="/login">लॉगिन / अकाउंट</Link>
      </nav>
      <div className="mobile-auth"><Link href="/login">लॉगिन / अकाउंट</Link><Link className="mobile-menu text-link" href="/categories">श्रेणियाँ →</Link></div>
    </div></header>
    <main>
      {email_verified === "1" && <div className="wrap" style={{ paddingTop: 16 }}><div className="notice" role="status">ईमेल सफलतापूर्वक सत्यापित हो गया है। Rojgar Sathi में आपका स्वागत है। अब लॉगिन करके अपनी प्रोफाइल और डैशबोर्ड देख सकते हैं। <Link className="text-link" href="/login">लॉगिन करें →</Link></div></div>}
      <section className="portal-hero"><div className="wrap">
        <div className="portal-intro"><div><span className="eyebrow"><BriefcaseBusiness size={14} /> Rojgar Sathi · भर्ती और परीक्षा सूचना</span><h1>{settings.home_hero_title}</h1><p>{settings.home_hero_subtitle}</p></div>
          <div className="portal-trust"><ShieldCheck size={25}/><strong>स्रोत-आधारित जानकारी</strong><small>आवेदन करने से पहले मूल अधिसूचना और पात्रता की पुष्टि करें।</small></div>
        </div>
        <form action="/search" className="searchbar"><Search size={20} className="search-icon"/><input name="q" defaultValue={q} placeholder="भर्ती, विभाग, पद या योग्यता खोजें..." /><button className="btn" type="submit">खोजें <ArrowUpRight size={17}/></button></form>
        <div className="portal-shortcuts">
          <Link href="/jobs"><BriefcaseBusiness/>सभी नई भर्तियाँ</Link>
          <Link href="/categories"><Building2/>विभाग के अनुसार</Link>
          <Link href="/category/admit-card"><ClipboardList/>एडमिट कार्ड</Link>
          <Link href="/category/result"><Trophy/>परिणाम</Link>
        </div>
      </div></section>
      <div className="wrap portal-ad"><AdSlot enabled={settings.ads_enabled} client={settings.adsense_client} slot={settings.ad_slot_home}/></div>
      <section className="section portal-section"><div className="wrap"><div className="section-head"><div><h2>{q ? `“${q}” के खोज परिणाम` : "लेटेस्ट सरकारी भर्तियाँ"}</h2><div className="sub">पद, संस्था, योग्यता और आवेदन की समय-सीमा के आधार पर अवसर खोजें।</div></div><Link className="text-link" href="/jobs">सभी भर्तियाँ →</Link></div>
        {jobs.length ? <JobTable jobs={jobs.slice(0, 10)} label="होमपेज की लेटेस्ट भर्तियाँ" /> : <div className="empty"><BriefcaseBusiness size={30} style={{ margin: "0 auto 12px" }}/><strong className="empty-title">अभी कोई प्रकाशित भर्ती उपलब्ध नहीं है</strong><span>प्रकाशित भर्तियाँ उपलब्ध होने पर यहाँ दिखाई देंगी।</span></div>}
      </div></section>
      <section className="section portal-section portal-categories"><div className="wrap"><div className="section-head"><div><h2>विभाग के अनुसार भर्ती</h2><div className="sub">अपनी रुचि के विभाग को चुनें। प्रत्येक विभाग के पेज पर उसी से जुड़ी भर्तियाँ और अपडेट होने चाहिए।</div></div><Link className="text-link" href="/categories">सभी विभाग →</Link></div>
        <div className="department-grid">{departmentLinks.map((item: any) => { const Icon = item.icon; return <Link className="department-card" href={item.href} key={item.href}><span className="department-icon"><Icon size={20}/></span><span className="department-copy"><strong>{item.hindi || item.title}</strong><small>{item.detail}</small></span><ArrowUpRight size={16}/></Link>; })}</div>
      </div></section>
      <section className="section portal-section"><div className="wrap"><div className="section-head"><div><h2>परीक्षा और विद्यार्थी अपडेट</h2><div className="sub">भर्ती के बाद की प्रक्रिया और शिक्षा संबंधी जरूरी सूचनाएँ।</div></div></div><div className="update-grid">
        {updates.map((item) => { const Icon = item.icon; return <Link className="update-card" href={item.href} key={item.href}><Icon size={21}/><strong>{item.title}</strong><span>{item.detail}</span><small>अपडेट देखें <ArrowUpRight size={13}/></small></Link>; })}
      </div></div></section>
      <section className="section portal-section"><div className="wrap"><div className="section-head"><div><h2>योग्यता के अनुसार अवसर</h2><div className="sub">अपनी शैक्षणिक योग्यता के आधार पर भर्ती खोजें; पात्रता हमेशा आधिकारिक विज्ञापन से जाँचें।</div></div></div><div className="qualification-list">
        {qualifications.map(([label, href]) => <Link href={href} key={href}>{label}<ArrowUpRight size={14}/></Link>)}
      </div></div></section>
    </main>
    <footer className="footer"><div className="wrap footer-inner"><div><img className="brand-logo footer-logo" src="/rojgar-sathi-logo.svg" alt="Rojgar Sathi" /><p className="footer-description">{settings.tagline}. हम उपयोगकर्ताओं को आधिकारिक स्रोतों तक पहुँचने में सहायता करते हैं।</p></div><div className="footer-links"><Link href="/categories">सभी विभाग और राज्य</Link><Link href="/privacy">गोपनीयता नीति</Link><Link href="/terms">नियम एवं शर्तें</Link><Link href="/disclaimer">अस्वीकरण</Link><Link href="/contact">संपर्क करें</Link><small>{settings.footer_text || "किसी भी भर्ती की पुष्टि संबंधित आधिकारिक वेबसाइट से करें।"}</small></div></div></footer>
  </>;
}
