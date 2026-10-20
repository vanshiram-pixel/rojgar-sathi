"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
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
  return <div className="splash-screen" role="status" aria-label="Rojgar Sathi loading">
    <div className="splash-glow splash-glow-one" /><div className="splash-glow splash-glow-two" />
    <div className="splash-content"><img className="splash-logo" src="/rojgar-sathi-logo.svg" alt="Rojgar Sathi" />
      <p>सरकारी नौकरी की सही जानकारी, सबसे पहले</p>
      <div className="splash-loader"><span /></div><small>आपके करियर की अगली शुरुआत…</small>
    </div>
    <div className="splash-bottom"><span>रोज़गार साथी</span><span>Made for India 🇮🇳</span></div>
  </div>;
}
