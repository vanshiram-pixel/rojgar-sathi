import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const code = request.nextUrl.searchParams.get("code");
  const nextParam = request.nextUrl.searchParams.get("next") || "/profile";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") && !nextParam.startsWith("/admin") ? nextParam : "/profile";

  const fail = request.nextUrl.clone();
  fail.pathname = "/login";
  fail.search = "error=verification";

  if (!url || !key || !code) {
    return NextResponse.redirect(fail);
  }

  const response = NextResponse.redirect(new URL(next, request.url));
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const target = request.nextUrl.clone();
    target.pathname = "/login";
    target.search = "error=verification";
    const redirect = NextResponse.redirect(target);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  const target = new URL(next, request.url);
  if (target.pathname === "/") target.searchParams.set("email_verified", "1");
  const success = NextResponse.redirect(target);
  response.cookies.getAll().forEach((cookie) => success.cookies.set(cookie));
  return success;
}
