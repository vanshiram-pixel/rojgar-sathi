import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import "./premium.css";
import { getSettings } from "@/lib/data";
import { SplashScreen } from "@/components/SplashScreen";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://updated-rojgar.vercel.app";
  return {
    metadataBase: new URL(base),
    title: s.seo_title || s.brand_name,
    description: s.seo_description,
    applicationName: s.brand_name || "Updated Rojgar",
    manifest: "/manifest.webmanifest",
    icons: { icon: s.favicon_url || "/icon.svg", apple: s.favicon_url || "/icon.svg" },
    openGraph: { title: s.seo_title || s.brand_name, description: s.seo_description, type: "website", siteName: s.brand_name || "Updated Rojgar" },
    robots: { index: true, follow: true }
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#155eef" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  const adsenseEnabled = s.ads_enabled && /^ca-pub-\d+$/.test(s.adsense_client || "");
  return <html lang="hi" data-theme={s.theme_mode} data-layout={s.layout_preset} style={{ "--primary": s.primary_color, "--accent": s.accent_color, "--page-bg": s.background_color } as React.CSSProperties}>
    <head>
      {s.custom_css ? <style dangerouslySetInnerHTML={{ __html: s.custom_css.replace(/<\/style/gi, "") }} /> : null}
      {adsenseEnabled ? <Script id="adsense-loader" async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${s.adsense_client}`} crossOrigin="anonymous" strategy="beforeInteractive" /> : null}
    </head>
    <body style={{ fontFamily: s.font_family === "hind" ? "Hind, sans-serif" : s.font_family === "inter" ? "Inter, sans-serif" : "Inter, Hind, system-ui, sans-serif" }}><SplashScreen logoUrl={s.logo_url} splashImageUrl={s.splash_image_url} title={s.splash_title || s.brand_name} subtitle={s.splash_subtitle || s.tagline} />{children}</body>
  </html>;
}
