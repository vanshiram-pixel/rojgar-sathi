import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TEXT = 4000;

function clean(value: unknown, max = 1000): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "कृपया एडमिन लॉगिन करें।" }, { status: 401 });

    const { data: admin, error: adminError } = await supabase
      .from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
    if (adminError || !admin) return NextResponse.json({ error: "यह सुविधा केवल अधिकृत एडमिन के लिए है।" }, { status: 403 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI सुविधा कॉन्फ़िगर नहीं है। Vercel में server-side OPENAI_API_KEY जोड़ें।" }, { status: 503 });
    }

    const body = await request.json();
    const title = clean(body.title, 180);
    const contentType = clean(body.contentType, 60);
    const source = clean(body.source, MAX_TEXT);
    const officialUrl = clean(body.officialUrl, 500);
    const notificationUrl = clean(body.notificationUrl, 500);
    const categories = Array.isArray(body.categories)
      ? body.categories.slice(0, 100).map((item: any) => ({
          slug: clean(item?.slug, 100),
          name: clean(item?.name, 120),
          type: clean(item?.type, 50),
        })).filter((item: any) => item.slug && item.name)
      : [];

    if (!title && !source) {
      return NextResponse.json({ error: "पहले शीर्षक या आधिकारिक सूचना से प्राप्त तथ्य भरें।" }, { status: 400 });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        temperature: 0.2,
        max_completion_tokens: 1400,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "rojgar_sathi_content_draft",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                summary: { type: "string" },
                body: { type: "string" },
                eligibility: { type: "string" },
                benefits: { type: "string" },
                required_documents: { type: "string" },
                category_slugs: { type: "array", items: { type: "string" } },
              },
              required: ["summary", "body", "eligibility", "benefits", "required_documents", "category_slugs"],
            },
          },
        },
        messages: [
          {
            role: "system",
            content: "आप Rojgar Sathi के संपादकीय सहायक हैं। केवल दिए गए तथ्यों को सरल, स्पष्ट हिंदी में व्यवस्थित करें। कोई पद-संख्या, तारीख, पात्रता, राशि, दस्तावेज़, शुल्क, लिंक या सरकारी दावा न गढ़ें। जिस जानकारी का स्रोत इनपुट में नहीं है, उस फ़ील्ड को खाली रखें। आधिकारिक वेबसाइट/नोटिस को आपने खोला या सत्यापित किया है ऐसा दावा न करें। आउटपुट केवल मांगे गए JSON schema में हो। श्रेणी सुझाव केवल उपलब्ध सूची में से चुनें; अनिश्चित हों तो खाली array दें। यह ड्राफ्ट है और मानव एडमिन द्वारा सत्यापन आवश्यक है।",
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "इस सामग्री का संपादकीय ड्राफ्ट और उपलब्ध श्रेणियों में से सुझाव बनाएँ। प्रकाशित न करें।",
              contentType,
              title,
              source,
              officialUrl,
              notificationUrl,
              availableCategories: categories,
            }),
          },
        ],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(25000),
    });

    if (!response.ok) {
      // Keep provider diagnostics in server logs only; do not echo upstream details to clients.
      const failure = await response.json().catch(() => null);
      console.error("AI draft provider request failed", {
        status: response.status,
        code: clean(failure?.error?.code, 100),
        type: clean(failure?.error?.type, 100),
      });
      return NextResponse.json({
        error: "AI सेवा अभी अनुरोध पूरा नहीं कर सकी। API key, model और provider limits जाँचें।",
      }, { status: 502 });
    }

    const result = await response.json();
    const content = result?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      return NextResponse.json({ error: "AI से मान्य ड्राफ्ट नहीं मिला। कृपया फिर प्रयास करें।" }, { status: 502 });
    }

    let draft: any;
    try {
      draft = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: "AI उत्तर पढ़ा नहीं जा सका। कृपया फिर प्रयास करें।" }, { status: 502 });
    }

    const allowedSlugs = new Set(categories.map((item: any) => item.slug));
    const categorySlugs = Array.isArray(draft.category_slugs)
      ? [...new Set(draft.category_slugs.filter((slug: unknown) => typeof slug === "string" && allowedSlugs.has(slug)))]
      : [];

    return NextResponse.json({
      draft: {
        summary: clean(draft.summary, 1200),
        body: clean(draft.body, 8000),
        eligibility: clean(draft.eligibility, 2000),
        benefits: clean(draft.benefits, 2000),
        required_documents: clean(draft.required_documents, 2000),
        category_slugs: categorySlugs,
      },
      reviewRequired: true,
    }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: any) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      return NextResponse.json({ error: "AI अनुरोध में समय लग गया। कृपया फिर प्रयास करें।" }, { status: 504 });
    }
    return NextResponse.json({ error: "AI ड्राफ्ट तैयार नहीं हो सका। कृपया इनपुट जाँचकर फिर प्रयास करें।" }, { status: 500 });
  }
}
