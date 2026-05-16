// src/proxy.ts
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Buscamos cualquier rastro de la sesión (normal o fragmentada .0, .1)
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some(c => c.name.includes("-auth-token"));

  // 2. Definimos las áreas de la app
  const isProtectedRoute = path.startsWith("/dashboard") || path.startsWith("/accounts") || path.startsWith("/settings");
  const isAuthRoute = path.startsWith("/sign-in") || path.startsWith("/sign-up");

  // 🚀 ESTRATEGIA OFFLINE-FIRST SILENCIOSA
  // Si hay cookie y vas a zona protegida, pasas directo. 
  // Evitamos llamar a Supabase aquí para no generar errores de fetch sin internet.
  if (hasAuthCookie) {
    if (isAuthRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // 3. Si NO hay cookie y la ruta es protegida, al login.
  if (!hasAuthCookie && isProtectedRoute) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};