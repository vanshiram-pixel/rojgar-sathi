"use client";

import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { createClient } from "@/lib/supabase/client";

type Category = {
  id: string;
  name: string;
  slug: string;
  category_type: string;
  description: string;
  parent_slug: string;
  sort_order: number;
  is_active: boolean;
};

const blank = { name: "", slug: "", category_type: "content", description: "", parent_slug: "", sort_order: 100, is_active: true };
const types = [
  ["content", "सामान्य श्रेणी"], ["state", "राज्य / केंद्रशासित प्रदेश"], ["exam", "परीक्षा"], ["education", "शिक्षा / छात्रवृत्ति"], ["scheme", "सरकारी योजना"], ["employment", "रोजगार / अप्रेंटिसशिप"]
];

function slugify(value: string) {
  return value.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function CategoryManager() {
  const [rows, setRows] = useState<Category[]>([]);
  const [form, setForm] = useState({ ...blank });
  const [editId, setEditId] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const supabase = createClient();
    const { data, error: loadError } = await supabase.from("portal_categories").select("*").order("sort_order").order("name");
    if (loadError) setError(loadError.message);
    else setRows((data || []) as Category[]);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  const update = (key: keyof typeof blank, value: string | number | boolean) => setForm((current) => ({ ...current, [key]: value }));
  function edit(row: Category) {
    setEditId(row.id);
    setForm({ name: row.name, slug: row.slug, category_type: row.category_type, description: row.description || "", parent_slug: row.parent_slug || "", sort_order: row.sort_order, is_active: row.is_active });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function reset() { setEditId(""); setForm({ ...blank }); }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const supabase = createClient();
      const payload = { ...form, slug: slugify(form.slug || form.name), updated_at: new Date().toISOString() };
      const result = editId
        ? await supabase.from("portal_categories").update(payload).eq("id", editId)
        : await supabase.from("portal_categories").insert(payload);
      if (result.error) throw result.error;
      setMessage(editId ? "श्रेणी अपडेट हो गई।" : "नई श्रेणी जोड़ दी गई।");
      reset(); await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "श्रेणी सेव नहीं हुई।");
    } finally { setBusy(false); }
  }

  async function toggle(row: Category) {
    setError(""); setMessage("");
    const supabase = createClient();
    const { error: updateError } = await supabase.from("portal_categories").update({ is_active: !row.is_active, updated_at: new Date().toISOString() }).eq("id", row.id);
    if (updateError) setError(updateError.message); else { setMessage(row.is_active ? "श्रेणी छिपा दी गई।" : "श्रेणी सक्रिय कर दी गई।"); await load(); }
  }

  async function remove(row: Category) {
    if (!window.confirm(`“${row.name}” श्रेणी हटाएँ? यह सिर्फ श्रेणी रिकॉर्ड हटाएगा, भर्ती रिकॉर्ड नहीं।`)) return;
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("portal_categories").delete().eq("id", row.id);
    if (deleteError) setError(deleteError.message); else { setMessage("श्रेणी हटा दी गई।"); await load(); }
  }

  const shown = rows.filter((row) => filter === "all" || row.category_type === filter);
  return <>
    <div className="admin-head"><div><h1>श्रेणी और राज्य प्रबंधन</h1><p className="sub">भारत के राज्यों, केंद्रशासित प्रदेशों, परीक्षाओं और सभी पोर्टल श्रेणियों को नियंत्रित करें।</p></div><span className="pill">{rows.length} श्रेणियाँ</span></div>
    {message ? <div className="notice success">{message}</div> : null}
    {error ? <div className="notice error">{error}</div> : null}
    <form className="admin-card" onSubmit={save}>
      <h2>{editId ? "श्रेणी संपादित करें" : "नई श्रेणी बनाएँ"}</h2>
      <div className="form-grid">
        <label className="field">श्रेणी का नाम<input required value={form.name} onChange={(e) => { update("name", e.target.value); if (!editId) update("slug", slugify(e.target.value)); }} placeholder="उदाहरण: Rajasthan Police" /></label>
        <label className="field">URL स्लग<input required value={form.slug} onChange={(e) => update("slug", slugify(e.target.value))} placeholder="rajasthan-police" /></label>
        <label className="field">श्रेणी का प्रकार<select value={form.category_type} onChange={(e) => update("category_type", e.target.value)}>{types.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="field">क्रम संख्या<input type="number" value={form.sort_order} onChange={(e) => update("sort_order", Number(e.target.value))} /></label>
        <label className="field full">विवरण<textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="इस श्रेणी में कौन-सी अपडेट दिखाई जाएँगी?" /></label>
        <label className="field">मूल श्रेणी स्लग (वैकल्पिक)<input value={form.parent_slug} onChange={(e) => update("parent_slug", e.target.value)} placeholder="central-government-jobs" /></label>
        <label className="checkline"><input type="checkbox" checked={form.is_active} onChange={(e) => update("is_active", e.target.checked)} /> सार्वजनिक वेबसाइट पर सक्रिय दिखाएँ</label>
      </div>
      <div className="actions"><button className="btn" disabled={busy}>{busy ? "सेव हो रहा है…" : editId ? "बदलाव सेव करें" : "श्रेणी जोड़ें"}</button>{editId ? <button type="button" className="small-btn" onClick={reset}>रद्द करें</button> : null}</div>
    </form>
    <section className="admin-card">
      <div className="admin-head"><div><h2>सभी श्रेणियाँ</h2><p className="sub">बंद की गई श्रेणी को फिर से सक्रिय कर सकते हैं।</p></div>
      <select aria-label="श्रेणी फ़िल्टर" value={filter} onChange={(e) => setFilter(e.target.value)}>{[["all","सभी प्रकार"], ...types].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      {loading ? <p>लोड हो रहा है…</p> : shown.length ? <div className="table-wrap"><table className="admin-table"><thead><tr><th>श्रेणी</th><th>प्रकार</th><th>URL स्लग</th><th>स्थिति</th><th>कंट्रोल</th></tr></thead><tbody>{shown.map((row) => <tr key={row.id}><td><strong>{row.name}</strong><small>{row.description}</small></td><td>{types.find(([value]) => value === row.category_type)?.[1] || row.category_type}</td><td><code>{row.slug}</code></td><td>{row.is_active ? "सक्रिय" : "छिपी हुई"}</td><td><div className="actions"><button type="button" className="small-btn" onClick={() => edit(row)}>संपादित</button><button type="button" className="small-btn" onClick={() => void toggle(row)}>{row.is_active ? "छिपाएँ" : "सक्रिय करें"}</button><button type="button" className="small-btn danger" onClick={() => void remove(row)}>हटाएँ</button></div></td></tr>)}</tbody></table></div> : <p>कोई श्रेणी नहीं मिली। पहले ऊपर से श्रेणी जोड़ें।</p>}
    </section>
  </>;
}

export default function AdminCategoriesPage() {
  return <AdminGuard><CategoryManager /></AdminGuard>;
}
