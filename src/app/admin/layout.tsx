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
        <Link className="brand" href="/admin"><span className="brand-mark">UR</span>Rojgar Sathi</Link>
        <nav className="admin-nav">
          <Link href="/admin">डैशबोर्ड</Link>
          <Link href="/admin/jobs">भर्ती प्रबंधन</Link>
          <Link href="/admin/content">छात्रवृत्ति / योजनाएँ / अपडेट</Link>
          <Link href="/admin/expiry">समाप्त पोस्ट / अलर्ट / समीक्षा</Link>
          <Link href="/admin/categories">श्रेणी और राज्य</Link>
          <Link href="/admin/appearance">डिज़ाइन और लेआउट</Link>
          <Link href="/admin/seo-ads">SEO और विज्ञापन</Link>
          <Link href="/" target="_blank">सार्वजनिक वेबसाइट ↗</Link>
        </nav>
      </aside>
      <section className="admin-main">{children}</section>
    </div>
  );
}
