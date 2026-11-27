import { test, expect } from '@playwright/test'
import { newAuditEmail, saveAuditUser, snap, watch } from './helpers'

// Creates the user the later specs share ("Nómina" = 25,000 DOP + default "Efectivo").

test('sign up with email → onboarding → dashboard', async ({ page }) => {
  const errors = watch(page)
  const email = newAuditEmail()
  const password = 'audit-pass-123'

  await page.goto('/')
  await snap(page, '01-landing', errors)

  await page.goto('/sign-up')
  await snap(page, '02-sign-up', errors)
  await page.getByPlaceholder('Nombre completo').fill('Usuario Auditoría')
  await page.getByPlaceholder('Correo electrónico').fill(email)
  await page.getByPlaceholder('Contraseña (mín. 6 caracteres)').fill(password)
  await page.locator('form button[type="submit"]').first().click()

  await page.waitForURL(/onboarding|dashboard/, { timeout: 20_000 })
  await snap(page, '03-after-sign-up', errors)
  saveAuditUser({ email, password })

  // Onboarding step 3: main account
  await page.locator('select').first().selectOption({ label: 'Banco Popular' })
  await page.getByPlaceholder('Ej. Nómina').fill('Nómina')
  await page.getByPlaceholder('0.00').fill('25000')
  await page.getByRole('button', { name: /guardar cuenta/i }).click()
  await snap(page, '04-onboarding-step4', errors)

  // Step 4 (currency). Clicked by name: it waits for the step to render (clicking "the last
  // button" while step 3 was on screen pressed step 3's "next" again).
  await page.getByRole('button', { name: /entrar a ybank/i }).click()
  await page.waitForURL(/dashboard/, { timeout: 30_000 })
  await snap(page, '05-dashboard-first-load', errors)
  expect(page.url()).toMatch(/dashboard/)
})
