"use client";

import { useEffect, useState } from "react";
import { BellRing, Mail, MessageCircle, Smartphone, CheckCircle2 } from "lucide-react";

export function NotificationCenter() {
  const [promptOpen, setPromptOpen] = useState(false);
  useEffect(() => { const id = window.setTimeout(() => setPromptOpen(true), 1400); return () => window.clearTimeout(id); }, []);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailOn, setEmailOn] = useState(true);
  const [whatsappOn, setWhatsappOn] = useState(false);
  const [browserOn, setBrowserOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function enableBrowser() {
    setError(""); setNotice("");
    if (!("Notification" in window)) { setError("इस ब्राउज़र में नोटिफिकेशन सपोर्ट नहीं है।"); return; }
    if (!("serviceWorker" in navigator)) { setError("इस ब्राउज़र में ब्राउज़र नोटिफिकेशन उपलब्ध नहीं हैं।"); return; }
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setError("ब्राउज़र नोटिफिकेशन के लिए अनुमति नहीं मिली। आप बाद में ब्राउज़र सेटिंग में बदल सकते हैं।"); return; }
      setBrowserOn(true);
      setNotice("ब्राउज़र अनुमति मिल गई। वास्तविक पुश अलर्ट भेजने के लिए VAPID और सर्वर पुश सेटअप भी आवश्यक है।");
    } catch { setError("ब्राउज़र अनुमति अभी नहीं ली जा सकी। कृपया दोबारा प्रयास करें।"); }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setNotice("");
    if (!emailOn && !whatsappOn && !browserOn) { setError("कम से कम एक नोटिफिकेशन विकल्प चुनें।"); setBusy(false); return; }
    if (emailOn && !email.trim()) { setError("ईमेल नोटिफिकेशन के लिए ईमेल भरें।"); setBusy(false); return; }
    if (whatsappOn && !phone.trim()) { setError("WhatsApp अलर्ट के लिए मोबाइल नंबर भरें।"); setBusy(false); return; }
    try {
      const response = await fetch("/api/notifications/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emailOn ? email.trim() : null, phone: whatsappOn ? phone.trim() : null, email_enabled: emailOn, whatsapp_enabled: whatsappOn, browser_enabled: browserOn, consent: true }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "अभी आपकी पसंद सेव नहीं हो सकी।");
      setNotice("आपकी नोटिफिकेशन पसंद सेव हो गई। ईमेल/WhatsApp संदेश भेजने के लिए संबंधित सेवा की सुरक्षित API सेटिंग भी सक्रिय होनी चाहिए।");
    } catch (err) { setError(err instanceof Error ? err.message : "कुछ गड़बड़ हुई। कृपया फिर प्रयास करें।"); }
    finally { setBusy(false); }
  }

  return <>{promptOpen && <aside role="dialog" aria-label="नौकरी नोटिफिकेशन" style={{position:"fixed",right:16,bottom:84,zIndex:80,width:"min(350px,calc(100vw - 32px))",background:"var(--card,#fff)",color:"var(--text,#172033)",border:"1px solid var(--line,#dbe2ea)",borderRadius:14,boxShadow:"0 12px 40px rgba(15,23,42,.18)",padding:16}}><button type="button" aria-label="बंद करें" onClick={()=>setPromptOpen(false)} style={{float:"right",border:0,background:"transparent",fontSize:20,cursor:"pointer"}}>×</button><h3 style={{margin:"0 24px 8px 0"}}><BellRing size={18} style={{display:"inline",verticalAlign:"middle",marginRight:7}}/>नई भर्ती का अलर्ट पाएँ</h3><p className="sub" style={{margin:"0 0 12px"}}>ईमेल, WhatsApp या ब्राउज़र नोटिफिकेशन चुनें। कोई लॉगिन जरूरी नहीं।</p><button type="button" className="btn" onClick={()=>{setPromptOpen(false);document.getElementById("notifications")?.scrollIntoView({behavior:"smooth",block:"center"});}}>अलर्ट सेट करें</button></aside>}<section className="section"><div className="wrap"><div className="admin-card notification-center" id="notifications">
    <div className="section-head"><div><h2><BellRing size={22} style={{display:"inline",verticalAlign:"middle",marginRight:8}}/>नौकरी अलर्ट पाएँ</h2><p className="sub">लॉगिन या अकाउंट बनाने की जरूरत नहीं। अपनी पसंद के अलर्ट चुनें।</p></div></div>
    <form onSubmit={save} className="notification-form">
      <label className="checkline"><input type="checkbox" checked={emailOn} onChange={e=>setEmailOn(e.target.checked)}/><Mail size={17}/> ईमेल नोटिफिकेशन</label>
      {emailOn && <label className="field">ईमेल पता<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="आपका ईमेल" required/></label>}
      <label className="checkline"><input type="checkbox" checked={whatsappOn} onChange={e=>setWhatsappOn(e.target.checked)}/><MessageCircle size={17}/> WhatsApp नोटिफिकेशन</label>
      {whatsappOn && <label className="field">WhatsApp मोबाइल नंबर<input type="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 98765 43210" required/><small>केवल आपकी स्पष्ट सहमति पर; संदेश भेजने के लिए WhatsApp Business API सेटअप जरूरी है।</small></label>}
      <label className="checkline"><input type="checkbox" checked={browserOn} onChange={e=>setBrowserOn(e.target.checked)}/> ब्राउज़र नोटिफिकेशन</label>
      {!browserOn && <button className="small-btn" type="button" onClick={enableBrowser}><Smartphone size={16}/> ब्राउज़र अनुमति चालू करें</button>}
      {browserOn && <p className="sub"><CheckCircle2 size={15} style={{display:"inline",verticalAlign:"middle"}}/> ब्राउज़र अनुमति मिल गई</p>}
      <button className="btn" type="submit" disabled={busy}>{busy ? "सेव हो रहा है…" : "मेरी अलर्ट पसंद सेव करें"}</button>
      {notice && <p role="status" className="notice">{notice}</p>}{error && <p role="alert" className="notice error">{error}</p>}
      <small className="sub">सेव करके आप चुने गए चैनलों पर नौकरी/परीक्षा अपडेट पाने की सहमति देते हैं। किसी भी समय सदस्यता बंद करने का विकल्प उपलब्ध कराया जाएगा।</small>
    </form>
  </div></div></section></>;
}
