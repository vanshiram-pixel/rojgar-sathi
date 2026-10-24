import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

export const runtime = "nodejs";

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://rojgar-sathi-main.vercel.app").origin;

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char] || char);
}

function safeApplyUrl(value: unknown): string {
  const fallback = `${siteUrl}/jobs`;
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" ? parsed.toString() : fallback;
  } catch {
    return fallback;
  }
}

function matches(profile: any, job: any) {
  const chosen: string[] = Array.isArray(profile.categories) ? profile.categories : [];
  if (!chosen.length) return false;
  const category = String(job.category || "").toLowerCase();
  const title = String(job.title || "").toLowerCase();
  const location = String(job.location || "").toLowerCase();
  const stateSlug = String(job.state_slug || "").toLowerCase();
  const stateName = String(job.state_name || "").toLowerCase();
  const qualification = String(job.qualification || "").toLowerCase();
  const haystack = [category, title, String(job.organization || "").toLowerCase(), String(job.department || "").toLowerCase()].join(" ");
  const categoryMatch = chosen.some((c) => {
    const v = c.toLowerCase();
    if (v === "latest jobs") return ["job", "vacancy", "recruit", "भर्ती", "नौकरी"].some((x) => haystack.includes(x));
    if (v === "rajasthan govt jobs") return (stateSlug === "rajasthan" || stateName.includes("rajasthan") || location.includes("rajasthan") || location.includes("राजस्थान")) && ["job", "vacancy", "recruit", "भर्ती", "नौकरी"].some((x) => haystack.includes(x));
    if (v === "central government jobs") return /central|केंद्र|ssc|upsc|railway|रेलवे/.test(haystack);
    if (v === "state government jobs") return /state|राज्य|सरकार|भर्ती/.test(haystack);
    if (v === "police recruitment") return /police|पुलिस/.test(haystack);
    if (v === "railway jobs") return /railway|रेलवे|rrb/.test(haystack);
    if (v === "teaching jobs") return /teacher|teaching|शिक्षक|अध्यापक|reet|tet/.test(haystack);
    if (v === "admit card") return /admit|प्रवेश पत्र/.test(haystack);
    if (v === "results") return /result|परिणाम|रिजल्ट/.test(haystack);
    if (v === "answer key") return /answer key|उत्तर कुंजी/.test(haystack);
    if (v === "scholarships") return /scholarship|छात्रवृत्ति|स्कॉलरशिप/.test(haystack);
    if (v === "admissions") return /admission|प्रवेश/.test(haystack);
    if (v === "university updates") return /university|college|विश्वविद्यालय|महाविद्यालय/.test(haystack);
    if (v === "government schemes") return /scheme|योजना/.test(haystack);
    if (v === "apprenticeship") return /apprentice|apprenticeship|अप्रेंटिस/.test(haystack);
    if (v === "board exams") return /board|exam|परीक्षा|बोर्ड/.test(haystack);
    return category.includes(v) || title.includes(v);
  });
  const selectedState = String(profile.state || "").trim().toLowerCase();
  const selectedStateSlug = selectedState.replace(/\s+/g, "-");
  const isAllIndia = !selectedState || ["all india", "all-india", "india", "भारत", "other", "अन्य"].includes(selectedState);
  // Match canonical state slugs as well as display names; location may be written in Hindi.
  const stateMatch = isAllIndia || location.includes(selectedState) || stateSlug === selectedStateSlug || stateName.includes(selectedState);
  const q = String(profile.qualification || "").toLowerCase();
  const qualificationMatch = !q || !qualification || qualification.includes(q) || q.includes(qualification) || /any|कोई भी/.test(q);
  return categoryMatch && stateMatch && qualificationMatch;
}
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "लॉगिन आवश्यक है।" }, { status: 401 });
    const { data: admin } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!admin) return NextResponse.json({ error: "केवल एडमिन नोटिफिकेशन भेज सकता है।" }, { status: 403 });
    const body = await request.json();
    const jobId = String(body.jobId || "");
    if (!jobId) return NextResponse.json({ error: "jobId जरूरी है।" }, { status: 400 });
    const { data: job, error: jobError } = await supabase.from("jobs").select("*").eq("id", jobId).eq("status", "published").maybeSingle();
    if (jobError || !job) return NextResponse.json({ error: "प्रकाशित भर्ती नहीं मिली।" }, { status: 404 });
    const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    if (!supabaseUrl) return NextResponse.json({ error: "Supabase URL सेट नहीं है।" }, { status: 503 });
    if (!serviceKey) return NextResponse.json({ error: "यूज़र डेटा पढ़ने के लिए SUPABASE_SECRET_KEY या SUPABASE_SERVICE_ROLE_KEY सेट करें।" }, { status: 503 });
    const adminDb = createSupabaseAdmin(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    if (!apiKey || !from) return NextResponse.json({ error: "ईमेल सेवा सेट नहीं है। Vercel में RESEND_API_KEY और RESEND_FROM_EMAIL जोड़ें।" }, { status: 503 });
    const { data: profiles, error: profileError } = await adminDb.from("user_profiles").select("user_id,email,full_name,state,qualification,categories,alert_frequency,email_alerts").eq("email_alerts", true);
    if (profileError) {
      console.error("Job alert profile lookup failed", profileError);
      return NextResponse.json({ error: "यूज़र की पसंद पढ़ने में त्रुटि। कृपया बाद में फिर प्रयास करें।" }, { status: 500 });
    }
    const recipients = (profiles || []).filter((p: any) => p.email && matches(p, job));
    let sent = 0, failed = 0, skipped = 0;
    for (const p of recipients) {
      const { data: existing } = await adminDb.from("user_alert_log").select("id").eq("user_id", p.user_id).eq("job_id", job.id).eq("channel", "email").maybeSingle();
      if (existing) { skipped++; continue; }
      const safeTitle = escapeHtml(job.title);
      const safeOrg = escapeHtml(job.organization || "");
      const safeCategory = escapeHtml(job.category || "");
      const details = escapeHtml(String(job.description || "").slice(0, 1200));
      const applyUrl = safeApplyUrl(job.official_url || job.notification_url);
      const safeName = escapeHtml(p.full_name || "दोस्त");
      const safeLocation = escapeHtml(job.location || "");
      const safeQualification = escapeHtml(job.qualification || "");
      const payload = {
        from,
        to: [p.email],
        subject: "Rojgar Sathi Alert: " + String(job.title || "").slice(0, 180),
        html: '<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#172033"><h2>Rojgar Sathi</h2><p>नमस्ते ' + safeName + ',</p><p>आपकी चुनी हुई कैटेगरी से मेल खाता नया अपडेट:</p><h2>' + safeTitle + '</h2><p><b>विभाग:</b> ' + safeOrg + '</p><p><b>कैटेगरी:</b> ' + safeCategory + '</p><p><b>स्थान:</b> ' + safeLocation + '</p><p><b>योग्यता:</b> ' + safeQualification + '</p><p>' + details + '</p><p><a href="' + applyUrl + '">आधिकारिक विवरण / आवेदन देखें</a></p><hr/><p style="font-size:12px;color:#667085">यह ईमेल आपकी Rojgar Sathi पसंद के आधार पर भेजा गया है। ईमेल बंद करने के लिए अपनी प्रोफाइल में Email Alerts बंद करें: <a href="' + siteUrl + '/profile">Notification Settings</a>.</p></div>'
      };
      try {
        const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!response.ok) { failed++; continue; }
        const { error: logError } = await adminDb.from("user_alert_log").insert({ user_id: p.user_id, job_id: job.id, channel: "email" });
        if (logError) failed++; else sent++;
      } catch { failed++; }
    }
    return NextResponse.json({ ok: true, matched: recipients.length, sent, skipped, failed, message: "मेल मिलान पूरा हुआ।" });
  } catch (e: unknown) {
    console.error("Job alert request failed", e);
    return NextResponse.json({ error: "नोटिफिकेशन भेजने में त्रुटि। कृपया बाद में फिर प्रयास करें।" }, { status: 500 });
  }
}