import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAdminArea = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isProfile = pathname === "/profile" || pathname.startsWith("/profile/");
  const isHome = pathname === "/";
  const isAuthPage = pathname === "/login" || pathname === "/register";

  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    const target = request.nextUrl.clone();
    target.pathname = isAdminArea ? "/admin/login" : "/login";
    target.search = "setup=required";
    return NextResponse.redirect(target);
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
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

  if (error || !user) {
    if (isAdminArea || isProfile) {
      const next = encodeURIComponent(pathname + search);
      return redirectWithCookies(isAdminArea ? "/admin/login" : "/login", `next=${next}`);
    }
    return response;
  }

  // Keep signed-in users in their private dashboard instead of showing the public homepage or login/register forms.
  if (isHome || isAuthPage) {
    return redirectWithCookies("/profile");
  }

  if (isAdminArea) {
    const { data: admin, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (adminError || !admin) {
      return redirectWithCookies("/admin/login", "error=admin-access-required");
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/admin/:path*",
    "/profile/:path*",
    "/jobs/:path*",
    "/categories/:path*",
    "/category/:path*",
    "/search/:path*",
  ],
};
