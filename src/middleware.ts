import { type NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware"; // O la ruta correcta donde tengas updateSession

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Intercepta todas las rutas de la app excepto:
     * - _next/static (archivos estáticos de Next.js)
     * - _next/image (optimización de imágenes)
     * - favicon.ico, manifest.json, sw.js (archivos de la PWA)
     * - Cualquier archivo con extensión de imagen, video o fuente (svg, png, jpg, woff2, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff2?)$).*)',
  ],
};