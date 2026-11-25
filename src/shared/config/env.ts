import { z } from 'zod'

/**
 * Environment variables validated at startup.
 *
 * Public vars must be read with literal `process.env.NEXT_PUBLIC_*` accesses so
 * Next.js can inline them into the client bundle; do not iterate over process.env.
 */

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  // Supabase's current client key (`sb_publishable_...`), which replaces the legacy anon JWT.
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),
})

// Vars for features not built yet are optional; make them required when the
// feature that needs them lands, so a missing secret fails at boot, not at runtime.
export const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(32).optional(),
  INGEST_WEBHOOK_SECRET: z.string().min(32).optional(),
  TOKEN_ENCRYPTION_KEY: z.string().min(32).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
})

export type PublicEnv = z.infer<typeof publicEnvSchema>
export type ServerEnv = z.infer<typeof serverEnvSchema>

export function parseEnv<S extends z.ZodType>(schema: S, input: Record<string, string | undefined>): z.infer<S> {
  // Treat empty strings as unset so `KEY=` in .env files behaves like a missing key.
  const cleaned = Object.fromEntries(
    Object.entries(input).map(([k, v]) => [k, v === '' ? undefined : v]),
  )
  const result = schema.safeParse(cleaned)
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid environment variables:\n${details}`)
  }
  return result.data
}

export const publicEnv: PublicEnv = parseEnv(publicEnvSchema, {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  // Legacy name accepted as a fallback while environments migrate; remove once none use it.
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
})

let cachedServerEnv: ServerEnv | undefined

/** Server-only. Lazy so importing this module from client code never touches secrets. */
export function getServerEnv(): ServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv() must not be called in the browser')
  }
  cachedServerEnv ??= parseEnv(serverEnvSchema, {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
    INGEST_WEBHOOK_SECRET: process.env.INGEST_WEBHOOK_SECRET,
    TOKEN_ENCRYPTION_KEY: process.env.TOKEN_ENCRYPTION_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  })
  return cachedServerEnv
}
