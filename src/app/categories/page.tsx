import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data";
import { AdSlot } from "@/components/AdSlot";

export const revalidate = 60;

type Category = { id: string; name: string; slug: string; category_type: string; description: string; sort_order: number };

const groups: { type: string; title: string; description: string }[] = [
  { type: "content", title: "मुख्य अपडेट", description: "नई भर्ती, एडमिट कार्ड, परिणाम, उत्तर कुंजी और परीक्षा कैलेंडर" },
  { type: "state", title: "राज्यवार सरकारी नौकरी", description: "भारत के सभी राज्य और केंद्रशासित प्रदेश" },
  { type: "education", title: "शिक्षा और विद्यार्थी", description: "प्रवेश, छात्रवृत्ति, बोर्ड परीक्षा और विश्वविद्यालय अपडेट" },
  { type: "scheme", title: "सरकारी योजनाएँ", description: "केंद्र और राज्य सरकार की योजनाओं की जानकारी" },
  { type: "employment", title: "रोजगार और कौशल", description: "अप्रेंटिसशिप, निजी नौकरियाँ, इंटर्नशिप और कौशल" },
  { type: "exam", title: "परीक्षा श्रेणियाँ", description: "परीक्षा-विशेष जानकारी" },
  { type: "department", title: "विभाग के अनुसार भर्ती", description: "रक्षा, पुलिस, रेलवे, शिक्षक, बैंकिंग, स्वास्थ्य, PSU और अन्य विभाग" },
  { type: "qualification", title: "योग्यता के अनुसार भर्ती", description: "8वीं, 10वीं, 12वीं, ITI, डिप्लोमा, ग्रेजुएशन और उच्च योग्यता" },
];

export default async function CategoriesPage() {
  const settings = await getSettings();
  let categories: Category[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("portal_categories").select("id,name,slug,category_type,description,sort_order").eq("is_active", true).order("sort_order").order("name");
    categories = (data || []) as Category[];
  } catch {}

  return <>
    <header className="header"><div className="wrap header-inner"><Link className="brand" href="/">रोज़गार साथी</Link><Link href="/" className="text-link">← होम</Link></div></header>
    <main className="wrap page">
      <h1 className="page-title">सभी श्रेणियाँ और राज्यवार भर्ती</h1>
      <p className="sub">केंद्र सरकार, सभी राज्य/केंद्रशासित प्रदेश, शिक्षा, परीक्षा, छात्रवृत्ति और योजनाओं की श्रेणियाँ। आवेदन से पहले संबंधित विभाग की आधिकारिक अधिसूचना अवश्य पढ़ें।</p>
      <div className="portal-ad portal-ad-inline"><AdSlot enabled={settings.ads_enabled} client={settings.adsense_client} slot={settings.ad_slot_home} compact label="श्रेणियों के ऊपर विज्ञापन"/></div>
      {categories.length === 0 ? <div className="empty">श्रेणियाँ अभी सेट नहीं हैं। व्यवस्थापक से Supabase में पोर्टल श्रेणी माइग्रेशन चलाने को कहें।</div> : groups.map((group) => {
        const items = categories.filter((item) => item.category_type === group.type);
        if (!items.length) return null;
        return <section className="category-directory" key={group.type}>
          <div className="section-head"><div><h2>{group.title}</h2><p className="sub">{group.description}</p></div></div>
          <div className="category-directory-grid">{items.map((item) => <Link className="directory-card" key={item.id} href={item.category_type === "state" ? `/state/${item.slug}` : `/category/${item.slug}`}><strong>{item.name}</strong><span>{item.description}</span><small>अपडेट देखें →</small></Link>)}</div>
        </section>;
      })}
      <div className="portal-ad portal-ad-inline"><AdSlot enabled={settings.ads_enabled} client={settings.adsense_client} slot={settings.ad_slot_home} compact label="श्रेणियों के नीचे विज्ञापन"/></div>
    </main>
  </>;
}
