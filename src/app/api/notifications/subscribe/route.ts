import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function validEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
function validPhone(value: unknown): value is string {
  return typeof value === "string" && /^\+?[0-9 ()-]{8,20}$/.test(value.trim());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const emailEnabled = body.email_enabled === true;
    const whatsappEnabled = body.whatsapp_enabled === true;
    const browserEnabled = body.browser_enabled === true;
    const email = emailEnabled && validEmail(body.email) ? body.email.trim().toLowerCase() : null;
    const phone = whatsappEnabled && validPhone(body.phone) ? body.phone.trim().replace(/[ ()-]/g, "") : null;
    if (body.consent !== true || (!emailEnabled && !whatsappEnabled && !browserEnabled)) {
      return NextResponse.json({ error: "कृपया अलर्ट विकल्प चुनें और सहमति दें।" }, { status: 400 });
    }
    if (emailEnabled && !email) return NextResponse.json({ error: "सही ईमेल पता भरें।" }, { status: 400 });
    if (whatsappEnabled && !phone) return NextResponse.json({ error: "सही मोबाइल नंबर भरें।" }, { status: 400 });
    if (!email && !phone) return NextResponse.json({ error: "ब्राउज़र नोटिफिकेशन सदस्यता के लिए Push Server सेटअप अभी आवश्यक है।" }, { status: 503 });

    const supabase = await createClient();
    const { error } = await supabase.from("notification_subscriptions").upsert({
      email, phone, email_enabled: emailEnabled, whatsapp_enabled: whatsappEnabled,
      browser_enabled: browserEnabled, consent: true, consent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(), is_active: true
    }, { onConflict: email ? "email" : "phone" });
    if (error) {
      if (error.code === "42P01" || error.code === "PGRST205") {
        return NextResponse.json({ error: "नोटिफिकेशन टेबल तैयार नहीं है। Admin को नई notification migration लागू करनी होगी।" }, { status: 503 });
      }
      return NextResponse.json({ error: "पसंद सेव नहीं हो सकी। डेटाबेस नीति और सेटअप जाँचें।" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "अनुरोध समझ नहीं आया। कृपया दोबारा प्रयास करें।" }, { status: 400 });
  }
}
