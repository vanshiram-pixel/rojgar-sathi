import Link from "next/link";
import { Search, BriefcaseBusiness, GraduationCap, FileCheck2, Trophy, ArrowUpRight, ShieldCheck } from "lucide-react";
import { getPublishedJobs, getSettings } from "@/lib/data";
import { JobCard } from "@/components/JobCard";
import { AdSlot } from "@/components/AdSlot";
export const revalidate = 60;
export default async function Home({searchParams}:{searchParams:Promise<{q?:string}>}) {
  const {q=""}=await searchParams; const [settings,jobs]=await Promise.all([getSettings(),getPublishedJobs(q)]);
  const nav = settings.navigation || [];
  return <>
    <div className="topbar"><div className="wrap">विश्वसनीय जानकारी • आधिकारिक नोटिफिकेशन लिंक • हिंदी और English</div></div>
    <header className="header"><div className="wrap header-inner">
      <Link className="brand" href="/">{settings.logo_url?<img src={settings.logo_url} alt={settings.brand_name} style={{width:42,height:42,objectFit:"contain"}}/>:<span className="brand-mark">UR</span>}<span>{settings.brand_name}<small style={{display:"block",fontSize:10,color:"var(--muted)",fontWeight:500,letterSpacing:0}}>{settings.tagline}</small></span></Link>
      <nav className="nav">{nav.map((n,i)=><Link key={i} href={n.href}>{n.label}</Link>)}<Link href="/admin/login">Admin</Link></nav>
      <Link className="mobile-menu text-link" href="/jobs">नौकरियाँ →</Link>
    </div></header>
    <main>
      <section className="hero"><div className="wrap hero-grid"><div>
        <span className="eyebrow"><ShieldCheck size={14}/> नौकरी की जानकारी, एक ही जगह</span>
        <h1>{settings.home_hero_title}</h1><p>{settings.home_hero_subtitle}</p>
        <form action="/jobs" className="searchbar"><Search size={20} style={{alignSelf:"center",marginLeft:10,color:"#718096"}}/><input name="q" defaultValue={q} placeholder="नौकरी, विभाग या योग्यता खोजें..."/><button className="btn" type="submit">खोजें <ArrowUpRight size={17}/></button></form>
      </div><div className="hero-panel"><div className="panel-title">आपको यहाँ क्या मिलेगा?</div>
        <div className="quick-stat"><div className="stat-icon"><BriefcaseBusiness/></div><div><strong>सरकारी भर्ती</strong><small>नई भर्तियाँ और आवेदन की तारीखें</small></div></div>
        <div className="quick-stat"><div className="stat-icon"><FileCheck2/></div><div><strong>एडमिट कार्ड और रिजल्ट</strong><small>परीक्षा से जुड़ी महत्वपूर्ण जानकारी</small></div></div>
        <div className="quick-stat"><div className="stat-icon"><GraduationCap/></div><div><strong>छात्रवृत्ति और प्रवेश</strong><small>विद्यार्थियों के लिए अपडेट</small></div></div>
        <div className="quick-stat"><div className="stat-icon"><Trophy/></div><div><strong>परीक्षा की तैयारी</strong><small>करियर की दिशा में अगला कदम</small></div></div>
      </div></div></section>
      <div className="wrap"><AdSlot enabled={settings.ads_enabled} client={settings.adsense_client} slot={settings.ad_slot_home}/></div>
      <section className="section"><div className="wrap"><div className="section-head"><div><h2>{q?`“${q}” के खोज परिणाम`:"लेटेस्ट सरकारी नौकरियाँ"}</h2><div className="sub">आवेदन करने से पहले आधिकारिक अधिसूचना अवश्य जाँचें।</div></div><Link className="text-link" href="/jobs">सभी नौकरियाँ →</Link></div>
        {jobs.length?<div className="job-grid">{jobs.slice(0,6).map((job:any)=><JobCard key={job.id} job={job}/>)}</div>:<div className="empty"><BriefcaseBusiness size={30} style={{margin:"0 auto 12px"}}/><strong style={{display:"block",color:"var(--ink)"}}>अभी कोई प्रकाशित भर्ती उपलब्ध नहीं है</strong><span>नई भर्ती अपडेट के लिए बाद में देखें।</span></div>}
      </div></section>
      <section className="section" style={{paddingTop:0}}><div className="wrap"><div className="section-head"><div><h2>महत्वपूर्ण श्रेणियाँ</h2><div className="sub">अपनी ज़रूरत के अनुसार जानकारी खोजें।</div></div></div><div className="category-grid">
        {[["💼","सरकारी नौकरी","/jobs"],["🎫","एडमिट कार्ड","/category/admit-card"],["🏆","रिजल्ट","/category/result"],["🎓","स्कॉलरशिप","/category/scholarship"]].map(([icon,label,href])=><Link className="category" href={href} key={href}><span>{icon}</span>{label}</Link>)}
      </div></div></section>
    </main>
    <footer className="footer"><div className="wrap footer-inner"><div><div className="brand" style={{color:"#fff"}}><span className="brand-mark">UR</span>{settings.brand_name}</div><p style={{maxWidth:450,lineHeight:1.8}}>{settings.tagline}. हम उपयोगकर्ताओं को आधिकारिक स्रोतों तक पहुँचने में सहायता करते हैं।</p></div><div><Link href="/privacy">गोपनीयता नीति</Link>　<Link href="/disclaimer">अस्वीकरण</Link><br/><small>किसी भी भर्ती की पुष्टि संबंधित आधिकारिक वेबसाइट से करें।</small></div></div></footer>
  </>;
}