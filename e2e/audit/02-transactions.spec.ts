import { test, expect, type Page } from '@playwright/test'
import { balanceOf, signIn, snap, sql, watch, auditUser } from './helpers'

// Requires 01-auth-onboarding to have run (creates the audit user with "Nómina" = 25,000 DOP).

async function openNewOperation(page: Page) {
  await page.getByRole('button', { name: /registrar movimiento|nuevo movimiento/i }).first().click()
  await expect(page.getByPlaceholder('0.00').last()).toBeVisible()
}

async function pick(page: Page, placeholder: string, option: string) {
  const input = page.getByRole('combobox', { name: placeholder }).last()
  await input.click()
  await input.fill(option)
  await page.getByRole('option').filter({ hasText: option }).first().click()
}

async function submit(page: Page) {
  await page.locator('button[type="submit"][form="tx-form"]').click()
}

test('create expense, income and transfer; balances follow in the DB', async ({ page }) => {
  const errors = watch(page)
  await signIn(page)
  const start = balanceOf('Nómina')
  expect(start).toBe(25000)

  // --- Expense: 1,500 from Nómina
  await openNewOperation(page)
  await snap(page, '10-new-operation-modal', errors)
  await page.getByRole('radio', { name: 'Salida', exact: true }).click()
  await page.getByPlaceholder('0.00').last().fill('1500')
  await pick(page, 'Seleccionar cuenta...', 'Nómina')
  await pick(page, 'Buscar categoría...', 'Supermercado').catch(() => { })
  await page.getByPlaceholder('Nota u observación...').fill('Audit gasto')
  await submit(page)
  await page.waitForTimeout(3000)
  await snap(page, '11-after-expense', errors)
  const afterExpense = balanceOf('Nómina')

  // --- Income: 3,000 into Nómina
  await openNewOperation(page)
  await page.getByRole('radio', { name: 'Entrada', exact: true }).click()
  await page.getByPlaceholder('0.00').last().fill('3000')
  await pick(page, 'Seleccionar cuenta...', 'Nómina')
  await page.getByPlaceholder('Nota u observación...').fill('Audit ingreso')
  await submit(page)
  await page.waitForTimeout(3000)
  await snap(page, '12-after-income', errors)
  const afterIncome = balanceOf('Nómina')

  // --- Transfer: 1,000 Nómina -> Efectivo (own accounts, same currency)
  await openNewOperation(page)
  await page.getByRole('radio', { name: 'Traspaso', exact: true }).click()
  await page.getByPlaceholder('0.00').last().fill('1000')
  await pick(page, 'Seleccionar cuenta...', 'Nómina')
  await pick(page, 'Seleccionar destino...', 'Efectivo')
  await page.getByPlaceholder('Nota u observación...').fill('Audit traspaso')
  await submit(page)
  await page.waitForTimeout(3000)
  await snap(page, '13-after-transfer', errors)
  const afterTransferSrc = balanceOf('Nómina')
  const afterTransferDst = balanceOf('Efectivo')

  const { email } = auditUser()
  const rows = sql(`select t.type, t.amount, t.target_amount, t.description from transactions t join auth.users u on u.id=t.user_id where u.email='${email}' order by t.created_at`)

  console.log(JSON.stringify({ start, afterExpense, afterIncome, afterTransferSrc, afterTransferDst, rows, errors }, null, 2))

  expect(afterExpense).toBe(23500)
  expect(afterIncome).toBe(26500)
  // Transfer between own accounts: by law no 0.15/0.20 % tax (docs/arquitectura/03). Current trigger charges it.
  expect.soft(afterTransferSrc, 'own-account transfer should not be taxed').toBe(25500)
  expect(afterTransferDst).toBe(1000)
})
