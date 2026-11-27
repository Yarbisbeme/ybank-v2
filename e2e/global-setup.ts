import { rmSync } from 'node:fs'
import { AUDIT_EMAIL_LIKE, OUT, sql } from './audit/helpers'

/**
 * Runs once before the suite. Replaces `supabase db reset` (minutes) with a targeted
 * cleanup (milliseconds): users from the previous run are deleted here, at the start,
 * so a failed run leaves its data in the DB for inspection. Everything a user owns
 * cascades from auth.users.
 */
export default function globalSetup() {
  try {
    sql('select 1')
  } catch {
    throw new Error('Local Supabase is not running (container supabase_db_ybank-v2). Start it with `npx supabase start`.')
  }
  const deleted = sql(`with d as (delete from auth.users where email like '${AUDIT_EMAIL_LIKE}' returning 1) select count(*) from d`)
  rmSync(`${OUT}/user.json`, { force: true })
  console.log(`[e2e] removed ${deleted} user(s) from the previous run`)
}
