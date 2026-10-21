import { createClient } from "@/lib/supabase/server";

export type SiteSettings = {
  brand_name: string; tagline: string; logo_url: string; favicon_url: string;
  splash_image_url: string; splash_title: string; splash_subtitle: string;
  primary_color: string; accent_color: string; background_color: string;
  theme_mode: "light" | "dark" | "system"; font_family: string; layout_preset: string;
  home_hero_title: string; home_hero_subtitle: string; show_latest_jobs: boolean;
  show_admission: boolean; show_scholarships: boolean; show_schemes: boolean;
  navigation: {label:string;href:string}[]; seo_title: string; seo_description: string;
  ads_enabled: boolean; adsense_client: string; ad_slot_home: string; ad_slot_job: string;
  topbar_text: string; footer_text: string; header_style: string; footer_style: string; custom_css: string;
};
export const defaultSettings: SiteSettings = {
  brand_name:"Rojgar Sathi", tagline:"सरकारी नौकरी और करियर की सही जानकारी", logo_url:"/rojgar-sathi-logo.svg", favicon_url:"",
  splash_image_url:"", splash_title:"Rojgar Sathi", splash_subtitle:"आपके भविष्य की सही शुरुआत",
  primary_color:"#155eef", accent_color:"#12b981", background_color:"#f5f7fb", theme_mode:"light",
  font_family:"system", layout_preset:"modern", home_hero_title:"अपनी अगली नौकरी यहाँ खोजें",
  home_hero_subtitle:"सरकारी भर्ती, एडमिट कार्ड, रिजल्ट और छात्रवृत्ति अपडेट",
  show_latest_jobs:true, show_admission:true, show_scholarships:true, show_schemes:true,
  navigation:[{label:"सरकारी नौकरी",href:"/jobs"},{label:"एडमिट कार्ड",href:"/category/admit-card"},{label:"रिजल्ट",href:"/category/result"},{label:"स्कॉलरशिप",href:"/category/scholarship"}],
  seo_title:"Rojgar Sathi | सरकारी नौकरी", seo_description:"सरकारी नौकरी, भर्ती, एडमिट कार्ड, रिजल्ट और स्कॉलरशिप की जानकारी.",
  ads_enabled:false, adsense_client:"", ad_slot_home:"", ad_slot_job:"",
  topbar_text:"रोज़गार, परीक्षा और छात्रवृत्ति की जानकारी", footer_text:"रोज़गार साथी — आधिकारिक नोटिफिकेशन पढ़कर ही आवेदन करें।", header_style:"classic", footer_style:"columns", custom_css:""
};
export async function getSettings(): Promise<SiteSettings> {
  try {
    const supabase = await createClient();
    const {data} = await supabase.from("site_settings").select("*").eq("id",1).maybeSingle();
    const merged = {...defaultSettings, ...(data ?? {})} as SiteSettings;
    // Keep legacy saved settings from leaking the retired public brand.
    if (/^updated\s*rojgar$/i.test(merged.brand_name?.trim() || "")) merged.brand_name = "Rojgar Sathi";
    if (/^updated\s*rojgar\b/i.test(merged.seo_title?.trim() || "")) merged.seo_title = merged.seo_title.replace(/^updated\s*rojgar/i, "Rojgar Sathi");
    if (/^updated\s*rojgar$/i.test(merged.splash_title?.trim() || "")) merged.splash_title = "Rojgar Sathi";
    return merged;
  } catch { return defaultSettings; }
}
export async function getPublishedJobs(search = "") {
  try {
    const supabase = await createClient();
    const term = search.trim().replace(/[%_,]/g," ");
    let query = supabase.from("jobs").select("*").eq("status","published").order("created_at",{ascending:false}).limit(100);
    if (term) query = query.or(`title.ilike.%${term}%,organization.ilike.%${term}%,category.ilike.%${term}%,department.ilike.%${term}%,qualification.ilike.%${term}%`);
    const result = await query;
    if (!result.error) return result.data ?? [];
    // Compatibility fallback until the department metadata migration is applied.
    let legacy = supabase.from("jobs").select("*").eq("status","published").order("created_at",{ascending:false}).limit(100);
    if (term) legacy = legacy.or(`title.ilike.%${term}%,organization.ilike.%${term}%,category.ilike.%${term}%`);
    const fallback = await legacy;
    return fallback.data ?? [];
  } catch { return []; }
}