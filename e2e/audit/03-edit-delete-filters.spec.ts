import { test, expect, type Page } from '@playwright/test'
import { balanceOf, signIn, snap, sql, watch, auditUser } from './helpers'

// Requires 01 and 02 (audit user with "Audit gasto/ingreso/traspaso").

async function openRow(page: Page, text: string) {
  await page.getByText(text, { exact: true }).first().click()
  // Transfers open a read-only detail view first; editing is behind "Editar traspaso".
  const editTransfer = page.getByRole('button', { name: /editar traspaso/i })
  const isTransfer = await editTransfer.waitFor({ state: 'visible', timeout: 3000 }).then(() => true, () => false)
  if (isTransfer) await editTransfer.click()
  await expect(page.locator('button[type="submit"][form="tx-form"]')).toBeVisible()
}

test('edit expense amount updates balance', async ({ page }) => {
  const errors = watch(page)
  await signIn(page)
  const before = balanceOf('Nómina')
  await openRow(page, 'Audit gasto')
  await snap(page, '20-edit-expense-modal', errors)
  await page.getByPlaceholder('0.00').last().fill('2000') // was 1500
  await page.locator('button[type="submit"][form="tx-form"]').click()
  await page.waitForTimeout(3000)
  await snap(page, '21-after-edit-expense', errors)
  const after = balanceOf('Nómina')
  console.log(JSON.stringify({ before, after, errors }))
  expect(after).toBe(before - 500)
})

test('edit transfer amount keeps tax and items (B2)', async ({ page }) => {
  const errors = watch(page)
  await signIn(page)
  const { email } = auditUser()
  const q = () => sql(`select t.amount, t.target_amount, (select count(*) from transaction_items i where i.transaction_id=t.id) from transactions t join auth.users u on u.id=t.user_id where u.email='${email}' and t.description='Audit traspaso'`)
  const before = { row: q(), src: balanceOf('Nómina'), dst: balanceOf('Efectivo') }
  await openRow(page, 'Audit traspaso')
  await page.getByPlaceholder('0.00').last().fill('2000') // was 1000
  await page.locator('button[type="submit"][form="tx-form"]').click()
  await page.waitForTimeout(3000)
  await snap(page, '22-after-edit-transfer', errors)
  const after = { row: q(), src: balanceOf('Nómina'), dst: balanceOf('Efectivo') }
  console.log(JSON.stringify({ before, after, errors }))
  expect(after.dst).toBe(2000)
  // Documents current behaviour; B2 says the tax and items are lost on edit.
  expect.soft(after.row, 'transfer edit should keep tax + items').toMatch(/\|2000\|2$/)
})

test('delete expense restores balance', async ({ page }) => {
  const errors = watch(page)
  await signIn(page)
  const before = balanceOf('Nómina')
  const { email } = auditUser()
  const amount = Number(sql(`select t.amount from transactions t join auth.users u on u.id=t.user_id where u.email='${email}' and t.description='Audit gasto'`))
  await openRow(page, 'Audit gasto')
  await page.getByRole('button', { name: /eliminar movimiento/i }).click()
  const dialog = page.getByRole('dialog', { name: /eliminar movimiento/i })
  await expect(dialog).toBeVisible()
  await snap(page, '23-delete-confirm', errors)
  await dialog.getByRole('button', { name: /^eliminar$/i }).click()
  await page.waitForTimeout(3000)
  await snap(page, '24-after-delete', errors)
  const after = balanceOf('Nómina')
  console.log(JSON.stringify({ before, amount, after, errors }))
  expect(after).toBe(before + amount)
})

test('type filters show only matching rows', async ({ page }) => {
  const errors = watch(page)
  await signIn(page)
  const results: Record<string, string[]> = {}
  for (const tab of ['Ingresos', 'Gastos', 'Traspasos', 'Todos']) {
    await page.getByRole('radio', { name: new RegExp(`^${tab}$`, 'i') }).first().click()
    await page.waitForTimeout(2500)
    const body = await page.locator('body').innerText()
    results[tab] = ['Audit gasto', 'Audit ingreso', 'Audit traspaso'].filter((t) => body.includes(t))
  }
  await snap(page, '25-filters', errors)
  console.log(JSON.stringify({ results, errors }))
  expect(results['Ingresos']).toEqual(['Audit ingreso'])
  expect(results['Traspasos']).toEqual(['Audit traspaso'])
})

test('sign out, then protected routes redirect to sign-in', async ({ page }) => {
  const errors = watch(page)
  await signIn(page)
  await page.getByRole('button', { name: /cerrar sesión/i }).first().click()
  await page.waitForURL(/sign-in|\/$/, { timeout: 15_000 }).catch(() => {})
  await snap(page, '26-after-sign-out', errors)
  const results: Record<string, string> = {}
  for (const path of ['/dashboard', '/accounts', '/transactions', '/settings', '/onboarding']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    results[path] = new URL(page.url()).pathname
  }
  console.log(JSON.stringify({ results, errors }))
  for (const p of Object.values(results)) expect(p).toBe('/sign-in')
})
