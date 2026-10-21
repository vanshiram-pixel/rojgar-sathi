"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function friendlyAdminError(error: unknown) {
  const e = error as { message?: string; code?: string; status?: number };
  const message = (e?.message || "").toLowerCase();
  if (e?.code === "invalid_credentials" || message.includes("invalid login credentials")) {
    return "एडमिन ईमेल या पासवर्ड गलत है। यदि यह अकाउंट रजिस्टर नहीं है, तो पहले यूज़र अकाउंट बनाएँ और उसे admin_users में एडमिन अनुमति दें।";
  }
  if (message.includes("fetch") || message.includes("network") || message.includes("failed to")) {
    return "सर्वर से कनेक्शन नहीं हो पा रहा। इंटरनेट जाँचकर फिर कोशिश करें।";
  }
  if (message.includes("email not confirmed")) {
    return "इस ईमेल का सत्यापन बाकी है। पहले ईमेल सत्यापित करें।";
  }
  if (e?.status === 429 || message.includes("too many requests")) {
    return "कई बार प्रयास हो चुके हैं। कुछ मिनट बाद दोबारा कोशिश करें।";
  }
  return e?.message ? `लॉगिन नहीं हो पाया: ${e.message}` : "लॉगिन पूरा नहीं हो पाया। कृपया दोबारा कोशिश करें।";
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [adminAccessRequired, setAdminAccessRequired] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setAdminAccessRequired(new URLSearchParams(window.location.search).get("error") === "admin-access-required");
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const supabase = createClient();
      const { data, error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (loginError) throw loginError;
      if (!data.user) throw new Error("लॉगिन के बाद यूज़र जानकारी नहीं मिली।");

      const { data: admin, error: adminError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (adminError) throw new Error(`एडमिन अनुमति जाँची नहीं जा सकी: ${adminError.message}`);
      if (!admin) {
        await supabase.auth.signOut();
        throw new Error("यह अकाउंट लॉगिन कर सकता है, लेकिन इसे एडमिन अनुमति नहीं मिली है।");
      }

      setNotice("एडमिन लॉगिन सफल। डैशबोर्ड खोला जा रहा है…");
      const next = new URLSearchParams(window.location.search).get("next");
      const safeNext = next && next.startsWith("/admin/") && !next.startsWith("//") && next !== "/admin/login" ? next : "/admin";
      router.replace(safeNext);
      router.refresh();
    } catch (err) {
      setError(friendlyAdminError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-login">
      <form className="login-card" onSubmit={submit}>
        <Link className="brand" href="/"><span className="brand-mark">UR</span>Updated Rojgar</Link>
        <h1>Admin Login</h1>
        <p className="sub">वेबसाइट और ऐप की सेटिंग प्रबंधित करें।</p>
        {adminAccessRequired && <div className="notice error" role="alert">इस खाते को एडमिन अनुमति नहीं है।</div>}
        {error && <div className="notice error" role="alert" aria-live="polite">{error}</div>}
        {notice && <div className="notice" role="status" aria-live="polite">{notice}</div>}
        <label className="field">ईमेल
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username" />
        </label>
        <label className="field">पासवर्ड
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
        </label>
        <button className="btn" disabled={busy}>{busy ? "लॉगिन हो रहा है…" : "सुरक्षित लॉगिन"}</button>
        <p className="sub">केवल अनुमति प्राप्त एडमिन ही प्रवेश कर सकते हैं।</p>
        <p className="sub"><Link href="/" className="text-link">← वेबसाइट पर वापस जाएँ</Link></p>
      </form>
    </main>
  );
}
