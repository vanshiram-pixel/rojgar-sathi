"use client";

import { useEffect, useState } from "react";

type SplashProps = { logoUrl?: string; splashImageUrl?: string; title?: string; subtitle?: string };

export function SplashScreen({ logoUrl = "", splashImageUrl = "", title = "Rojgar Sathi", subtitle = "सरकारी नौकरी की सही जानकारी, सबसे पहले" }: SplashProps) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem("rojgar-sathi-splash-seen") === "1") {
        setVisible(false);
        return;
      }
      const timer = window.setTimeout(() => {
        setVisible(false);
        try { window.sessionStorage.setItem("rojgar-sathi-splash-seen", "1"); } catch {}
      }, 1600);
      return () => window.clearTimeout(timer);
    } catch {
      const timer = window.setTimeout(() => setVisible(false), 1600);
      return () => window.clearTimeout(timer);
    }
  }, []);
  if (!visible) return null;
  return <div className="splash-screen" role="status" aria-label={`${title} loading`} style={splashImageUrl ? { backgroundImage: `linear-gradient(135deg, rgba(9, 20, 48, .88), rgba(21, 94, 239, .72)), url("${splashImageUrl}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
    <div className="splash-glow splash-glow-one" /><div className="splash-glow splash-glow-two" />
    <div className="splash-content"><img className="splash-logo" src={logoUrl || "/rojgar-sathi-logo.svg"} alt={title} />
      <h1>{title}</h1><p>{subtitle}</p>
      <div className="splash-loader"><span /></div><small>आपके करियर की अगली शुरुआत…</small>
    </div>
    <div className="splash-bottom"><span>{title}</span><span>Made for India 🇮🇳</span></div>
  </div>;
}
