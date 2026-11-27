import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { expect, type Page } from '@playwright/test'

export const OUT = 'e2e/.audit'
mkdirSync(OUT, { recursive: true })

/** Every user the suite creates matches this, so global-setup can delete them. */
export const AUDIT_EMAIL_LIKE = 'audit+%@ybank.test'
export const newAuditEmail = () => `audit+${Date.now()}@ybank.test`

const EVIDENCE = !!process.env.E2E_EVIDENCE

/** Collects console errors and uncaught page errors as audit evidence. */
export function watch(page: Page) {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`) })
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  return errors
}

/** Screenshot + visible text for the audit trail. Only with E2E_EVIDENCE=1: it is the slowest part of a run. */
export async function snap(page: Page, name: string, errors: string[]) {
  if (!EVIDENCE) return
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
  const text = (await page.locator('body').innerText()).replace(/\n{2,}/g, '\n').slice(0, 4000)
  writeFileSync(`${OUT}/${name}.txt`, `URL: ${page.url()}\nERRORS:\n${errors.join('\n') || '(none)'}\n\nTEXT:\n${text}`)
}

/** SQL against the LOCAL Supabase database container (test fixtures and assertions only). */
export function sql(query: string): string {
  // stderr is captured (not printed) so server warnings don't flood the report; it is still in the thrown error.
  return execFileSync('docker', ['exec', 'supabase_db_ybank-v2', 'psql', '-U', 'postgres', '-tA', '-v', 'ON_ERROR_STOP=1', '-c', query], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

export function saveAuditUser(user: { email: string; password: string }) {
  writeFileSync(`${OUT}/user.json`, JSON.stringify(user))
}

export function auditUser(): { email: string; password: string } {
  const file = `${OUT}/user.json`
  if (!existsSync(file)) throw new Error('No audit user for this run: specs 02+ need 01-auth-onboarding to run first (run the whole suite).')
  return JSON.parse(readFileSync(file, 'utf8'))
}

export async function signIn(page: Page) {
  const { email, password } = auditUser()
  await page.goto('/sign-in')
  const start = page.getByRole('button', { name: /comenzar|continuar con email|iniciar con email/i })
  if (await start.first().isVisible().catch(() => false)) await start.first().click()
  await page.getByPlaceholder('Correo electrónico').fill(email)
  await page.getByPlaceholder('Contraseña').fill(password)
  await page.locator('form button[type="submit"]').first().click()
  await page.waitForURL(/dashboard/, { timeout: 20_000 })
}

export function balanceOf(accountName: string): number {
  const { email } = auditUser()
  return Number(sql(`select a.current_balance from accounts a join auth.users u on u.id = a.user_id where u.email = '${email}' and a.name = '${accountName}'`))
}

/** Waits until the DB shows the expected balance, instead of sleeping a fixed time after a save. */
export async function expectBalance(accountName: string, expected: number, message?: string) {
  await expect.poll(() => balanceOf(accountName), { message, timeout: 15_000 }).toBe(expected)
}
