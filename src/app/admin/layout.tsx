import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <Link className="brand" href="/admin"><span className="brand-mark">UR</span>Rojgar Sathi</Link>
        <nav className="admin-nav">
          <Link href="/admin">डैशबोर्ड</Link>
          <Link href="/admin/jobs">भर्ती प्रबंधन</Link>
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
