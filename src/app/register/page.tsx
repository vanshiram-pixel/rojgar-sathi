"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function friendlyRegisterError(error: unknown) {
  const e = error as { message?: string; code?: string; status?: number };
  const message = (e?.message || "").toLowerCase();
  if (message.includes("already registered") || message.includes("user already registered") || message.includes("already been registered")) return "इस ईमेल से अकाउंट पहले से बना हुआ है। नया अकाउंट बनाने के बजाय लॉगिन करें।";
  if (message.includes("password") && (message.includes("weak") || message.includes("short") || message.includes("least"))) return "पासवर्ड पर्याप्त मजबूत नहीं है। कम से कम 8 अक्षरों का नया पासवर्ड डालें।";
  if (message.includes("email") && (message.includes("invalid") || message.includes("valid"))) return "कृपया सही ईमेल पता डालें।";
  if (e.status === 429 || message.includes("too many requests")) return "बहुत अधिक प्रयास हो चुके हैं। कुछ मिनट बाद दोबारा कोशिश करें।";
  if (message.includes("fetch") || message.includes("network") || message.includes("failed to")) return "सर्वर से कनेक्शन नहीं हो पा रहा। इंटरनेट जाँचकर फिर कोशिश करें।";
  return e.message ? `रजिस्ट्रेशन नहीं हो पाया: ${e.message}` : "रजिस्ट्रेशन पूरा नहीं हो पाया। कृपया दोबारा कोशिश करें।";
}

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [resending, setResending] = useState(false);
  const router = useRouter();

  async function googleRegister() {
    if (busy) return;
    setBusy(true); setError(""); setMsg("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/auth/callback?next=/profile", queryParams: { access_type: "offline" } } });
      if (error) throw error;
    } catch (err) { setError(friendlyRegisterError(err)); setBusy(false); }
  }

  async function resendVerification() {
    if (!pendingEmail || resending) return;
    setResending(true); setError(""); setMsg("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({ type: "signup", email: pendingEmail, options: { emailRedirectTo: window.location.origin + "/auth/callback?next=/" } });
      if (error) throw error;
      setMsg("यदि इस ईमेल के लिए सत्यापन दोबारा भेजना उपलब्ध है, तो अनुरोध स्वीकार हुआ। इनबॉक्स और Spam/Junk फ़ोल्डर जाँचें।");
    } catch (err) { setError(friendlyRegisterError(err)); }
    finally { setResending(false); }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo: window.location.origin + "/auth/callback?next=/",
        },
      });
      if (signUpError) throw signUpError;

      if (data.session && data.user) {
        const { error: profileError } = await supabase.from("user_profiles").upsert(
          { user_id: data.user.id, email: data.user.email || email.trim(), full_name: name.trim() },
          { onConflict: "user_id" },
        );
        if (profileError) {
          setMsg("आपका अकाउंट बन गया है, लेकिन प्रोफाइल सेव नहीं हो सकी। कृपया लॉगिन करके दोबारा कोशिश करें।");
          return;
        }
        setMsg("रजिस्ट्रेशन सफल! आपकी प्रोफाइल खोली जा रही है…");
        router.replace("/profile");
        router.refresh();
        return;
      }

      setPendingEmail(email.trim());
      setMsg("रजिस्ट्रेशन अनुरोध स्वीकार हुआ। अपना ईमेल इनबॉक्स और Spam/Junk फ़ोल्डर खोलें। Rojgar Sathi की सत्यापन लिंक पर क्लिक करना ज़रूरी है। सत्यापन पूरा होने पर वेबसाइट का होम पेज खुलेगा; फिर लॉगिन करके प्रोफाइल/डैशबोर्ड देख सकते हैं।")
    } catch (err) {
      setError(friendlyRegisterError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-login">
      <form className="login-card" onSubmit={submit}>
        <Link className="brand" href="/" aria-label="Rojgar Sathi home"><img className="brand-logo" src="/rojgar-sathi-logo.svg" alt="Rojgar Sathi" /></Link>
        <h1>यूज़र अकाउंट बनाएँ</h1>
        <p className="sub">अपनी पसंद की भर्ती और अपडेट पाने के लिए पंजीकरण करें।</p>
        {error && <div className="notice error" role="alert" aria-live="polite">{error}</div>}
        {msg && <div className="notice" role="status" aria-live="polite">{msg}</div>}
        {pendingEmail && msg && <button type="button" className="btn" onClick={resendVerification} disabled={resending}>{resending ? "लिंक भेजी जा रही है…" : "सत्यापन ईमेल दोबारा भेजें"}</button>}
        <button type="button" className="btn" onClick={googleRegister} disabled={busy}>{busy ? "कृपया प्रतीक्षा करें…" : "Google से जारी रखें"}</button>
        <div className="sub" style={{textAlign:"center",margin:"12px 0"}}>या ईमेल और पासवर्ड से अकाउंट बनाएँ</div>
        <label className="field">पूरा नाम
          <input value={name} onChange={e => setName(e.target.value)} required autoComplete="name" />
        </label>
        <label className="field">ईमेल
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label className="field">पासवर्ड (कम से कम 8 अक्षर)
          <input type="password" minLength={8} value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
        </label>
        <button className="btn" disabled={busy}>{busy ? "खाता बन रहा है…" : "खाता बनाएँ"}</button>
        <p className="sub">पहले से अकाउंट है? <Link href="/login" className="text-link">लॉगिन करें</Link></p>
        <p className="sub"><Link href="/" className="text-link">← वेबसाइट पर वापस जाएँ</Link></p>
      </form>
    </main>
  );
}