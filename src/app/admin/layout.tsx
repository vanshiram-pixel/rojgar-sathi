"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Login must be a clean, standalone screen; never render the protected admin shell around it.
  if (pathname === "/admin/login") return <>{children}</>;
  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <Link className="brand" href="/admin" aria-label="Rojgar Sathi admin home"><img className="brand-logo" src="/rojgar-sathi-logo.svg" alt="Rojgar Sathi" /></Link>
        <nav className="admin-nav">
          <Link href="/admin" aria-current={pathname === "/admin" ? "page" : undefined}>डैशबोर्ड</Link>
          <Link href="/admin/jobs" aria-current={pathname.startsWith("/admin/jobs") ? "page" : undefined}>भर्ती प्रबंधन</Link>
          <Link href="/admin/content" aria-current={pathname.startsWith("/admin/content") ? "page" : undefined}>छात्रवृत्ति / योजनाएँ / अपडेट</Link>
          <Link href="/admin/expiry" aria-current={pathname.startsWith("/admin/expiry") ? "page" : undefined}>समाप्त पोस्ट / अलर्ट / समीक्षा</Link>
          <Link href="/admin/categories" aria-current={pathname.startsWith("/admin/categories") ? "page" : undefined}>श्रेणी और राज्य</Link>
          <Link href="/admin/appearance" aria-current={pathname.startsWith("/admin/appearance") ? "page" : undefined}>डिज़ाइन और लेआउट</Link>
          <Link href="/admin/seo-ads" aria-current={pathname.startsWith("/admin/seo-ads") ? "page" : undefined}>SEO और विज्ञापन</Link>
          <Link href="/" target="_blank">सार्वजनिक वेबसाइट ↗</Link>
        </nav>
      </aside>
      <section className="admin-main">{children}</section>
    </div>
  );
}
