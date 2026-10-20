"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { createClient } from "@/lib/supabase/client";

type Item = any;
const today = () => new Date().toISOString().slice(0, 10);
const allowedFields = new Set(["application_start", "application_end", "exam_date", "valid_through", "status", "title", "description", "official_url", "notification_url"]);

function ExpiryManager() {
  const [jobs, setJobs] = useState<Item[]>([]);
  const [content, setContent] = useState<Item[]>([]);
  const [proposals, setProposals] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState("expired");
  const [targetType, setTargetType] = useState("jobs");
  const [targetId, setTargetId] = useState("");
  const [officialUrl, setOfficialUrl] = useState("");
  const [evidence, setEvidence] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [newExamDate, setNewExamDate] = useState("");
  const [proposedStatus, setProposedStatus] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    const s = createClient();
    const [j, c, p] = await Promise.all([
      s.from("jobs").select("*").order("created_at", { ascending: false }),
      s.from("content_items").select("*").order("created_at", { ascending: false }),
      s.from("official_update_proposals").select("*").order("created_at", { ascending: false })
    ]);
    if (j.error) throw j.error;
    if (c.error) throw c.error;
    if (p.error) throw p.error;
    setJobs(j.data || []);
    setContent(c.data || []);
    setProposals(p.data || []);
  }

  useEffect(() => { load().catch((e: any) => setError(e.message || "डेटा लोड नहीं हुआ।")); }, []);

  const all = useMemo(() => [
    ...jobs.map((x) => ({ ...x, _type: "jobs", _kind: "भर्ती" })),
    ...content.map((x) => ({ ...x, _type: "content_items", _kind: "अन्य अपडेट" }))
  ], [jobs, content]);
  const matchesSearch = (x: Item) => (String(x.title || "") + " " + String(x.organization || x.department || "")).toLowerCase().includes(search.toLowerCase());
  const expired = all.filter((x) => x.status === "published" && matchesSearch(x) && (
    (x.application_end && x.application_end < today()) ||
    (x.valid_through && x.valid_through < today())
  ));
  const expiringSoon = all.filter((x) => x.status === "published" && matchesSearch(x) && (
    (x.application_end && x.application_end >= today() && x.application_end <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)) ||
    (x.valid_through && x.valid_through >= today() && x.valid_through <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10))
  ));
  const archived = all.filter((x) => x.status === "archived" && matchesSearch(x));
  const pending = proposals.filter((x) => x.status === "pending");

  async function audit(item: Item, action: string, details: any = {}) {
    const s = createClient();
    const { data: auth } = await s.auth.getUser();
    await s.from("content_change_audit").insert({
      target_type: item._type || item.target_type,
      target_id: item.id || item.target_id,
      target_title: item.title || item.target_title || "",
      action, details, actor: auth.user?.email || auth.user?.id || "admin"
    });
  }

  async function setStatus(item: Item, status: string) {
    const action = status === "archived" ? "archived" : status === "published" ? "restored" : "status_changed";
    if (status === "archived" && !confirm("यह पोस्ट सार्वजनिक सूची से हटाकर आर्काइव में रखी जाएगी। स्थायी रूप से डिलीट नहीं होगी। जारी रखें?")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const s = createClient();
      const { error: updateError } = await s.from(item._type).update({ status, updated_at: new Date().toISOString() }).eq("id", item.id);
      if (updateError) throw updateError;
      await audit(item, action, { previous_status: item.status, new_status: status });
      setMessage(status === "archived" ? "पोस्ट आर्काइव में चली गई।" : "पोस्ट फिर से प्रकाशित कर दी गई।");
      await load();
    } catch (e: any) { setError(e.message || "स्थिति नहीं बदली जा सकी।"); }
    finally { setBusy(false); }
  }

  async function permanentlyDelete(item: Item) {
    if (!confirm("स्थायी डिलीट वापस नहीं किया जा सकता। क्या आपने पोस्ट का विवरण/लिंक जाँच लिया है?")) return;
    if (!confirm("अंतिम पुष्टि: यह पोस्ट डेटाबेस से हमेशा के लिए हटेगी।")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const s = createClient();
      const { error: delError } = await s.from(item._type).delete().eq("id", item.id);
      if (delError) throw delError;
      await audit(item, "permanently_deleted", { note: "Admin confirmed permanent deletion" });
      setMessage("पोस्ट स्थायी रूप से हटा दी गई।");
      await load();
    } catch (e: any) { setError(e.message || "पोस्ट डिलीट नहीं हुई।"); }
    finally { setBusy(false); }
  }

  async function createProposal(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const target = all.find((x) => x._type === targetType && x.id === targetId);
      if (!target) throw new Error("पहले एक मौजूदा पोस्ट चुनें।");
      if (!officialUrl.trim() || !/^https:\/\//i.test(officialUrl.trim())) throw new Error("आधिकारिक HTTPS नोटिफिकेशन URL देना आवश्यक है।");
      const changes: Record<string, any> = {};
      if (newDeadline) changes.application_end = newDeadline;
      if (newExamDate) changes.exam_date = newExamDate;
      if (proposedStatus) changes.status = proposedStatus;
      if (!Object.keys(changes).length) throw new Error("कम-से-कम नई अंतिम तिथि, परीक्षा तिथि या प्रस्तावित स्थिति भरें।");
      const s = createClient();
      const { error: insertError } = await s.from("official_update_proposals").insert({
        target_type: targetType, target_id: target.id, target_title: target.title,
        official_url: officialUrl.trim(), proposed_changes: changes,
        evidence_note: evidence.trim(), source_checked_at: new Date().toISOString(), status: "pending"
      });
      if (insertError) throw insertError;
      await audit(target, "official_update_proposed", { changes, official_url: officialUrl.trim(), evidence_note: evidence.trim() });
      setMessage("अपडेट समीक्षा कतार में जुड़ गया। मंज़ूरी तक सार्वजनिक पोस्ट नहीं बदलेगी।");
      setTargetId(""); setOfficialUrl(""); setEvidence(""); setNewDeadline(""); setNewExamDate(""); setProposedStatus("");
      await load(); setTab("review");
    } catch (e: any) { setError(e.message || "अपडेट प्रस्ताव सेव नहीं हुआ।"); }
    finally { setBusy(false); }
  }

  async function reviewProposal(p: Item, approve: boolean) {
    if (!confirm(approve ? "आधिकारिक स्रोत देखकर पुष्टि की है? मंज़ूरी के बाद प्रस्तावित फ़ील्ड पोस्ट पर लागू होंगे।" : "इस प्रस्ताव को अस्वीकार करना चाहते हैं?")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const s = createClient();
      if (approve) {
        const changes = p.proposed_changes || {};
        const safe: Record<string, any> = {};
        for (const [key, value] of Object.entries(changes)) if (allowedFields.has(key)) safe[key] = value;
        if (!Object.keys(safe).length) throw new Error("प्रस्ताव में लागू करने योग्य फ़ील्ड नहीं हैं।");
        safe.last_verified_at = new Date().toISOString();
        safe.updated_at = new Date().toISOString();
        const { error: applyError } = await s.from(p.target_type).update(safe).eq("id", p.target_id);
        if (applyError) throw applyError;
        await s.from("content_change_audit").insert({
          target_type: p.target_type, target_id: p.target_id, target_title: p.target_title,
          action: "official_update_approved", details: { changes: safe, official_url: p.official_url, evidence_note: p.evidence_note },
          actor: (await s.auth.getUser()).data.user?.email || "admin"
        });
      }
      const { data: auth } = await s.auth.getUser();
      const { error: reviewError } = await s.from("official_update_proposals").update({
        status: approve ? "approved" : "rejected", reviewed_by: auth.user?.email || auth.user?.id || "admin", reviewed_at: new Date().toISOString()
      }).eq("id", p.id);
      if (reviewError) throw reviewError;
      setMessage(approve ? "प्रस्ताव मंज़ूर हुआ और अपडेट लागू कर दिया गया।" : "प्रस्ताव अस्वीकार कर दिया गया।");
      await load();
    } catch (e: any) { setError(e.message || "समीक्षा पूरी नहीं हुई।"); }
    finally { setBusy(false); }
  }

  const list = tab === "expired" ? expired : tab === "soon" ? expiringSoon : tab === "archived" ? archived : [];
  const titleFor = (x: Item) => x._type === "jobs" ? "भर्ती" : "कंटेंट";
  const dateFor = (x: Item) => x.application_end || x.valid_through || "तिथि दर्ज नहीं";
  const targetOptions = all.filter((x) => x.status !== "archived");

  return <>
    <div className="admin-head"><div><h1>समाप्त पोस्ट और आधिकारिक अपडेट</h1><p className="sub">समाप्त/जल्द समाप्त पोस्ट की निगरानी, सुरक्षित आर्काइव और एडमिन-मंज़ूर अपडेट।</p></div></div>
    {message ? <div className="notice success" role="status">{message}</div> : null}
    {error ? <div className="notice error" role="alert">{error}</div> : null}
    <div className="form-grid">
      <div className="admin-card"><p className="sub">समाप्त / अंतिम तिथि निकल गई</p><h2>{expired.length}</h2></div>
      <div className="admin-card"><p className="sub">अगले 7 दिनों में अंतिम तिथि</p><h2>{expiringSoon.length}</h2></div>
      <div className="admin-card"><p className="sub">मंज़ूरी की प्रतीक्षा</p><h2>{pending.length}</h2></div>
    </div>
    <div className="admin-card">
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
        {[["expired","समाप्त पोस्ट"],["soon","जल्द समाप्त"],["archived","आर्काइव फ़ोल्डर"],["review","आधिकारिक अपडेट समीक्षा"],["new","नया अपडेट प्रस्ताव"]].map(([key,label]) =>
          <button key={key} type="button" className={tab===key?"btn":"small-btn"} onClick={()=>setTab(key)}>{label}{key==="review" ? " ("+pending.length+")" : ""}</button>
        )}
      </div>
      <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="पोस्ट/विभाग खोजें…" style={{marginBottom:12}} />
      {["expired","soon","archived"].includes(tab) ? <>
        <h2>{tab==="expired"?"समाप्त पोस्ट":tab==="soon"?"अगले 7 दिनों में समाप्त होने वाली पोस्ट":"आर्काइव फ़ोल्डर"} ({list.length})</h2>
        <p className="sub">सुरक्षा के लिए ऑटो-डिलीट नहीं है। पहले आर्काइव करें; स्थायी डिलीट अलग से दो बार पुष्टि के बाद ही होगा।</p>
        <div className="table-wrap"><table className="admin-table"><thead><tr><th>पोस्ट</th><th>प्रकार</th><th>अंतिम तिथि</th><th>स्थिति</th><th>कार्रवाई</th></tr></thead><tbody>
          {list.map((x)=> <tr key={x._type+x.id}><td><strong>{x.title}</strong><br/><small>{x.organization||x.department||x.state_name||""}</small></td><td>{titleFor(x)}</td><td>{dateFor(x)}</td><td>{x.status}</td><td style={{minWidth:210}}>
            {x.status!=="archived" ? <button disabled={busy} className="small-btn" onClick={()=>setStatus(x,"archived")}>आर्काइव करें</button> : <button disabled={busy} className="small-btn" onClick={()=>setStatus(x,"published")}>फिर प्रकाशित करें</button>}{" "}
            <button disabled={busy} className="small-btn" onClick={()=>permanentlyDelete(x)}>स्थायी डिलीट</button>
          </td></tr>)}
          {!list.length ? <tr><td colSpan={5}>इस फ़ोल्डर में कोई पोस्ट नहीं मिली।</td></tr>:null}
        </tbody></table></div>
      </> : null}
      {tab==="review" ? <>
        <h2>आधिकारिक अपडेट — एडमिन की मंज़ूरी आवश्यक</h2>
        <p className="sub">हर प्रस्ताव का आधिकारिक लिंक खोलकर जाँचें। मंज़ूरी से पहले सार्वजनिक पोस्ट में कोई बदलाव नहीं होगा।</p>
        <div className="table-wrap"><table className="admin-table"><thead><tr><th>पोस्ट / प्रस्ताव</th><th>आधिकारिक स्रोत</th><th>स्थिति</th><th>कार्रवाई</th></tr></thead><tbody>
          {proposals.map((p)=><tr key={p.id}><td><strong>{p.target_title}</strong><br/><small>{JSON.stringify(p.proposed_changes)}<br/>{p.evidence_note}</small></td><td><a className="text-link" href={p.official_url} target="_blank" rel="noreferrer">नोटिफिकेशन खोलें ↗</a><br/><small>{p.source_checked_at ? new Date(p.source_checked_at).toLocaleString("hi-IN") : ""}</small></td><td>{p.status}</td><td>{p.status==="pending" ? <><button disabled={busy} className="small-btn" onClick={()=>reviewProposal(p,true)}>जाँचकर मंज़ूर करें</button>{" "}<button disabled={busy} className="small-btn" onClick={()=>reviewProposal(p,false)}>अस्वीकार</button></>:<small>{p.reviewed_by}</small>}</td></tr>)}
          {!proposals.length?<tr><td colSpan={4}>अभी कोई अपडेट प्रस्ताव नहीं।</td></tr>:null}
        </tbody></table></div>
      </>:null}
      {tab==="new" ? <>
        <h2>आधिकारिक नोटिफिकेशन से अपडेट प्रस्ताव बनाएँ</h2>
        <p className="sub">यह समीक्षा कतार बनाता है; यह अपने-आप इंटरनेट स्कैन नहीं करता। भविष्य के स्रोत-मॉनिटर से प्रस्ताव आने पर भी एडमिन मंज़ूरी अनिवार्य रहेगी।</p>
        <form onSubmit={createProposal}>
          <div className="form-grid">
            <label className="field">पोस्ट का प्रकार<select value={targetType} onChange={(e)=>{setTargetType(e.target.value);setTargetId("");}}><option value="jobs">भर्ती</option><option value="content_items">अन्य अपडेट</option></select></label>
            <label className="field">मौजूदा पोस्ट<select required value={targetId} onChange={(e)=>setTargetId(e.target.value)}><option value="">पोस्ट चुनें</option>{targetOptions.filter((x)=>x._type===targetType).map((x)=><option value={x.id} key={x.id}>{x.title}</option>)}</select></label>
            <label className="field">आधिकारिक नोटिफिकेशन URL *<input required type="url" value={officialUrl} onChange={(e)=>setOfficialUrl(e.target.value)} placeholder="https:// विभाग की आधिकारिक साइट" /></label>
            <label className="field">नई आवेदन अंतिम तिथि<input type="date" value={newDeadline} onChange={(e)=>setNewDeadline(e.target.value)} /></label>
            <label className="field">नई परीक्षा तिथि<input type="date" value={newExamDate} onChange={(e)=>setNewExamDate(e.target.value)} /></label>
            <label className="field">प्रस्तावित स्थिति<select value={proposedStatus} onChange={(e)=>setProposedStatus(e.target.value)}><option value="">स्थिति न बदलें</option><option value="published">प्रकाशित रखें</option><option value="draft">ड्राफ्ट करें</option><option value="archived">आर्काइव करें</option></select></label>
            <label className="field full">आधिकारिक नोटिस से प्रमाण / टिप्पणी<textarea rows={3} value={evidence} onChange={(e)=>setEvidence(e.target.value)} placeholder="जैसे: विभागीय नोटिस में अंतिम तिथि 15 दिन बढ़ाने की सूचना…" /></label>
          </div>
          <button className="btn" disabled={busy}>{busy?"सेव हो रहा है…":"समीक्षा हेतु प्रस्ताव भेजें"}</button>
        </form>
      </>:null}
    </div>
  </>;
}

export default function AdminExpiryPage() {
  return <AdminGuard><ExpiryManager /></AdminGuard>;
}
