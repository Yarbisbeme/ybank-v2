import { test, expect, type Page } from '@playwright/test'
import { auditUser, signIn, snap, sql, watch } from './helpers'

// Requires 01 (audit user).
// Credit cards are edited by what is left: the form asks for the limit (required) and the
// available balance; the debt is derived (available - limit). Starts from a card without a
// limit, like the legacy cards in production.

const card = () => {
  const { email } = auditUser()
  return sql(`select a.id, a.credit_limit, a.current_balance from accounts a join auth.users u on u.id = a.user_id where u.email = '${email}' and a.name = 'Visa QA'`).split('|')
}

async function openEditor(page: Page, accountId: string) {
  await page.goto(`/accounts?accountId=${accountId}`)
  await page.getByRole('button', { name: 'Abrir cuenta Visa QA' }).first().click()
  const dialog = page.getByRole('dialog', { name: /editar cuenta/i })
  await expect(dialog).toBeVisible()
  return dialog
}

test('credit card: limit is required and the balance is edited as "available"', async ({ page }) => {
  const errors = watch(page)
  const { email } = auditUser()
  const userId = sql(`select id from auth.users where email = '${email}'`)
  sql(`insert into accounts (user_id, institution_id, name, type, currency, credit_limit, initial_balance, current_balance)
       values ('${userId}', (select id from institutions where name = 'Banco Popular'), 'Visa QA', 'credit_card', 'DOP', null, -15, -15)`)
  const [accountId] = card()

  await signIn(page)

  // 1. Without a limit the card cannot be saved.
  let editor = await openEditor(page, accountId)
  await expect(editor.getByText('Ingresa el límite para calcular cuánto te queda.')).toBeVisible()
  await editor.getByRole('button', { name: /guardar cambios/i }).click()
  await expect(page.getByText('Ingresa el límite de crédito de la tarjeta.')).toBeVisible()
  expect(card()[1], 'nothing saved without a limit').toBe('')

  // 2. Limit 200: what is left is computed from the existing debt; saving changes no balance.
  await editor.locator('#acc-credit-limit').fill('200')
  await expect(editor.locator('#acc-available')).toHaveValue('185')
  await expect(editor.getByText('Deuda: DOP 15.00')).toBeVisible()
  await snap(page, '50-card-limit', errors)
  await editor.getByRole('button', { name: /guardar cambios/i }).click()
  await expect.poll(() => card()[1]).toBe('200')
  expect(card()[2]).toBe('-15')
  expect(sql(`select count(*) from transactions where account_id = '${accountId}'`), 'no adjustment when only the limit was set').toBe('0')

  // 3. 135 left -> debt 65, recorded as a 50 adjustment; the card face shows what is left.
  editor = await openEditor(page, accountId)
  await expect(editor.locator('#acc-available')).toHaveValue('185')
  await editor.locator('#acc-available').fill('135')
  await expect(editor.getByText('Deuda: DOP 65.00')).toBeVisible()
  await editor.getByRole('button', { name: /guardar cambios/i }).click()
  await expect.poll(() => card()[2]).toBe('-65')
  expect(sql(`select type || ' ' || amount || ' ' || is_balance_adjustment from transactions where account_id = '${accountId}'`)).toBe('expense 50 true')
  await expect(page.getByText('DOP 135.00').filter({ visible: true }).first()).toBeVisible()
  await expect(page.getByText('DOP 65.00').filter({ visible: true }).first()).toBeVisible()
  await expect(page.getByText(/Límite DOP 200\.00/).filter({ visible: true }).first()).toBeVisible()
  await snap(page, '51-card-face-available', errors)
})
