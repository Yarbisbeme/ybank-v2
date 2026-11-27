import { test, expect, type Page } from '@playwright/test'
import { auditUser, balanceOf, expectBalance, signIn, snap, sql, watch } from './helpers'

// Requires 01 and 02 (audit user with "Audit gasto/ingreso/traspaso").

async function openRow(page: Page, text: string) {
  await page.getByText(text, { exact: true }).first().click()
  // Transfers open a read-only detail view first; editing is behind "Auditar Traspaso".
  const submit = page.locator('button[type="submit"][form="tx-form"]')
  const editTransfer = page.getByRole('button', { name: /auditar traspaso/i })
  await expect(submit.or(editTransfer).first()).toBeVisible()
  if (await editTransfer.isVisible()) await editTransfer.click()
  await expect(submit).toBeVisible()
}

const transferRow = () => {
  const { email } = auditUser()
  return sql(`select t.amount, t.target_amount, (select count(*) from transaction_items i where i.transaction_id=t.id) from transactions t join auth.users u on u.id=t.user_id where u.email='${email}' and t.description='Audit traspaso'`)
}

test('edit expense amount updates balance', async ({ page }) => {
  const errors = watch(page)
  await signIn(page)
  const before = balanceOf('Nómina')
  await openRow(page, 'Audit gasto')
  await snap(page, '20-edit-expense-modal', errors)
  await page.getByPlaceholder('0.00').last().fill('2000') // was 1500
  await page.locator('button[type="submit"][form="tx-form"]').click()
  await expectBalance('Nómina', before - 500)
  await snap(page, '21-after-edit-expense', errors)
})

test('edit transfer amount updates the destination', async ({ page }) => {
  const errors = watch(page)
  await signIn(page)
  await openRow(page, 'Audit traspaso')
  await page.getByPlaceholder('0.00').last().fill('2000') // was 1000
  await page.locator('button[type="submit"][form="tx-form"]').click()
  await expectBalance('Efectivo', 2000)
  await snap(page, '22-after-edit-transfer', errors)
})

// Known bug B2, fixed in Phase 2.3 (atomic save_transaction): editing a transfer drops its
// tax and its two automatic items. See the test.fail note in 02-transactions.
test.fail('KNOWN BUG B2: transfer edit keeps tax and items', () => {
  expect(transferRow()).toMatch(/\|2000\|2$/)
})

test('delete expense restores balance', async ({ page }) => {
  const errors = watch(page)
  await signIn(page)
  const before = balanceOf('Nómina')
  const { email } = auditUser()
  const amount = Number(sql(`select t.amount from transactions t join auth.users u on u.id=t.user_id where u.email='${email}' and t.description='Audit gasto'`))
  await openRow(page, 'Audit gasto')
  page.once('dialog', (d) => d.accept())
  await page.getByTitle('Suprimir').click()
  await snap(page, '23-delete-confirm', errors)
  // Some versions show an in-page confirm instead of window.confirm.
  const confirm = page.getByRole('button', { name: /confirmar|eliminar|sí/i }).first()
  await confirm.waitFor({ state: 'visible', timeout: 2000 }).then(() => confirm.click(), () => {})
  await expectBalance('Nómina', before + amount)
  await snap(page, '24-after-delete', errors)
})

test('type filters show only matching rows', async ({ page }) => {
  const errors = watch(page)
  await signIn(page)
  const visible = async () => {
    const body = await page.locator('body').innerText()
    return ['Audit gasto', 'Audit ingreso', 'Audit traspaso'].filter((t) => body.includes(t))
  }
  // "Audit gasto" was deleted by the previous test.
  const expected: Record<string, string[]> = {
    INGRESOS: ['Audit ingreso'],
    TRASPASOS: ['Audit traspaso'],
    GLOBAL: ['Audit ingreso', 'Audit traspaso'],
  }
  for (const [tab, rows] of Object.entries(expected)) {
    // Labels are uppercased by CSS; the accessible name is not.
    await page.getByRole('button', { name: new RegExp(`^${tab}$`, 'i') }).first().click()
    await expect.poll(visible, { message: `filter ${tab}` }).toEqual(rows)
  }
  await snap(page, '25-filters', errors)
})

test('sign out, then protected routes redirect to sign-in', async ({ page }) => {
  const errors = watch(page)
  await signIn(page)
  await page.getByRole('button', { name: /cerrar sesión/i }).first().click()
  await page.waitForURL(/sign-in|\/$/, { timeout: 15_000 })
  await snap(page, '26-after-sign-out', errors)
  for (const path of ['/dashboard', '/accounts', '/transactions', '/settings', '/onboarding']) {
    await page.goto(path)
    await expect(page, `${path} is protected`).toHaveURL(/\/sign-in/)
  }
})
