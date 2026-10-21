import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAdminLogin = pathname === "/admin/login";
  const isAdminArea = pathname.startsWith("/admin") && !isAdminLogin;
  const isProfile = pathname === "/profile" || pathname.startsWith("/profile/");
  const isHome = pathname === "/";
  const isAuthPage = pathname === "/login" || pathname === "/register";

  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Never create a redirect loop when environment configuration is missing.
  // Public pages remain available; protected pages fail closed.
  if (!url || !key) {
    if (isAdminArea || isProfile) {
      const target = request.nextUrl.clone();
      target.pathname = isAdminArea ? "/admin/login" : "/login";
      target.search = "setup=required";
      return NextResponse.redirect(target);
    }
    return response;
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

  const redirectWithCookies = (pathnameTo: string, query = "") => {
    const target = request.nextUrl.clone();
    target.pathname = pathnameTo;
    target.search = query;
    const redirect = NextResponse.redirect(target);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    if (isAdminArea || isProfile) {
      const next = encodeURIComponent(pathname + search);
      return redirectWithCookies(isAdminArea ? "/admin/login" : "/login", `next=${next}`);
    }
    return response;
  }

  // An active user session always opens the private dashboard from the public home/auth forms.
  if (isHome || isAuthPage) {
    return redirectWithCookies("/profile");
  }

  if (isAdminArea || isAdminLogin) {
    const { data: admin, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (isAdminLogin && !adminError && admin) {
      return redirectWithCookies("/admin");
    }

    if (isAdminArea && (adminError || !admin)) {
      return redirectWithCookies("/admin/login", "error=admin-access-required");
    }
  }

  return response;
}

export const config = {
  // Refresh Supabase cookies consistently across app routes while skipping Next assets and common static files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|txt|xml|woff|woff2)$).*)",
  ],
};
