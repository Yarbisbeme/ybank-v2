/**
 * The origin the user is actually browsing (production domain, a Vercel preview,
 * or localhost), used to build auth redirect URLs.
 *
 * Trusting the request host is safe here: Supabase only redirects to URLs in its
 * "Redirect URLs" allow-list, so a forged Host header cannot send users elsewhere.
 */
export function resolveOrigin(
  headers: { get(name: string): string | null },
  fallback: string,
): string {
  const host = (headers.get('x-forwarded-host') ?? headers.get('host'))?.split(',')[0].trim()
  if (!host || !/^[a-z0-9.-]+(:\d+)?$/i.test(host)) return fallback

  const forwardedProto = headers.get('x-forwarded-proto')?.split(',')[0].trim()
  const isLocal = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host)
  const proto = forwardedProto === 'http' || forwardedProto === 'https' ? forwardedProto : isLocal ? 'http' : 'https'
  return `${proto}://${host}`
}
