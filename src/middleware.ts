import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function safeNext(value: string | null, fallback = "/profile") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\\\") || value.includes("\\r") || value.includes("\\n")) return fallback;
  return value;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  // OAuth/email callback must exchange its one-time code before any dashboard redirect.
  if (pathname === "/auth/callback") return NextResponse.next({ request });

  const isAdminLogin = pathname === "/admin/login";
  const isAdminArea = pathname.startsWith("/admin") && !isAdminLogin;
  const isProfile = pathname === "/profile" || pathname.startsWith("/profile/");
  const isHome = pathname === "/";
  const isAuthPage = pathname === "/login" || pathname === "/register";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    // Do not take down public pages if auth configuration is temporarily missing.
    if (isAdminArea || isProfile) {
      const target = request.nextUrl.clone();
      target.pathname = isAdminArea ? "/admin/login" : "/login";
      target.search = "setup=required";
      return NextResponse.redirect(target);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  const redirectWithCookies = (pathnameTo: string, query = "") => {
    const target = request.nextUrl.clone();
    target.pathname = pathnameTo;
    target.search = query;
    const redirect = NextResponse.redirect(target);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  const authenticatedUser = !error && !!user;

  if (!authenticatedUser) {
    if (isAdminArea || isProfile) {
      const next = encodeURIComponent(pathname + search);
      return redirectWithCookies(isAdminArea ? "/admin/login" : "/login", `next=${next}`);
    }
    return response;
  }

  // An active user session always resumes the private dashboard from home/auth pages.
  if (isHome || isAuthPage) return redirectWithCookies("/profile");

  if (isAdminLogin) {
    const { data: admin, error: adminError } = await supabase
      .from("admin_users").select("user_id").eq("user_id", user!.id).maybeSingle();
    if (!adminError && admin) return redirectWithCookies("/admin");
    // Keep non-admin users on the admin sign-in screen, without granting access.
    return response;
  }

  if (isAdminArea) {
    const { data: admin, error: adminError } = await supabase
      .from("admin_users").select("user_id").eq("user_id", user!.id).maybeSingle();
    if (adminError || !admin) return redirectWithCookies("/admin/login", "error=admin-access-required");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|txt|xml|woff|woff2)$).*)",
  ],
};