import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getSettings } from "@/lib/data";
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    metadataBase: new URL(base),
    title: s.seo_title || s.brand_name,
    description: s.seo_description,
    applicationName: s.brand_name,
    manifest: "/manifest.webmanifest",
    icons: s.favicon_url ? {icon:s.favicon_url, apple:s.favicon_url} : {icon:"/icon.svg"},
    openGraph: {title:s.seo_title || s.brand_name, description:s.seo_description, type:"website", siteName:s.brand_name},
    robots: {index:true,follow:true}
  };
}
export const viewport: Viewport = {width:"device-width",initialScale:1,themeColor:"#155eef"};
export default async function RootLayout({children}:{children:React.ReactNode}) {
  const s = await getSettings();
  return <html lang="hi" data-theme={s.theme_mode} style={{"--primary":s.primary_color,"--accent":s.accent_color,"--page-bg":s.background_color} as React.CSSProperties}><body>{children}</body></html>;
}