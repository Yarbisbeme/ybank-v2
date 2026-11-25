/**
 * Columns of `profiles` that may reach the browser. Never use `select('*')` on
 * profiles: anything selected is serialized to the client and persisted in
 * IndexedDB by the TanStack Query persister.
 */
export const PROFILE_COLUMNS =
  'id, full_name, avatar_url, phone, bio, currency_preference, theme_preference, monthly_savings_goal, onboarding_completed, primary_account_id, updated_at'
