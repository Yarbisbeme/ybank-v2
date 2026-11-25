import { test, expect, type Page } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'

// Exploratory functional audit (Phase 0.5): records what actually happens at each
// step (screenshot + visible text + console/page errors) as evidence.
const OUT = 'e2e/.audit'
mkdirSync(OUT, { recursive: true })

function watch(page: Page) {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`) })
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  return errors
}

async function snap(page: Page, name: string, errors: string[]) {
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
  const text = (await page.locator('body').innerText()).replace(/\n{2,}/g, '\n').slice(0, 3000)
  writeFileSync(`${OUT}/${name}.txt`, `URL: ${page.url()}\nERRORS:\n${errors.join('\n') || '(none)'}\n\nTEXT:\n${text}`)
}

test('sign up with email → onboarding → dashboard', async ({ page }) => {
  const errors = watch(page)
  const email = `audit+${Date.now()}@ybank.test`

  await page.goto('/')
  await snap(page, '01-landing', errors)

  await page.goto('/sign-up')
  await snap(page, '02-sign-up', errors)
  // The email form is hidden behind a "Comenzar ahora" step.
  const start = page.getByRole('button', { name: /comenzar ahora/i })
  if (await start.isVisible()) await start.click()
  await snap(page, '02b-sign-up-form', errors)
  await page.getByPlaceholder('Nombre completo').fill('Usuario Auditoría')
  await page.getByPlaceholder('Correo electrónico').fill(email)
  await page.getByPlaceholder('Contraseña (mín. 6 caracteres)').fill('audit-pass-123')
  await page.locator('form button[type="submit"]').first().click()

  await page.waitForURL(/onboarding|dashboard|sign-in/, { timeout: 20_000 }).catch(() => {})
  await snap(page, '03-after-sign-up', errors)
  writeFileSync(`${OUT}/user.json`, JSON.stringify({ email, password: 'audit-pass-123' }))

  expect(page.url()).toMatch(/onboarding|dashboard/)

  // Onboarding step 3: main account
  await page.locator('select').first().selectOption({ label: 'Banco Popular' })
  await page.getByPlaceholder('Ej. Nómina').fill('Nómina')
  await page.getByPlaceholder('0.00').fill('25000')
  await page.getByRole('button', { name: /configurar nodo/i }).click()
  await snap(page, '04-onboarding-step4', errors)

  // Step 4: whatever the final confirmation button is, click the last enabled one
  const buttons = page.locator('main button:not([disabled])')
  await buttons.last().click()
  await page.waitForURL(/dashboard/, { timeout: 30_000 }).catch(() => {})
  await snap(page, '05-dashboard-first-load', errors)
  expect(page.url()).toMatch(/dashboard/)
})
