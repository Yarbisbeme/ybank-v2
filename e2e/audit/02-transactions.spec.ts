import { test, expect, type Page } from '@playwright/test'
import { balanceOf, expectBalance, signIn, snap, watch } from './helpers'

// Requires 01-auth-onboarding (audit user with "Nómina" = 25,000 DOP).

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
  expect(balanceOf('Nómina')).toBe(25000)

  // --- Expense: 1,500 from Nómina
  await openNewOperation(page)
  await snap(page, '10-new-operation-modal', errors)
  await page.getByRole('radio', { name: 'Salida', exact: true }).click()
  await page.getByPlaceholder('0.00').last().fill('1500')
  await pick(page, 'Seleccionar cuenta...', 'Nómina')
  await pick(page, 'Buscar categoría...', 'Supermercado').catch(() => { })
  await page.getByPlaceholder('Nota u observación...').fill('Audit gasto')
  await submit(page)
  await expectBalance('Nómina', 23500, 'expense debits the account')
  await snap(page, '11-after-expense', errors)

  // --- Income: 3,000 into Nómina
  await openNewOperation(page)
  await page.getByRole('radio', { name: 'Entrada', exact: true }).click()
  await page.getByPlaceholder('0.00').last().fill('3000')
  await pick(page, 'Seleccionar cuenta...', 'Nómina')
  await page.getByPlaceholder('Nota u observación...').fill('Audit ingreso')
  await submit(page)
  await expectBalance('Nómina', 26500, 'income credits the account')
  await snap(page, '12-after-income', errors)

  // --- Transfer: 1,000 Nómina -> Efectivo (own accounts, same currency)
  await openNewOperation(page)
  await page.getByRole('radio', { name: 'Traspaso', exact: true }).click()
  await page.getByPlaceholder('0.00').last().fill('1000')
  await pick(page, 'Seleccionar cuenta...', 'Nómina')
  await pick(page, 'Seleccionar destino...', 'Efectivo')
  await page.getByPlaceholder('Nota u observación...').fill('Audit traspaso')
  await submit(page)
  await expectBalance('Efectivo', 1000, 'transfer credits the destination')
  await snap(page, '13-after-transfer', errors)
})

// Known bug, fixed in Phase 2.2/2.5 (tax_rules): transfers between the user's own accounts are
// exempt from the 0.15/0.20 % DGII tax (docs/arquitectura/03), but the trigger charges it.
// test.fail: reported as passing while the bug exists, and turns red the day it is fixed,
// as a reminder to delete this marker.
test.fail('KNOWN BUG 2.2: own-account transfer is not taxed', () => {
  expect(balanceOf('Nómina')).toBe(25500)
})
