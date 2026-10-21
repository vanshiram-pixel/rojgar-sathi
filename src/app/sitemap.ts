import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://updated-rojgar.vercel.app").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const urls: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/jobs`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${siteUrl}/categories`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/search`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
  ];

  try {
    const supabase = await createClient();
    const [{ data: jobs }, { data: content }, { data: categories }] = await Promise.all([
      supabase.from("jobs").select("id,updated_at").eq("status", "published"),
      supabase.from("content_items").select("slug,updated_at").eq("status", "published"),
      supabase.from("portal_categories").select("slug,category_type,updated_at").eq("is_active", true),
    ]);

    for (const job of jobs || []) {
      urls.push({
        url: `${siteUrl}/jobs/${job.id}`,
        lastModified: job.updated_at ? new Date(job.updated_at) : now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    for (const item of content || []) {
      if (!item.slug) continue;
      urls.push({
        url: `${siteUrl}/updates/${item.slug}`,
        lastModified: item.updated_at ? new Date(item.updated_at) : now,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
    for (const category of categories || []) {
      if (!category.slug) continue;
      const path = category.category_type === "state" ? "/state/" : "/category/";
      urls.push({
        url: `${siteUrl}${path}${category.slug}`,
        lastModified: category.updated_at ? new Date(category.updated_at) : now,
        changeFrequency: "daily",
        priority: category.category_type === "state" ? 0.6 : 0.65,
      });
    }
  } catch {
    // Keep the core public URLs available if the database is temporarily unavailable.
  }

  return [...new Map(urls.map((entry) => [entry.url, entry])).values()];
}
