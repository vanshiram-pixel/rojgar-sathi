"use client";

import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { createClient } from "@/lib/supabase/client";

const blank: any = {
  title: "", slug: "", content_type: "scheme", government_level: "central", state_name: "",
  department: "", department_slug: "", state_slug: "", primary_category_slug: "", summary: "", body: "", eligibility: "", benefits: "", required_documents: "",
  application_start: "", application_end: "", official_url: "", notification_url: "",
  image_url: "", category_slugs: [], status: "draft", featured: false
};

const typeLabels: Record<string, string> = {
  scholarship: "छात्रवृत्ति", scheme: "सरकारी योजना", admission: "प्रवेश",
  university_update: "विश्वविद्यालय अपडेट", admit_card: "एडमिट कार्ड",
  result: "रिजल्ट", answer_key: "आंसर की", exam_update: "परीक्षा अपडेट",
  employment_update: "रोजगार अपडेट"
};

function todayInIndia(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function isHttpsUrl(value: unknown): boolean {
  if (typeof value !== "string" || !value.trim()) return false;
  try { return new URL(value.trim()).protocol === "https:"; } catch { return false; }
}

function ContentManager() {
  const [rows, setRows] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ ...blank });
  const [editId, setEditId] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [listSearch, setListSearch] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  async function load() {
    const client = createClient();
    const { data, error } = await client.from("content_items").select("*").order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setRows(data || []);
  }

  useEffect(() => {
    load();
    (async () => {
      const client = createClient();
      const { data, error } = await client.from("portal_categories").select("name,slug,category_type")
        .eq("is_active", true).order("sort_order");
      if (error) setError(error.message);
      else {
        setCategories(data || []);
        setStates((data || []).filter((item: any) => item.category_type === "state"));
      }
    })();
  }, []);

  function set(key: string, value: any) {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  }

  function makeSlug(title: string) {
    const latin = title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 55);
    return latin || "update-" + new Date().toISOString().slice(0, 10);
  }

  function startNewType(type: string) {
    setForm((prev: any) => ({ ...prev, content_type: type }));
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

  function reset() {
    setEditId("");
    setForm({ ...blank });
    setError("");
    setMessage("");
  }

  async function uploadImage(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("केवल JPG, PNG या WebP इमेज चुनें।");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("इमेज 5 MB से छोटी होनी चाहिए।");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const client = createClient();
      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = "content/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + extension;
      const { error } = await client.storage.from("content-images").upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = client.storage.from("content-images").getPublicUrl(path);
      set("image_url", data.publicUrl);
      setMessage("इमेज अपलोड हो गई। पोस्ट सेव करना न भूलें।");
    } catch (e: any) {
      setError(e.message || "इमेज अपलोड नहीं हो सकी। पहले content hub वाली SQL migration चलाएँ।");
    } finally {
      setUploading(false);
    }
  }

  async function generateAiDraft() {
    setAiBusy(true);
    setError("");
    setMessage("");
    try {
      const source = [
        form.summary ? "मौजूदा सार: " + form.summary : "",
        form.body ? "मौजूदा विवरण: " + form.body : "",
        form.eligibility ? "मौजूदा पात्रता: " + form.eligibility : "",
        form.benefits ? "मौजूदा लाभ: " + form.benefits : "",
        form.required_documents ? "मौजूदा दस्तावेज़: " + form.required_documents : "",
        form.state_name ? "राज्य: " + form.state_name : "",
        form.department ? "विभाग: " + form.department : "",
        form.application_start ? "आवेदन शुरू: " + form.application_start : "",
        form.application_end ? "आवेदन अंतिम तिथि: " + form.application_end : "",
      ].filter(Boolean).join("\n");
      const response = await fetch("/api/admin/assist-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          contentType: form.content_type,
          source,
          officialUrl: form.official_url,
          notificationUrl: form.notification_url,
          categories: categories.map((item: any) => ({ slug: item.slug, name: item.name, type: item.category_type })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "AI ड्राफ्ट तैयार नहीं हो सका।");
      const draft = result.draft || {};
      setForm((previous: any) => ({
        ...previous,
        summary: draft.summary || previous.summary,
        body: draft.body || previous.body,
        eligibility: draft.eligibility || previous.eligibility,
        benefits: draft.benefits || previous.benefits,
        required_documents: draft.required_documents || previous.required_documents,
        category_slugs: [...new Set([
          ...(Array.isArray(previous.category_slugs) ? previous.category_slugs : []),
          ...(Array.isArray(draft.category_slugs) ? draft.category_slugs : []),
        ])],
      }));
      setMessage("AI ड्राफ्ट तैयार है। सेव या प्रकाशित करने से पहले सभी तथ्य, तारीखें, श्रेणियाँ और आधिकारिक लिंक स्वयं जाँचें।");
    } catch (e: any) {
      setError(e.message || "AI ड्राफ्ट तैयार नहीं हो सका।");
    } finally {
      setAiBusy(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const title = String(form.title || "").trim();
      const slug = String(form.slug || makeSlug(title)).trim().toLowerCase();
      const officialUrl = String(form.official_url || "").trim();
      const notificationUrl = String(form.notification_url || "").trim();
      if (!title) throw new Error("पोस्ट का शीर्षक भरना आवश्यक है।");
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("URL slug में केवल English अक्षर, अंक और hyphen रखें।");
      if (form.status === "published") {
        if (!isHttpsUrl(officialUrl) && !isHttpsUrl(notificationUrl)) throw new Error("प्रकाशित जानकारी के लिए कम-से-कम एक आधिकारिक HTTPS लिंक आवश्यक है।");
        if (form.application_end && form.application_end < todayInIndia()) throw new Error("आवेदन की अंतिम तिथि निकल चुकी है। पोस्ट को आर्काइव करें या आधिकारिक तारीख सत्यापित करें।");
      }
      if (form.application_start && form.application_end && form.application_start > form.application_end) throw new Error("आवेदन शुरू होने की तारीख, अंतिम तिथि से बाद की नहीं हो सकती।");
      const client = createClient();
      const payload = {
        ...form,
        title,
        slug,
        official_url: officialUrl || null,
        notification_url: notificationUrl || null,
        category_slugs: [...new Set([...(Array.isArray(form.category_slugs) ? form.category_slugs : []), ...(form.primary_category_slug ? [form.primary_category_slug] : []), ...(form.state_slug ? [form.state_slug] : []), ...(form.department_slug ? [form.department_slug] : [])])],
        state_slug: form.state_slug || "",
        department_slug: form.department_slug || "",
        primary_category_slug: form.primary_category_slug || "",
        application_start: form.application_start || null,
        application_end: form.application_end || null,
        last_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const result = editId
        ? await client.from("content_items").update(payload).eq("id", editId)
        : await client.from("content_items").insert(payload);
      if (result.error) throw result.error;
      setMessage("जानकारी सेव हो गई।");
      reset();
      await load();
    } catch (e: any) {
      setError(e.message || "जानकारी सेव नहीं हो सकी।");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("क्या इस जानकारी को स्थायी रूप से हटाना चाहते हैं?")) return;
    const client = createClient();
    const { error } = await client.from("content_items").delete().eq("id", id);
    if (error) setError(error.message);
    else { setMessage("जानकारी हटा दी गई।"); await load(); }
  }

  const matchingCategories = categories.filter((item) =>
    (item.name + " " + item.category_type).toLowerCase().includes(categorySearch.toLowerCase())
  );
  const matchingRows = rows.filter((row) => (row.title + " " + (typeLabels[row.content_type] || "")).toLowerCase().includes(listSearch.toLowerCase()));

  return (
    <>
      <div className="admin-head">
        <div><h1>स्कॉलरशिप, योजनाएँ और शिक्षा अपडेट</h1><p className="sub">डेमो पोस्ट नहीं—केवल सत्यापित वास्तविक जानकारी प्रकाशित करें।</p></div>
      </div>
      {message ? <div className="notice success" role="status">{message}</div> : null}
      {error ? <div className="notice error" role="alert">{error}</div> : null}

      <form className="admin-card" onSubmit={save}>
        <h2>{editId ? "पोस्ट संपादित करें" : "नई जानकारी जोड़ें"}</h2>
        <div className="form-grid">
          <label className="field">किस प्रकार की जानकारी?
            <select value={form.content_type} onChange={(e) => startNewType(e.target.value)}>
              {Object.entries(typeLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}
            </select>
          </label>
          <label className="field">सरकार / संस्था
            <select value={form.government_level} onChange={(e) => set("government_level", e.target.value)}>
              <option value="central">केंद्र सरकार</option><option value="state">राज्य सरकार</option>
              <option value="university">विश्वविद्यालय / कॉलेज</option><option value="district">जिला / स्थानीय</option><option value="private">निजी संस्था</option>
            </select>
          </label>
          {form.government_level === "state" || form.government_level === "district" ? (
            <label className="field">राज्य / क्षेत्र
              <select value={form.state_slug || ""} onChange={(e) => {
                const item = states.find((x: any) => x.slug === e.target.value);
                setForm((prev: any) => ({ ...prev, state_slug: e.target.value, state_name: item?.name || "" }));
              }}>
                <option value="">राज्य / क्षेत्र चुनें</option>{states.map((item) => <option value={item.slug} key={item.slug}>{item.name}</option>)}
              </select>
            </label>
          ) : null}
          <label className="field">शीर्षक *
            <input required value={form.title} onChange={(e) => {
              const title = e.target.value;
              setForm((prev: any) => ({ ...prev, title, slug: editId ? prev.slug : makeSlug(title) }));
            }} />
          </label>
          <label className="field">URL slug
            <input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={(e) => set("slug", e.target.value)} />
          </label>
          <label className="field">विभाग / संस्था (मानक सूची)
            <select value={form.department_slug || ""} onChange={(e) => {
              const item = categories.find((x: any) => x.slug === e.target.value);
              setForm((prev: any) => ({ ...prev, department_slug: e.target.value, department: item?.name || prev.department }));
            }}>
              <option value="">विभाग चुनें (यदि लागू हो)</option>
              {categories.filter((item: any) => item.category_type === "department").map((item: any) => <option value={item.slug} key={item.slug}>{item.name}</option>)}
            </select>
            <input value={form.department || ""} onChange={(e) => set("department", e.target.value)} placeholder="वैकल्पिक: संस्था / बोर्ड का सटीक नाम" />
          </label>
          <label className="field">आवेदन शुरू
            <input type="date" value={form.application_start || ""} onChange={(e) => set("application_start", e.target.value)} />
          </label>
          <label className="field">अंतिम तिथि
            <input type="date" value={form.application_end || ""} onChange={(e) => set("application_end", e.target.value)} />
          </label>
          <label className="field">आधिकारिक आवेदन / योजना लिंक
            <input type="url" value={form.official_url} onChange={(e) => set("official_url", e.target.value)} placeholder="https://" />
          </label>
          <label className="field">आधिकारिक नोटिफिकेशन लिंक
            <input type="url" value={form.notification_url} onChange={(e) => set("notification_url", e.target.value)} placeholder="https://" />
          </label>
          <label className="field">संक्षिप्त सार
            <textarea rows={3} value={form.summary} onChange={(e) => set("summary", e.target.value)} />
          </label>
          <label className="field">पात्रता
            <textarea rows={3} value={form.eligibility} onChange={(e) => set("eligibility", e.target.value)} />
          </label>
          <label className="field">लाभ / सहायता राशि
            <textarea rows={3} value={form.benefits} onChange={(e) => set("benefits", e.target.value)} />
          </label>
          <label className="field">आवश्यक दस्तावेज़
            <textarea rows={3} value={form.required_documents} onChange={(e) => set("required_documents", e.target.value)} />
          </label>
        </div>

        <div className="admin-card" style={{ marginTop: 16 }}>
          <h3>पोस्ट इमेज (वैकल्पिक)</h3>
          <label className="field">इमेज फ़ाइल — JPG, PNG, WebP (अधिकतम 5 MB)
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => uploadImage(e.target.files?.[0])} disabled={uploading} />
          </label>
          {uploading ? <p className="sub">इमेज अपलोड हो रही है…</p> : null}
          <label className="field">या इमेज URL
            <input type="url" value={form.image_url || ""} onChange={(e) => set("image_url", e.target.value)} placeholder="https://" />
          </label>
          {form.image_url ? <img src={form.image_url} alt="पोस्ट पूर्वावलोकन" style={{ maxWidth: 260, maxHeight: 160, objectFit: "contain", borderRadius: 10 }} /> : null}
        </div>

        <label className="field">मुख्य श्रेणी
            <select value={form.primary_category_slug || ""} onChange={(e) => set("primary_category_slug", e.target.value)}>
              <option value="">मुख्य श्रेणी चुनें</option>
              {categories.map((item: any) => <option value={item.slug} key={item.slug}>{item.name}</option>)}
            </select>
          </label>
          <section className="field full">
          <strong>संबंधित श्रेणियाँ चुनें</strong>
          <p className="sub">एक पोस्ट कई जगह दिख सकती है।</p>
          <input value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} placeholder="श्रेणी खोजें…" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {matchingCategories.map((item) => {
              const selected = (form.category_slugs || []).includes(item.slug);
              return <button key={item.slug} type="button" onClick={() => toggleCategory(item.slug)} aria-pressed={selected}
                style={{ border: "1px solid " + (selected ? "#155eef" : "var(--border, #d0d5dd)"), borderRadius: 999, padding: "8px 12px", cursor: "pointer", background: selected ? "#eaf1ff" : "transparent", color: selected ? "#1246b8" : "inherit" }}>
                {selected ? "✓ " : "+ "}{item.name}
              </button>;
            })}
          </div>
        </section>

        <div className="form-grid" style={{ marginTop: 16 }}>
          <label className="field">प्रकाशन स्थिति
            <select value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="draft">ड्राफ्ट</option><option value="published">प्रकाशित</option><option value="archived">आर्काइव</option>
            </select>
          </label>
          <label className="checkline"><input type="checkbox" checked={!!form.featured} onChange={(e) => set("featured", e.target.checked)} /> प्रमुख पोस्ट</label>
          <label className="field full">पूरा विवरण
            <textarea rows={8} value={form.body} onChange={(e) => set("body", e.target.value)} />
          </label>
          <div className="field full">
            <button type="button" className="small-btn" onClick={generateAiDraft} disabled={aiBusy || busy || uploading}>
              {aiBusy ? "AI ड्राफ्ट तैयार हो रहा है…" : "AI से विवरण व श्रेणी सुझाव"}
            </button>
            <p className="sub">AI केवल ड्राफ्ट सुझाता है। आधिकारिक नोटिस से हर तथ्य जाँचें; AI ड्राफ्ट अपने-आप प्रकाशित नहीं होगा।</p>
          </div>
        </div>
        <button type="button" className="small-btn" style={{ margin: "14px 8px 14px 0" }} onClick={() => setShowPreview((v) => !v)} aria-expanded={showPreview}>{showPreview ? "पूर्वावलोकन बंद करें" : "ड्राफ्ट / पोस्ट पूर्वावलोकन"}</button>
        {showPreview ? <section className="admin-card preview-card" aria-label="पोस्ट पूर्वावलोकन"><p className="sub">पूर्वावलोकन · {form.status === "published" ? "प्रकाशित स्थिति चुनी गई है" : "यह अभी सार्वजनिक रूप से प्रकाशित नहीं है"}</p>{form.image_url ? <img src={form.image_url} alt="" style={{ maxWidth: "100%", maxHeight: 220, objectFit: "contain", borderRadius: 10 }} /> : null}<span className="tag">{typeLabels[form.content_type] || form.content_type || "अपडेट"}</span><h2>{form.title || "पोस्ट का शीर्षक यहाँ दिखेगा"}</h2>{form.summary ? <p><strong>{form.summary}</strong></p> : null}<p>{form.body || "पूरा विवरण यहाँ दिखाई देगा।"}</p><div className="preview-facts">{[["राज्य",form.state_name],["विभाग",form.department],["आवेदन प्रारंभ",form.application_start],["अंतिम तिथि",form.application_end],["पात्रता",form.eligibility],["लाभ",form.benefits],["आवश्यक दस्तावेज़",form.required_documents]].filter(([,v])=>String(v||"").trim()).map(([label,value])=><div key={String(label)}><small>{label}</small><strong>{String(value)}</strong></div>)}</div>{form.official_url ? <p><strong>आधिकारिक वेबसाइट:</strong> {form.official_url}</p> : null}{form.notification_url ? <p><strong>अधिसूचना:</strong> {form.notification_url}</p> : null}</section> : null}
        <button className="btn" disabled={busy || uploading}>{busy ? "सेव हो रहा है…" : editId ? "बदलाव सेव करें" : "पोस्ट सेव करें"}</button>
        {editId ? <button type="button" className="small-btn" onClick={reset}>रद्द करें</button> : null}
      </form>

      <div className="admin-card">
        <h2>मौजूदा पोस्ट ({rows.length})</h2>
        <input value={listSearch} onChange={(e) => setListSearch(e.target.value)} placeholder="शीर्षक या प्रकार से खोजें…" />
        <div className="table-wrap"><table className="admin-table">
          <thead><tr><th>पोस्ट</th><th>प्रकार</th><th>स्थिति</th><th>कार्रवाई</th></tr></thead>
          <tbody>
            {matchingRows.map((row) => <tr key={row.id}><td>{row.title}<br /><small>{row.state_name || row.government_level}</small></td><td>{typeLabels[row.content_type] || row.content_type}</td><td>{row.status}</td><td><button type="button" className="small-btn" onClick={() => edit(row)}>संपादित</button>{" "}<button type="button" className="small-btn" onClick={() => remove(row.id)}>हटाएँ</button></td></tr>)}
            {!matchingRows.length ? <tr><td colSpan={4}>कोई पोस्ट नहीं मिली।</td></tr> : null}
          </tbody>
        </table></div>
      </div>
    </>
  );
}

export default function AdminContentPage() {
  return <AdminGuard><ContentManager /></AdminGuard>;
}
