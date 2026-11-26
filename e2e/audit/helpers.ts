import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import type { Page } from '@playwright/test'

export const OUT = 'e2e/.audit'
mkdirSync(OUT, { recursive: true })

/** Collects console errors and uncaught page errors as audit evidence. */
export function watch(page: Page) {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`) })
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  return errors
}

export async function snap(page: Page, name: string, errors: string[]) {
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
  const text = (await page.locator('body').innerText()).replace(/\n{2,}/g, '\n').slice(0, 4000)
  writeFileSync(`${OUT}/${name}.txt`, `URL: ${page.url()}\nERRORS:\n${errors.join('\n') || '(none)'}\n\nTEXT:\n${text}`)
}

/** Read-only SQL against the LOCAL Supabase database container. */
export function sql(query: string): string {
  return execFileSync('docker', ['exec', 'supabase_db_ybank-v2', 'psql', '-U', 'postgres', '-tA', '-c', query], { encoding: 'utf8' }).trim()
}

export function auditUser(): { email: string; password: string } {
  return JSON.parse(readFileSync(`${OUT}/user.json`, 'utf8'))
}

export async function signIn(page: Page) {
  const { email, password } = auditUser()
  await page.goto('/sign-in')
  const start = page.getByRole('button', { name: /comenzar|continuar con email|iniciar con email/i })
  if (await start.first().isVisible().catch(() => false)) await start.first().click()
  await page.getByLabel(/correo electrónico/i).fill(email)
  await page.locator('#signin-password').fill(password)
  await page.locator('form button[type="submit"]').first().click()
  await page.waitForURL(/dashboard/, { timeout: 20_000 })
}

export function balanceOf(accountName: string): number {
  const { email } = auditUser()
  return Number(sql(`select a.current_balance from accounts a join auth.users u on u.id = a.user_id where u.email = '${email}' and a.name = '${accountName}'`))
}
