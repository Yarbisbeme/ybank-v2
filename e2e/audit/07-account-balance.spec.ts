import { test, expect } from '@playwright/test'
import { auditUser, balanceOf, expectBalance, signIn, snap, sql, watch } from './helpers'

// Requires 01 (audit user with "Nómina").
// Regression (2026-11-28, staging): the account editor shows "Balance actual", but saving a new
// value only overwrote initial_balance; the balance on screen never changed and the account
// stopped matching its history. Now the difference is recorded as an "Ajuste de saldo".

test('editing "Balance actual" records a balance adjustment', async ({ page }) => {
  const errors = watch(page)
  await signIn(page)
  const { email } = auditUser()
  const accountRow = () =>
    sql(`select a.id, a.initial_balance from accounts a join auth.users u on u.id = a.user_id where u.email = '${email}' and a.name = 'Nómina'`)
  const [accountId, initialBefore] = accountRow().split('|')
  const before = balanceOf('Nómina')
  const target = before - 170

  await page.goto(`/accounts?accountId=${accountId}`)
  await page.getByRole('button', { name: 'Abrir cuenta Nómina' }).first().click()
  const dialog = page.getByRole('dialog', { name: /editar cuenta/i })
  await expect(dialog).toBeVisible()
  await dialog.locator('#acc-balance').fill(String(target))
  await snap(page, '30-edit-balance', errors)
  await dialog.getByRole('button', { name: /guardar cambios/i }).click()

  await expectBalance('Nómina', target, 'the balance on screen is the one typed')
  const adjustment = sql(`select t.type, t.amount, t.description from transactions t where t.account_id = '${accountId}' and t.is_balance_adjustment`)
  expect(adjustment).toBe('expense|170|Ajuste de saldo')
  expect(accountRow().split('|')[1], 'initial balance is not rewritten').toBe(initialBefore)
  await snap(page, '31-after-edit-balance', errors)
})
