import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  const isNetworkError = error && (
    error.message.includes("fetch failed") || 
    error.message.includes("NetworkError") ||
    error.message.includes("Failed to fetch") ||
    error.status === 0 || // Códigos de estado HTTP 0 suelen representar fallas de red directas
    error.status === 504  // Gateway Timeout
  );

  let hasLocalSession = false;

  if (isNetworkError) {
    const allCookies = request.cookies.getAll();
    const supabaseCookieExists = allCookies.some(cookie => cookie.name.startsWith("sb-"));

    if (supabaseCookieExists) {
      hasLocalSession = true;
      console.log("📡 [YBank Middleware] Detectado error de red, pero existe cookie local. Permitido paso offline.");
    }
  }

  if (!user && !hasLocalSession && request.nextUrl.pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  const isUserAuthenticated = user || hasLocalSession;

  if (isUserAuthenticated && (request.nextUrl.pathname.startsWith("/sign-in") || request.nextUrl.pathname.startsWith("/sign-up"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}