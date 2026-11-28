import { rmSync } from 'node:fs'
import { AUDIT_EMAIL_LIKE, E2E_NAMESPACE, OUT, sql } from './audit/helpers'

/**
 * Runs once before the suite. Replaces `supabase db reset` (minutes) with a targeted
 * cleanup (milliseconds): users from earlier runs are deleted here, at the start, so a
 * failed run leaves its data in the DB for inspection. Everything a user owns cascades
 * from auth.users. Only this agent's users go (see E2E_NAMESPACE in helpers): several
 * agents share the local Supabase and may be running their suites right now.
 */
export default function globalSetup() {
  try {
    sql('select 1')
  } catch {
    throw new Error('Local Supabase is not running (container supabase_db_ybank-v2). Start it with `npx supabase start`.')
  }
  const deleted = sql(`with d as (delete from auth.users where email like '${AUDIT_EMAIL_LIKE}' returning 1) select count(*) from d`)
  rmSync(`${OUT}/user.json`, { force: true })
  console.log(`[e2e] namespace "${E2E_NAMESPACE}": removed ${deleted} test user(s) from earlier runs`)
}
