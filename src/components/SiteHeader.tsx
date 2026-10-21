"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = { brandName: string; tagline: string; topbarText: string };
type SignedInUser = { id: string; email?: string; name: string };

export function SiteHeader({ tagline, topbarText }: Props) {
  const pathname = usePathname() || "/";
  const [signedInUser, setSignedInUser] = useState<SignedInUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const canonicalBrand = "Rojgar Sathi";

  useEffect(() => {
    const supabase = createClient();
    let alive = true;

    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!alive) return;
      if (!user) {
        setSignedInUser(null);
        setAuthReady(true);
        return;
      }
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!alive) return;
      const metadataName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
      const emailName = user.email?.split("@")[0] || "यूज़र";
      setSignedInUser({
        id: user.id,
        email: user.email || "",
        name: profile?.full_name?.trim() || metadataName.trim() || emailName,
      });
      setAuthReady(true);
    };

    void loadUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      // Defer Supabase queries until after the auth callback completes.
      setTimeout(() => { if (alive) void loadUser(); }, 0);
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  // Keep the separate, private Admin navigation intact.
  if (pathname.startsWith("/admin")) return null;

  const accountControl = signedInUser ? (
    <Link className="account-link signed-in-account" href="/profile" aria-label={signedInUser.name + " की प्रोफाइल"}>
      <span className="account-avatar" aria-hidden="true"><UserRound size={18} /></span>
      <span className="account-name">{signedInUser.name}</span>
    </Link>
  ) : (
    <Link className="account-link" href="/login">
      <span className="account-avatar" aria-hidden="true"><UserRound size={18} /></span>
      <span className="account-name">{authReady ? "लॉगिन / अकाउंट" : "अकाउंट"}</span>
    </Link>
  );

  return (
    <div id="site-header-shell">
      <div className="topbar unified-topbar">
        <div className="wrap topbar-inner">
          <span>{topbarText || "रोज़गार, परीक्षा और छात्रवृत्ति की जानकारी"}</span>
          <span><ShieldCheck size={13} /> आवेदन से पहले आधिकारिक सूचना जाँचें</span>
        </div>
      </div>
      <header id="site-header" className="header unified-header">
        <div className="wrap header-inner unified-header-inner">
          <Link className="brand" href="/" aria-label={canonicalBrand + " होम"}>
            <img className="brand-logo" src="/rojgar-sathi-logo.svg" alt={canonicalBrand + " लोगो"} />
            <span className="brand-tagline">{tagline || "सरकारी नौकरी और करियर की सही जानकारी"}</span>
          </Link>
          <nav className="nav unified-nav" aria-label="मुख्य नेविगेशन">
            <Link href="/jobs">Latest Jobs</Link>
            <Link href="/categories">विभाग व श्रेणियाँ</Link>
            <Link href="/category/admit-card">Admit Card</Link>
            <Link href="/category/result">Results</Link>
            <Link href="/category/scholarship">Scholarships</Link>
            <Link href="/category/government-schemes">Schemes</Link>
            {accountControl}
          </nav>
          <div className="mobile-auth">
            {accountControl}
            <Link className="mobile-menu text-link" href="/categories">श्रेणियाँ →</Link>
          </div>
        </div>
      </header>
    </div>
  );
}
