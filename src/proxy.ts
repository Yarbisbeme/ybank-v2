import { NextResponse, type NextRequest } from 'next/server';
import { decideRoute } from '@/shared/auth/route-gate';

export async function proxy(request: NextRequest) {
  const decision = decideRoute({
    path: request.nextUrl.pathname,
    search: request.nextUrl.searchParams,
    cookieNames: request.cookies.getAll().map((c) => c.name),
  });

  const response = decision.action === 'redirect'
    ? NextResponse.redirect(new URL(decision.to, request.url))
    : NextResponse.next();

  for (const name of decision.clearCookies) response.cookies.delete(name);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
