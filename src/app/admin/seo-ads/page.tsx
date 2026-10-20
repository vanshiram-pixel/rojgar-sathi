"use client";

import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { createClient } from "@/lib/supabase/client";

type Config = {
  seo_title: string;
  seo_description: string;
  ads_enabled: boolean;
  adsense_client: string;
  ad_slot_home: string;
  ad_slot_job: string;
};

const initial: Config = {
  seo_title: "Updated Rojgar | सरकारी नौकरी",
  seo_description: "सरकारी नौकरी, भर्ती, एडमिट कार्ड, रिजल्ट और स्कॉलरशिप की जानकारी।",
  ads_enabled: false,
  adsense_client: "",
  ad_slot_home: "",
  ad_slot_job: "",
};

function SeoAdsForm() {
  const [config, setConfig] = useState<Config>(initial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const { data, error: loadError } = await supabase
        .from("site_settings")
        .select("seo_title,seo_description,ads_enabled,adsense_client,ad_slot_home,ad_slot_job")
        .eq("id", 1)
        .single();
      if (!active) return;
      if (loadError) setError(loadError.message);
      else if (data) setConfig({ ...initial, ...data });
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  function change<K extends keyof Config>(key: K, value: Config[K]) {
    setConfig((current) => ({ ...current, [key]: value }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    setError("");
    try {
      const supabase = createClient();
      const { error: saveError } = await supabase
        .from("site_settings")
        .update({ ...config, updated_at: new Date().toISOString() })
        .eq("id", 1);
      if (saveError) throw saveError;
      setNotice("SEO और विज्ञापन सेटिंग सेव हो गईं। सार्वजनिक वेबसाइट पर बदलाव की जाँच करें।");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "सेटिंग सेव नहीं हो पाईं।");
    } finally {
      setSaving(false);
    }
  }

  const field = (label: string, key: "seo_title" | "seo_description" | "adsense_client" | "ad_slot_home" | "ad_slot_job", placeholder?: string, help?: string) => (
    <label className="field" key={key}>
      {label}
      {key === "seo_description" ? (
        <textarea value={config[key]} maxLength={320} onChange={(event) => change(key, event.target.value)} />
      ) : (
        <input value={config[key]} placeholder={placeholder} onChange={(event) => change(key, event.target.value)} />
      )}
      {help ? <small className="sub">{help}</small> : null}
    </label>
  );

  return (
    <>
      <div className="admin-head">
        <div><h1>SEO और विज्ञापन</h1><p className="sub">सर्च परिणामों की जानकारी और AdSense स्लॉट कॉन्फ़िगर करें।</p></div>
      </div>
      {notice ? <div className="notice success">{notice}</div> : null}
      {error ? <div className="notice error">{error}</div> : null}
      {loading ? <div className="admin-card">सेटिंग लोड हो रही हैं…</div> : (
        <form onSubmit={save}>
          <section className="admin-card">
            <h2>सर्च इंजन मेटाडेटा</h2>
            <div className="form-grid">
              {field("डिफ़ॉल्ट SEO शीर्षक", "seo_title", "लगभग 50–60 अक्षर रखें।")}
              {field("डिफ़ॉल्ट Meta Description", "seo_description", "मुख्य विषय और उपयोगकर्ता का लाभ स्पष्ट लिखें।")}
            </div>
            <p className="sub">यह डिफ़ॉल्ट साइट सेटिंग है; हर भर्ती के लिए अलग SEO शीर्षक/विवरण और JobPosting structured data अलग फीचर के रूप में जोड़े जा सकते हैं।</p>
          </section>
          <section className="admin-card">
            <h2>Google AdSense</h2>
            <label className="checkline">
              <input type="checkbox" checked={config.ads_enabled} onChange={(event) => change("ads_enabled", event.target.checked)} />
              विज्ञापन सेटिंग सक्षम करें
            </label>
            <div className="form-grid">
              {field("Publisher ID", "adsense_client", "ca-pub-…", "Google AdSense Publisher ID")}
              {field("होमपेज Ad Slot ID", "ad_slot_home", "उदाहरण: 1234567890")}
              {field("भर्ती विवरण Ad Slot ID", "ad_slot_job", "उदाहरण: 1234567890")}
            </div>
            <p className="sub">सुरक्षा: यहाँ केवल Publisher/Slot ID रखें—कभी भी निजी API key या service-role key नहीं। विज्ञापन दिखना AdSense approval, साइट स्क्रिप्ट और नीति अनुपालन पर निर्भर करता है।</p>
          </section>
          <button className="btn" disabled={saving}>{saving ? "सेव हो रहा है…" : "SEO और विज्ञापन सेटिंग सेव करें"}</button>
        </form>
      )}
    </>
  );
}

export default function SeoAdsPage() {
  return <AdminGuard><SeoAdsForm /></AdminGuard>;
}
