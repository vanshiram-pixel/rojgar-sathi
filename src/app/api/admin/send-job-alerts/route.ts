import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

export const runtime = "nodejs";
function matches(profile: any, job: any) {
  const chosen: string[] = Array.isArray(profile.categories) ? profile.categories : [];
  if (!chosen.length) return false;
  const category = String(job.category || "").toLowerCase();
  const title = String(job.title || "").toLowerCase();
  const location = String(job.location || "").toLowerCase();
  const qualification = String(job.qualification || "").toLowerCase();
  const haystack = [category, title, String(job.organization || "").toLowerCase()].join(" ");
  const categoryMatch = chosen.some((c) => {
    const v = c.toLowerCase();
    if (v === "latest jobs") return ["job", "vacancy", "recruit", "भर्ती", "नौकरी"].some((x) => haystack.includes(x));
    if (v === "rajasthan govt jobs") return location.includes("rajasthan") && ["job", "vacancy", "recruit", "भर्ती", "नौकरी"].some((x) => haystack.includes(x));
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
  const stateMatch = !profile.state || ["all india", "other"].includes(String(profile.state).toLowerCase()) || location.includes(String(profile.state).toLowerCase()) || location === "भारत" || location === "india";
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
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return NextResponse.json({ error: "यूज़र डेटा पढ़ने के लिए SUPABASE_SERVICE_ROLE_KEY सेट करें।" }, { status: 503 });
    const adminDb = createSupabaseAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    if (!apiKey || !from) return NextResponse.json({ error: "ईमेल सेवा सेट नहीं है। Vercel में RESEND_API_KEY और RESEND_FROM_EMAIL जोड़ें।" }, { status: 503 });
    const { data: profiles, error: profileError } = await adminDb.from("user_profiles").select("user_id,email,full_name,state,qualification,categories,alert_frequency,email_alerts").eq("email_alerts", true);
    if (profileError) return NextResponse.json({ error: "यूज़र की पसंद पढ़ने में त्रुटि: " + profileError.message }, { status: 500 });
    const recipients = (profiles || []).filter((p: any) => p.email && matches(p, job));
    let sent = 0, failed = 0, skipped = 0;
    for (const p of recipients) {
      const { data: existing } = await adminDb.from("user_alert_log").select("id").eq("user_id", p.user_id).eq("job_id", job.id).eq("channel", "email").maybeSingle();
      if (existing) { skipped++; continue; }
      const safeTitle = String(job.title).replace(/[<>]/g, "");
      const safeOrg = String(job.organization || "").replace(/[<>]/g, "");
      const safeCategory = String(job.category || "").replace(/[<>]/g, "");
      const details = String(job.description || "").replace(/[<>]/g, "").slice(0, 1200);
      const applyUrl = job.official_url || job.notification_url || "https://updated-rojgar.vercel.app/jobs";
      const payload = { from, to: [p.email], subject: "Rojgar Sathi Alert: " + safeTitle, html: '<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#172033"><h2>Rojgar Sathi</h2><p>नमस्ते ' + String(p.full_name || "दोस्त").replace(/[<>]/g, "") + ',</p><p>आपकी चुनी हुई कैटेगरी से मेल खाता नया अपडेट:</p><h2>' + safeTitle + '</h2><p><b>विभाग:</b> ' + safeOrg + '</p><p><b>कैटेगरी:</b> ' + safeCategory + '</p><p><b>स्थान:</b> ' + String(job.location || "").replace(/[<>]/g, "") + '</p><p><b>योग्यता:</b> ' + String(job.qualification || "").replace(/[<>]/g, "") + '</p><p>' + details + '</p><p><a href="' + applyUrl + '">आधिकारिक विवरण / आवेदन देखें</a></p><hr/><p style="font-size:12px;color:#667085">यह ईमेल आपकी Rojgar Sathi पसंद के आधार पर भेजा गया है। ईमेल बंद करने के लिए अपनी प्रोफाइल में Email Alerts बंद करें: <a href="https://updated-rojgar.vercel.app/profile">Notification Settings</a>.</p></div>' };
      try {
        const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!response.ok) { failed++; continue; }
        const { error: logError } = await adminDb.from("user_alert_log").insert({ user_id: p.user_id, job_id: job.id, channel: "email" });
        if (logError) failed++; else sent++;
      } catch { failed++; }
    }
    return NextResponse.json({ ok: true, matched: recipients.length, sent, skipped, failed, message: "मेल मिलान पूरा हुआ।" });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "नोटिफिकेशन भेजने में त्रुटि।" }, { status: 500 });
  }
}