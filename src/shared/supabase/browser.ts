import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { publicEnv } from '@/shared/config/env'

let client: SupabaseClient | undefined

/** Single browser client per tab: avoids duplicate auth listeners and token refresh races. */
export function getSupabaseBrowserClient(): SupabaseClient {
  client ??= createBrowserClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  return client
}
