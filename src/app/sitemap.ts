import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://updated-rojgar.vercel.app").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let jobs: { id: string; updated_at?: string | null }[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("jobs").select("id,updated_at").eq("status", "published");
    jobs = data || [];
  } catch {
    // Keep core public URLs available even before Supabase is configured.
  }
  return [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/jobs`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    ...jobs.map((job) => ({
      url: `${siteUrl}/jobs/${job.id}`,
      lastModified: new Date(job.updated_at || Date.now()),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
