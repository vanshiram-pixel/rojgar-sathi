"use client";

import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { createClient } from "@/lib/supabase/client";

const blank: any = {
  title: "", organization: "", category: "सरकारी नौकरी", category_slugs: [],
  department: "", recruitment_type: "सरकारी नौकरी", location: "भारत", vacancies: "",
  qualification: "", age_limit: "", application_fee: "", salary: "", selection_process: "",
  application_start: "", application_end: "", exam_date: "", valid_through: "",
  official_source: "", last_verified_at: null, official_url: "", notification_url: "",
  image_url: "", description: "", status: "draft", featured: false
};

function JobsAdmin() {
  const [rows, setRows] = useState<any[]>([]);
  const [allCategoryOptions, setAllCategoryOptions] = useState<any[]>([]);
  const [form, setForm] = useState<any>(blank);
  const [editId, setEditId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  async function load() {
    const s = createClient();
    const { data, error } = await s.from("jobs").select("*").order("created_at", { ascending: false });
    if (error) setErr(error.message);
    else setRows(data || []);
  }

  useEffect(() => {
    load();
    (async () => {
      try {
        const s = createClient();
        const { data, error } = await s.from("portal_categories").select("name,slug,category_type")
          .eq("is_active", true).order("sort_order");
        if (error) throw error;
        setAllCategoryOptions(data || []);
      } catch (e: any) {
        setErr(e.message || "श्रेणियाँ लोड नहीं हो पाईं।");
      }
    })();
  }, []);

  function set(key: string, value: any) {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  }

  function toggleCategory(slug: string) {
    setForm((prev: any) => {
      const current: string[] = Array.isArray(prev.category_slugs) ? prev.category_slugs : [];
      return { ...prev, category_slugs: current.includes(slug) ? current.filter((x) => x !== slug) : [...current, slug] };
    });
  }

  function edit(row: any) {
    setEditId(row.id);
    setForm({ ...blank, ...row, category_slugs: Array.isArray(row.category_slugs) ? row.category_slugs : [] });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditId("");
    setForm({ ...blank });
    setErr("");
    setMsg("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    setErr("");
    try {
      const s = createClient();
      const payload = {
        ...form,
        title: String(form.title || "").trim(),
        organization: String(form.organization || "").trim(),
        category_slugs: Array.isArray(form.category_slugs) ? [...new Set(form.category_slugs)] : [],
        application_start: form.application_start || null,
        application_end: form.application_end || null,
        exam_date: form.exam_date || null,
        valid_through: form.valid_through || null,
        last_verified_at: new Date().toISOString(),
        image_url: String(form.image_url || "").trim()
      };
      const res = editId
        ? await s.from("jobs").update(payload).eq("id", editId)
        : await s.from("jobs").insert(payload);
      if (res.error) throw res.error;
      setMsg("भर्ती सफलतापूर्वक सेव हो गई।");
      resetForm();
      await load();
    } catch (e: any) {
      setErr(e.message || "सेव नहीं हो पाया। दर्ज की गई जानकारी जाँचें।");
    } finally {
      setBusy(false);
    }
  }

  async function del(id: string) {
    if (!confirm("क्या इस भर्ती को स्थायी रूप से हटाना चाहते हैं?")) return;
    setErr("");
    const s = createClient();
    const { error } = await s.from("jobs").delete().eq("id", id);
    if (error) setErr(error.message);
    else {
      setMsg("भर्ती हटा दी गई।");
      await load();
    }
  }

  const input = (label: string, key: string, type = "text", required = false) => (
    <label className="field" key={key}>
      {label}
      <input type={type} value={form[key] ?? ""} required={required}
        onChange={(e) => set(key, e.target.value)} />
    </label>
  );

  const visibleCategories = allCategoryOptions.filter((item) =>
    (item.name + " " + item.category_type).toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>भर्ती प्रबंधन</h1>
          <p className="sub">एक बार पोस्ट करें, कई श्रेणियों में दिखाएँ। प्रकाशित करने से पहले जानकारी जाँचें।</p>
        </div>
      </div>
      {msg ? <div className="notice success" role="status">{msg}</div> : null}
      {err ? <div className="notice error" role="alert">{err}</div> : null}

      <form className="admin-card" onSubmit={save}>
        <h2>{editId ? "भर्ती संपादित करें" : "नई भर्ती जोड़ें"}</h2>
        <div className="form-grid">
          {input("भर्ती का नाम *", "title", "text", true)}
          {input("विभाग / संस्था / भर्ती बोर्ड", "organization")}
          <label className="field">
            भर्ती विभाग
            <select value={form.department || ""} onChange={(e) => set("department", e.target.value)}>
              <option value="">विभाग चुनें</option>
              {allCategoryOptions.filter((x) => x.category_type === "department").map((x) =>
                <option key={x.slug} value={x.name}>{x.name}</option>
              )}
            </select>
          </label>
          <label className="field">
            पोस्ट का प्रकार
            <select value={form.recruitment_type || "सरकारी नौकरी"} onChange={(e) => set("recruitment_type", e.target.value)}>
              {["सरकारी नौकरी", "संविदा", "अप्रेंटिसशिप", "निजी नौकरी", "इंटर्नशिप", "प्रवेश / छात्रवृत्ति", "सरकारी योजना", "एडमिट कार्ड", "रिजल्ट"].map((x) =>
                <option key={x} value={x}>{x}</option>
              )}
            </select>
          </label>
          <label className="field">
            मुख्य श्रेणी
            <select value={form.category || ""} onChange={(e) => set("category", e.target.value)}>
              {["सरकारी नौकरी", "एडमिट कार्ड", "रिजल्ट", "आंसर की", "स्कॉलरशिप", "प्रवेश", "सरकारी योजना", ...allCategoryOptions.map((x) => x.name)]
                .filter((x, i, arr) => arr.indexOf(x) === i)
                .map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </label>
          {input("राज्य / स्थान", "location")}
          {input("कुल पद (यदि लागू हो)", "vacancies")}
          {input("योग्यता", "qualification")}
        </div>

        <section className="field full" style={{ marginTop: 16 }}>
          <strong>किस-किस सूची में दिखाना है?</strong>
          <p className="sub">नीचे चिप/टैग चुनें। एक ही पोस्ट सभी चुनी हुई श्रेणियों में दिखेगी। Latest Jobs में सभी प्रकाशित नौकरियाँ स्वतः आती हैं।</p>
          <input aria-label="श्रेणी खोजें" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="श्रेणी खोजें…" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {visibleCategories.map((item) => {
              const selected = (form.category_slugs || []).includes(item.slug);
              return (
                <button key={item.slug} type="button" onClick={() => toggleCategory(item.slug)}
                  aria-pressed={selected}
                  style={{
                    border: "1px solid " + (selected ? "#155eef" : "var(--border, #d0d5dd)"),
                    borderRadius: 999, padding: "8px 12px", cursor: "pointer",
                    background: selected ? "#eaf1ff" : "transparent",
                    color: selected ? "#1246b8" : "inherit", fontWeight: selected ? 650 : 450
                  }}>
                  {selected ? "✓ " : "+ "}{item.name}
                </button>
              );
            })}
          </div>
          <small>{(form.category_slugs || []).length} श्रेणियाँ चुनी गईं</small>
        </section>

        <div className="form-grid" style={{ marginTop: 16 }}>
          {input("आवेदन शुरू होने की तारीख", "application_start", "date")}
          {input("आवेदन की अंतिम तिथि", "application_end", "date")}
          {input("परीक्षा तिथि", "exam_date", "date")}
          {input("पोस्ट की वैधता / समाप्ति", "valid_through", "date")}
          {input("आधिकारिक वेबसाइट URL", "official_url", "url")}
          {input("आधिकारिक नोटिफिकेशन URL", "notification_url", "url")}
          {input("इमेज URL (वैकल्पिक)", "image_url", "url")}
        </div>

        <button type="button" className="small-btn" style={{ margin: "14px 0" }}
          onClick={() => setShowAdvanced((v) => !v)} aria-expanded={showAdvanced}>
          {showAdvanced ? "− अतिरिक्त विवरण छिपाएँ" : "+ अतिरिक्त विवरण / एडवांस फ़ील्ड"}
        </button>

        {showAdvanced ? (
          <div className="form-grid">
            {input("आयु सीमा / छूट", "age_limit")}
            {input("आवेदन शुल्क", "application_fee")}
            {input("वेतन / पे-लेवल", "salary")}
            {input("चयन प्रक्रिया", "selection_process")}
            {input("आधिकारिक स्रोत / विभागीय पेज", "official_source", "url")}
            <label className="field">
              स्थिति
              <select value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="draft">ड्राफ्ट</option>
                <option value="published">प्रकाशित</option>
                <option value="archived">आर्काइव</option>
              </select>
            </label>
            <label className="field full">
              भर्ती का विवरण
              <textarea rows={6} value={form.description || ""} onChange={(e) => set("description", e.target.value)} />
            </label>
            <label className="checkline">
              <input type="checkbox" checked={!!form.featured} onChange={(e) => set("featured", e.target.checked)} />
              प्रमुख भर्ती के रूप में दिखाएँ
            </label>
          </div>
        ) : (
          <p className="sub">प्रकाशित करने, ड्राफ्ट रखने, इमेज और विस्तृत जानकारी के लिए एडवांस फ़ील्ड खोलें।</p>
        )}

        <button className="btn" disabled={busy}>{busy ? "सेव हो रहा है…" : editId ? "बदलाव सेव करें" : "भर्ती सेव करें"}</button>
        {editId ? <button type="button" className="small-btn" onClick={resetForm}>रद्द करें</button> : null}
      </form>

      <div className="admin-card">
        <h2>सभी भर्तियाँ ({rows.length})</h2>
        <div className="table-wrap">
          <table className="admin-table">
            <thead><tr><th>भर्ती</th><th>अंतिम तिथि</th><th>स्थिति</th><th>कार्रवाई</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.title}<br /><small>{row.organization}</small></td>
                  <td>{row.application_end || "—"}</td>
                  <td><span className={"status " + row.status}>{row.status}</span></td>
                  <td>
                    <button type="button" className="small-btn" onClick={() => edit(row)}>संपादित</button>{" "}
                    <button type="button" className="small-btn" onClick={() => del(row.id)}>हटाएँ</button>
                  </td>
                </tr>
              ))}
              {!rows.length ? <tr><td colSpan={4}>अभी कोई भर्ती नहीं।</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default function JobsPage() {
  return <AdminGuard><JobsAdmin /></AdminGuard>;
}
