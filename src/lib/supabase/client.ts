import { createBrowserClient } from "@supabase/ssr";
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase सेटअप नहीं है। .env.local में URL और anon key डालें।");
  return createBrowserClient(url, key);
}