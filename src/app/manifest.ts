import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/data";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSettings();
  const brand = settings.brand_name || "Updated Rojgar";
  return {
    name: brand,
    short_name: brand.slice(0, 12),
    description: settings.tagline || "सरकारी नौकरी, प्रवेश-पत्र, परिणाम और छात्रवृत्ति अपडेट",
    start_url: "/",
    display: "standalone",
    background_color: settings.background_color || "#f5f7fb",
    theme_color: settings.primary_color || "#155eef",
    icons: [
      {
        src: settings.favicon_url || "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
  };
}
