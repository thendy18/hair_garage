import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims as { email?: string } | undefined;
  const adminEmail = process.env.THENDY_ADMIN_EMAIL?.trim().toLowerCase();
  const hasClaims = Boolean(claims);
  const isAdmin = Boolean(
    adminEmail && claims?.email?.toLowerCase() === adminEmail,
  );
  const isLoginPage = request.nextUrl.pathname === "/admin/login";
  const isProtectedPage = request.nextUrl.pathname === "/admin";

  if (isProtectedPage && !isAdmin) {
    if (hasClaims) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.searchParams.set("next", "/admin");
    return NextResponse.redirect(loginUrl);
  }

  if (isAdmin && isLoginPage) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return supabaseResponse;
}
