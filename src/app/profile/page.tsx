"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";
import "./profile.css";
import { JobTable } from "@/components/JobTable";

const categories=["Latest Jobs","Rajasthan Govt Jobs","Central Government Jobs","State Government Jobs","Police Recruitment","Railway Jobs","Teaching Jobs","Admit Card","Results","Answer Key","Scholarships","Admissions","University Updates","Government Schemes","Apprenticeship","Board Exams"];
const categoryLinks:Record<string,string>={"Latest Jobs":"/jobs","Rajasthan Govt Jobs":"/state/rajasthan","Central Government Jobs":"/category/central-government-jobs","State Government Jobs":"/categories","Police Recruitment":"/category/police-paramilitary-jobs","Railway Jobs":"/category/railway-jobs","Teaching Jobs":"/category/teaching-jobs","Admit Card":"/category/admit-card","Results":"/category/result","Answer Key":"/category/answer-key","Scholarships":"/category/scholarship","Admissions":"/category/admissions","University Updates":"/category/university-updates","Government Schemes":"/category/government-schemes","Apprenticeship":"/category/apprenticeship","Board Exams":"/category/board-exams"};
const categoryMeta:Record<string,{icon:string;desc:string;count:string}>={
"Latest Jobs":{icon:"⚡",desc:"नई प्रकाशित भर्तियाँ",count:"नवीनतम"},
"Rajasthan Govt Jobs":{icon:"🏛️",desc:"राजस्थान राज्य की भर्तियाँ",count:"राजस्थान"},
"Central Government Jobs":{icon:"🇮🇳",desc:"केंद्र सरकार की नौकरियाँ",count:"केंद्र"},
"State Government Jobs":{icon:"📍",desc:"सभी राज्यों की भर्तियाँ",count:"राज्य"},
"Police Recruitment":{icon:"🛡️",desc:"पुलिस और अर्धसैनिक भर्ती",count:"वर्दी सेवा"},
"Railway Jobs":{icon:"🚆",desc:"रेलवे भर्ती और अपडेट",count:"रेलवे"},
"Teaching Jobs":{icon:"🎓",desc:"शिक्षक और शिक्षा विभाग",count:"शिक्षा"},
"Admit Card":{icon:"🎫",desc:"परीक्षा प्रवेश पत्र",count:"परीक्षा"},
"Results":{icon:"📊",desc:"परीक्षा परिणाम",count:"रिज़ल्ट"},
"Answer Key":{icon:"📝",desc:"उत्तर कुंजी और आपत्ति",count:"उत्तर कुंजी"},
"Scholarships":{icon:"🎒",desc:"छात्रवृत्ति और सहायता",count:"छात्र"},
"Admissions":{icon:"🏫",desc:"प्रवेश और आवेदन",count:"प्रवेश"},
"University Updates":{icon:"📚",desc:"विश्वविद्यालय और कॉलेज",count:"विश्वविद्यालय"},
"Government Schemes":{icon:"🤝",desc:"सरकारी योजनाएँ और लाभ",count:"योजनाएँ"},
"Apprenticeship":{icon:"🔧",desc:"प्रशिक्षु और कौशल अवसर",count:"कौशल"},
"Board Exams":{icon:"📖",desc:"बोर्ड परीक्षा अपडेट",count:"बोर्ड"}
};
const qualifications=["10वीं पास","12वीं पास","ITI","डिप्लोमा","ग्रेजुएशन","पोस्ट ग्रेजुएशन","कोई भी योग्यता"];
const states=["Rajasthan","Uttar Pradesh","Madhya Pradesh","Haryana","Delhi","Punjab","Bihar","Gujarat","Maharashtra","All India","Other"];

export default function Profile(){
 const router=useRouter();
 const [user,setUser]=useState<any>(null),[name,setName]=useState(""),[phone,setPhone]=useState(""),[whatsappOptIn,setWhatsappOptIn]=useState(false),[state,setState]=useState("Rajasthan"),[qualification,setQualification]=useState(""),[selected,setSelected]=useState<string[]>(["Rajasthan Govt Jobs"]),[alerts,setAlerts]=useState(true),[frequency,setFrequency]=useState("daily"),[busy,setBusy]=useState(true),[saving,setSaving]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState(""),[showSaved,setShowSaved]=useState(false),[editing,setEditing]=useState(false),[latestJobs,setLatestJobs]=useState<any[]>([]);
 useEffect(()=>{setShowSaved(new URLSearchParams(window.location.search).get("saved")==="1");(async()=>{try{const s=createClient();const {data:{user},error}=await s.auth.getUser();if(error||!user){router.replace("/login");return;}setUser(user);const {data:jobRows}=await s.from("jobs").select("id,title,organization,category,location,vacancies,qualification,application_end,featured,created_at").eq("status","published").order("created_at",{ascending:false}).limit(8);setLatestJobs(jobRows||[]);const {data,error:profileError}=await s.from("user_profiles").select("*").eq("user_id",user.id).maybeSingle();if(profileError)throw profileError;setName(data?.full_name||user.user_metadata?.full_name||"");setPhone(data?.phone_number||"");setWhatsappOptIn(data?.whatsapp_opt_in??false);setState(data?.state||"Rajasthan");setQualification(data?.qualification||"");setSelected(data?.categories||["Rajasthan Govt Jobs"]);setAlerts(data?.email_alerts??true);setFrequency(data?.alert_frequency||"daily");}catch(e:any){setError(e.message||"प्रोफाइल लोड नहीं हुई।");}finally{setBusy(false)}})()},[router]);
 async function save(e:React.FormEvent){e.preventDefault();if(!user)return;setSaving(true);setError("");setMessage("");try{const s=createClient();const {error}=await s.from("user_profiles").upsert({user_id:user.id,email:user.email||"",full_name:name,phone_number:phone.replace(/\D/g,""),whatsapp_opt_in:whatsappOptIn,whatsapp_alerts:whatsappOptIn,state,qualification,categories:selected,email_alerts:alerts,alert_frequency:frequency,updated_at:new Date().toISOString()},{onConflict:"user_id"});if(error)throw error;setMessage("आपकी प्रोफाइल और पसंद सुरक्षित रूप से सेव हो गई हैं।");setEditing(false);router.replace("/profile?saved=1");router.refresh();}catch(e:any){setError(e.message||"सेव नहीं हो पाया। क्या Supabase migration चलाया है?");}finally{setSaving(false)}}
 async function logout(){try{const s=createClient();const {error}=await s.auth.signOut({scope:"local"});if(error)throw error;window.location.replace("/");}catch(e:any){setError(e.message||"लॉगआउट पूरा नहीं हो पाया।");}}
 function toggle(c:string){setSelected(old=>old.includes(c)?old.filter(x=>x!==c):[...old,c]);}
 if(busy)return <main className="profile-loading"><div className="profile-loader-mark">RS</div><strong>आपका डैशबोर्ड तैयार हो रहा है</strong><span>आपकी पसंद और प्रोफाइल लोड की जा रही है…</span></main>;
 const displayName=name.trim()||user?.user_metadata?.full_name||user?.email?.split("@")[0]||"उपयोगकर्ता";
 const initials=displayName.split(/\s+/).slice(0,2).map((x:string)=>x[0]?.toUpperCase()).join("")||"RS";
 const completion=[!!name.trim(),!!phone.trim(),!!qualification,selected.length>0].filter(Boolean).length*25;
 return <main className="user-dashboard">
  <aside className="user-sidebar">
   <Link className="user-brand" href="/"><span className="user-brand-icon">RS</span><span><strong>Rojgar Sathi</strong><small>CAREER DASHBOARD</small></span></Link>
   <div className="user-side-label">WORKSPACE</div>
   <Link className="user-side-link active" href="/profile"><span>▦</span> मेरा डैशबोर्ड</Link>
   <Link className="user-side-link" href="/jobs"><span>⌕</span> सभी भर्तियाँ <b>↗</b></Link>
   <Link className="user-side-link" href="/categories"><span>◈</span> श्रेणियाँ</Link>
   <Link className="user-side-link" href="/category/scholarship"><span>✦</span> छात्रवृत्तियाँ</Link>
   <Link className="user-side-link" href="/category/admit-card"><span>▤</span> एडमिट कार्ड</Link>
   <Link className="user-side-link" href="/category/result"><span>◷</span> परीक्षा परिणाम</Link>
   <div className="user-side-label user-side-label-bottom">ACCOUNT</div>
   <button className="user-side-link user-side-button" onClick={()=>setEditing(v=>!v)}><span>⚙</span> प्रोफाइल सेटिंग</button>
   <button className="user-side-link user-side-button logout-link" onClick={logout}><span>↪</span> लॉगआउट</button>
   <div className="user-sidebar-help"><span className="help-spark">✦</span><strong>अगला अवसर आपका है।</strong><p>अपनी पसंद अपडेट रखें और नए अवसरों पर नज़र रखें।</p><Link href="/jobs">भर्तियाँ देखें →</Link></div>
   <div className="user-sidebar-foot"><span className="online-dot"></span> आपका निजी स्पेस सुरक्षित है</div>
  </aside>
  <section className="user-main">
   <header className="user-topbar"><div><span className="user-breadcrumb">WORKSPACE <b>/</b> <strong>मेरा डैशबोर्ड</strong></span><p>आपकी अगली शुरुआत यहीं से होती है।</p></div><div className="user-top-actions"><Link href="/" className="public-site-link">वेबसाइट देखें ↗</Link><div className="user-avatar">{initials}</div><div className="user-top-identity"><strong>{displayName}</strong><small>व्यक्तिगत खाता</small></div></div></header>
   <div className="user-content">
    {showSaved&&<div className="user-alert success-alert"><span>✓</span><div><strong>बदलाव सेव हो गए</strong><small>आपकी प्रोफाइल और पसंद अपडेट हो गई हैं।</small></div><button onClick={()=>setShowSaved(false)} aria-label="बंद करें">×</button></div>}
    {error&&<div className="user-alert error-alert"><span>!</span><div><strong>ध्यान दें</strong><small>{error}</small></div></div>}
    <section className="user-welcome">
     <div className="welcome-copy"><span className="welcome-eyebrow"><span className="online-dot"></span> YOUR CAREER, YOUR WAY</span><h1>नमस्ते, {displayName.split(" ")[0]} <span>✦</span></h1><p>आपके अगले अवसर की तैयारी के लिए आपका पर्सनल स्पेस। अपनी पसंद की भर्तियाँ चुनें और काम के अपडेट एक जगह पाएँ।</p><div className="welcome-actions"><Link className="welcome-primary" href="/jobs">नई भर्तियाँ देखें <span>↗</span></Link><button className="welcome-secondary" onClick={()=>{setEditing(true);document.getElementById("profile-settings")?.scrollIntoView({behavior:"smooth",block:"start"});}}>प्रोफाइल अपडेट करें</button></div></div>
     <div className="welcome-art" aria-hidden="true"><div className="art-orbit orbit-one"></div><div className="art-orbit orbit-two"></div><div className="art-document"><span className="art-doc-check">✓</span><div className="art-doc-head"></div><div className="art-doc-line long"></div><div className="art-doc-line"></div><div className="art-doc-line short"></div><div className="art-doc-stamp">RS</div></div><div className="art-float art-float-one">✦ <span>नई शुरुआत</span></div><div className="art-float art-float-two">✓ <span>आपका लक्ष्य</span></div></div>
    </section>
    <div className="user-section-heading"><div><span className="user-overline">AT A GLANCE</span><h2>आपका ओवरव्यू</h2><p>आपकी तैयारी और पसंद का एक नज़र में सारांश।</p></div></div>
    <div className="user-stat-grid">
     <div className="user-stat-card"><div className="stat-icon blue-stat">◈</div><div><span>चुनी हुई श्रेणियाँ</span><strong>{selected.length.toString().padStart(2,"0")}</strong><small>आपकी रुचि के अनुसार</small></div><span className="stat-watermark">◈</span></div>
     <div className="user-stat-card"><div className="stat-icon green-stat">✓</div><div><span>प्रोफाइल पूरी</span><strong>{completion}%</strong><small>{completion===100?"आपकी जानकारी पूरी है":"कुछ जानकारी जोड़ें"}</small></div><span className="stat-watermark">✓</span></div>
     <div className="user-stat-card"><div className="stat-icon amber-stat">✉</div><div><span>ईमेल अलर्ट</span><strong>{alerts?"चालू":"बंद"}</strong><small>{frequency==="instant"?"हर नए अपडेट पर":frequency==="weekly"?"साप्ताहिक सारांश":"दैनिक सारांश"} की पसंद</small></div><span className="stat-watermark">✉</span></div>
    </div>
    <section className="user-panel dashboard-latest-vacancies"><div className="user-panel-heading"><div><span className="user-overline">LATEST OPPORTUNITIES</span><h2>नई भर्तियों की सूची</h2><p>टेबल में पद, योग्यता और अंतिम तिथि देखें; मोबाइल पर आसान कार्ड दिखेंगे।</p></div><Link className="user-text-button" href="/jobs">सभी भर्तियाँ ↗</Link></div><JobTable jobs={latestJobs} label="आपके डैशबोर्ड की नई भर्तियाँ"/></section>
    <div className="user-content-grid">
     <section className="user-panel user-interest-panel"><div className="user-panel-heading"><div><span className="user-overline">PERSONALIZED FOR YOU</span><h2>आपकी पसंदीदा श्रेणियाँ</h2><p>इन श्रेणियों से संबंधित अवसर देखने के लिए किसी कार्ड पर जाएँ।</p></div><button className="user-text-button" onClick={()=>{setEditing(true);document.getElementById("profile-settings")?.scrollIntoView({behavior:"smooth",block:"start"});}}>पसंद बदलें ↗</button></div>
      {selected.length?<div className="user-interest-grid">{selected.map(c=>{const m=categoryMeta[c]||{icon:"✦",desc:"आपकी चुनी हुई श्रेणी",count:"अपडेट"};return <Link className="user-interest-card" key={c} href={categoryLinks[c]||"/categories"}><span className="interest-icon">{m.icon}</span><span className="interest-copy"><strong>{c}</strong><small>{m.desc}</small></span><span className="interest-arrow">↗</span></Link>})}</div>:<div className="user-empty"><span>◈</span><strong>अभी कोई श्रेणी नहीं चुनी</strong><p>अपनी पसंद चुनें, ताकि आपका डैशबोर्ड आपके लिए उपयोगी बने।</p><button className="welcome-primary" onClick={()=>{setEditing(true);document.getElementById("profile-settings")?.scrollIntoView({behavior:"smooth"});}}>श्रेणियाँ चुनें</button></div>}
     <div className="user-panel-footer"><span><span className="online-dot"></span> आपकी पसंद के आधार पर व्यवस्थित</span><Link href="/categories">सभी श्रेणियाँ देखें →</Link></div>
     </section>
     <aside className="user-panel profile-summary"><div className="user-panel-heading"><div><span className="user-overline">YOUR ACCOUNT</span><h2>प्रोफाइल सारांश</h2></div><button className="summary-edit" onClick={()=>{setEditing(true);document.getElementById("profile-settings")?.scrollIntoView({behavior:"smooth"});}}>✎</button></div><div className="summary-person"><div className="summary-avatar">{initials}</div><div><strong>{displayName}</strong><small>{user?.email||"ईमेल उपलब्ध नहीं"}</small><span className="account-status"><i></i> सक्रिय खाता</span></div></div><div className="summary-progress-head"><span>प्रोफाइल पूर्णता</span><strong>{completion}%</strong></div><div className="summary-progress"><span style={{width:completion+"%"}}></span></div><p className="summary-hint">पूरी जानकारी से अपनी पसंद के अवसर व्यवस्थित करना आसान होगा।</p><div className="summary-details"><div><span>⌖</span><small>राज्य</small><strong>{state||"अभी नहीं चुना"}</strong></div><div><span>▤</span><small>योग्यता</small><strong>{qualification||"अभी नहीं चुनी"}</strong></div><div><span>☎</span><small>मोबाइल</small><strong>{phone||"अभी नहीं जोड़ा"}</strong></div></div><button className="summary-full-button" onClick={()=>{setEditing(true);document.getElementById("profile-settings")?.scrollIntoView({behavior:"smooth",block:"start"});}}>प्रोफाइल पूरी करें <span>→</span></button></aside>
    </div>
    <section className={"user-panel user-settings-panel"+(editing?" settings-highlight":"")} id="profile-settings"><div className="user-panel-heading"><div><span className="user-overline">ACCOUNT PREFERENCES</span><h2>प्रोफाइल और नोटिफिकेशन सेटिंग</h2><p>आपकी जानकारी और अपडेट की पसंद—सब कुछ आपके नियंत्रण में।</p></div><span className="settings-lock">⌘ निजी जानकारी</span></div>
     <form onSubmit={save}><div className="settings-section-title"><span>01</span><div><strong>व्यक्तिगत जानकारी</strong><small>आपकी पहचान और अवसरों से जुड़ी जानकारी</small></div></div><div className="user-form-grid"><label className="user-field">पूरा नाम<input value={name} onChange={e=>setName(e.target.value)} required placeholder="अपना पूरा नाम लिखें"/></label><label className="user-field">लॉगिन ईमेल<input value={user?.email||""} readOnly/><small>यह ईमेल आपके खाते से जुड़ा है।</small></label><label className="user-field">मोबाइल नंबर<input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} inputMode="numeric" pattern="[0-9+() -]{10,18}" placeholder="+91 98765 43210" required/></label><label className="user-field">राज्य / स्थान<select value={state} onChange={e=>setState(e.target.value)}>{states.map(s=><option key={s}>{s}</option>)}</select></label><label className="user-field field-wide">शैक्षणिक योग्यता<select value={qualification} onChange={e=>setQualification(e.target.value)}><option value="">अपनी योग्यता चुनें</option>{qualifications.map(q=><option key={q}>{q}</option>)}</select></label></div>
      <div className="settings-section-title settings-second-title"><span>02</span><div><strong>मेरी रुचि की श्रेणियाँ</strong><small>एक या अधिक विकल्प चुनें, जिन्हें आप फॉलो करना चाहते हैं।</small></div><span className="selected-counter">{selected.length} चयनित</span></div><div className="user-category-choices">{categories.map(c=><label key={c} className={"user-choice"+(selected.includes(c)?" chosen":"")}><input type="checkbox" checked={selected.includes(c)} onChange={()=>toggle(c)}/><span className="choice-check">{selected.includes(c)?"✓":""}</span><span className="choice-icon">{categoryMeta[c]?.icon||"✦"}</span><span>{c}</span></label>)}</div>
      <div className="settings-section-title settings-second-title"><span>03</span><div><strong>नोटिफिकेशन की पसंद</strong><small>किस माध्यम से और कितनी बार अपडेट चाहिए, चुनें।</small></div></div><div className="notification-preferences"><label className="notification-toggle"><span className="notification-symbol">✉</span><span><strong>ईमेल अपडेट</strong><small>आपकी पसंद से मेल खाने वाले अपडेट ईमेल पर पाने की पसंद सेव करें। वास्तविक ईमेल भेजने के लिए सेवा कॉन्फ़िगरेशन आवश्यक है।</small></span><input type="checkbox" checked={alerts} onChange={e=>setAlerts(e.target.checked)}/></label><label className="notification-toggle"><span className="notification-symbol whatsapp-symbol">◉</span><span><strong>WhatsApp अपडेट की सहमति</strong><small>WhatsApp पर अपडेट पाने की सहमति। संदेश भेजने की सुविधा प्रदाता इंटीग्रेशन के बाद ही सक्रिय होगी।</small></span><input type="checkbox" checked={whatsappOptIn} onChange={e=>setWhatsappOptIn(e.target.checked)}/></label><label className="user-field frequency-field">ईमेल सारांश की पसंद<select value={frequency} onChange={e=>setFrequency(e.target.value)}><option value="instant">हर नए अपडेट पर (तुरंत)</option><option value="daily">दिन में एक बार सारांश</option><option value="weekly">सप्ताह में एक बार सारांश</option></select></label></div>
      <div className="settings-actions"><span>✓ आपकी सेटिंग आपके खाते में सेव होंगी।</span><button className="settings-save" disabled={saving}>{saving?"सेव हो रहा है…":"बदलाव सेव करें"} <span>→</span></button></div>
     </form>
    </section>
    <footer className="user-dashboard-footer"><span>© Rojgar Sathi · आपके करियर की दिशा में एक कदम</span><div><Link href="/">होम</Link><Link href="/jobs">भर्तियाँ</Link><Link href="/categories">सभी श्रेणियाँ</Link><button onClick={logout}>लॉगआउट</button></div></footer>
   </div>
  </section>
 </main>;
}
