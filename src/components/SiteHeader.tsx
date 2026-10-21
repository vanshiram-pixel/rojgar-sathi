"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";

type Props = { brandName: string; tagline: string; topbarText: string };

export function SiteHeader({ tagline, topbarText }: Props) {
  const pathname = usePathname() || "/";
  const canonicalBrand = "Rojgar Sathi";
  // Keep the separate, private Admin navigation intact.
  if (pathname.startsWith("/admin")) return null;

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
            <Link href="/login">लॉगिन / अकाउंट</Link>
          </nav>
          <div className="mobile-auth">
            <Link href="/login">लॉगिन / अकाउंट</Link>
            <Link className="mobile-menu text-link" href="/categories">श्रेणियाँ →</Link>
          </div>
        </div>
      </header>
    </div>
  );
}
