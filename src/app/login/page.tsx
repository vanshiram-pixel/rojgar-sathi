"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function friendlyLoginError(error: unknown) {
  const e = error as { message?: string; code?: string; status?: number };
  const message = (e?.message || "").toLowerCase();
  const code = (e?.code || "").toLowerCase();

  if (code === "invalid_credentials" || message.includes("invalid login credentials") || message.includes("invalid_credentials")) {
    return "यह ईमेल रजिस्टर नहीं है या पासवर्ड गलत है। ईमेल और पासवर्ड जाँचें, या नया अकाउंट बनाएँ।";
  }
  if (message.includes("email not confirmed")) {
    return "आपका ईमेल अभी सत्यापित नहीं हुआ है। ईमेल में आए सत्यापन लिंक पर क्लिक करके फिर लॉगिन करें।";
  }
  if (message.includes("too many requests") || e?.status === 429) {
    return "कई बार प्रयास हो चुके हैं। कुछ मिनट बाद दोबारा कोशिश करें।";
  }
  if (message.includes("fetch") || message.includes("network") || message.includes("failed to")) {
    return "सर्वर से कनेक्शन नहीं हो पा रहा। इंटरनेट जाँचकर फिर कोशिश करें।";
  }
  if (!e?.message) return "लॉगिन पूरा नहीं हो पाया। कृपया दोबारा कोशिश करें।";
  return `लॉगिन नहीं हो पाया: ${e.message}`;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();


  async function googleLogin() {\n    if (busy) return;\n    setBusy(true); setError(""); setNotice("");\n    try {\n      const supabase = createClient();\n      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/auth/callback?next=/profile", scopes: "openid email profile" } });\n      if (error) throw error;\n    } catch (err) { setError(friendlyLoginError(err)); setBusy(false); }\n  }\n\n  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const supabase = createClient();
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (loginError) throw loginError;
      if (!data.user) throw new Error("लॉगिन तो हुआ, लेकिन यूज़र जानकारी नहीं मिली। दोबारा कोशिश करें।");

      setNotice("लॉगिन सफल। आपकी प्रोफाइल खोली जा रही है…");
      const next = new URLSearchParams(window.location.search).get("next");
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/admin") ? next : "/profile";
      router.replace(safeNext);
      router.refresh();
    } catch (err) {
      setError(friendlyLoginError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-login">
      <form className="login-card" onSubmit={submit}>
        <Link className="brand" href="/">Rojgar Sathi</Link>
        <h1>यूज़र लॉगिन</h1>
        <p className="sub">अपनी प्रोफाइल और पसंदीदा अपडेट खोलें।</p>
        {error && <div className="notice error" role="alert" aria-live="polite">{error}</div>}
        {notice && <div className="notice" role="status" aria-live="polite">{notice}</div>}
        <button type="button" className="btn" onClick={googleLogin} disabled={busy}>{busy ? "कृपया प्रतीक्षा करें…" : "Google से जारी रखें"}</button>\n        <div className="sub" style={{ textAlign: "center", margin: "12px 0" }}>या ईमेल से लॉगिन करें</div>\n        <label className="field">ईमेल
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username" />
        </label>
        <label className="field">पासवर्ड
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
        </label>
        <button className="btn" disabled={busy}>{busy ? "लॉगिन हो रहा है…" : "लॉगिन करें"}</button>
        <p className="sub">अकाउंट नहीं है? <Link href="/register" className="text-link">नया अकाउंट बनाएँ</Link></p>
        <p className="sub"><Link href="/" className="text-link">← वेबसाइट पर वापस जाएँ</Link></p>
      </form>
    </main>
  );
}