import { test, expect } from '@playwright/test'
import { auditUser, signIn, snap, sql, watch } from './helpers'

// Requires 01 (audit user with "Nómina").
// Regression (2026-11-28): monthly metrics were computed from the table's first page
// (10 rows, with its filters). With more movements in the month they came out short.
// They are now computed in Postgres (account_month_metrics / spending_by_day).

const money = (n: number) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

test('account summary counts every movement of the month, not one page', async ({ page }) => {
  const errors = watch(page)
  const { email } = auditUser()
  const accountId = sql(`select a.id from accounts a join auth.users u on u.id = a.user_id where u.email = '${email}' and a.name = 'Nómina'`)
  const userId = sql(`select id from auth.users where email = '${email}'`)

  // 12 small expenses today: together with earlier specs, well over one page of 10.
  sql(`insert into transactions (user_id, account_id, type, amount, description, date)
       select '${userId}', '${accountId}', 'expense', 10, 'Metric ' || g, (now() at time zone 'America/Santo_Domingo')::date
       from generate_series(1, 12) g`)
  const movements = Number(sql(`select count(*) from transactions where account_id = '${accountId}'`))
  expect(movements, 'more movements than one table page').toBeGreaterThan(10)

  // Expected outflow, computed independently of the new functions.
  const expectedOutflow = Number(sql(`
    select coalesce(sum(amount), 0) from transactions
    where account_id = '${accountId}' and type in ('expense', 'transfer', 'payment') and not is_balance_adjustment
      and date >= date_trunc('month', (now() at time zone 'America/Santo_Domingo'))::date`))

  await signIn(page)
  await page.goto(`/accounts?accountId=${accountId}`)
  // The summary is rendered twice (mobile / desktop layouts); check the visible one.
  await expect(page.getByText(`DOP ${money(expectedOutflow)}`).filter({ visible: true }).first()).toBeVisible()
  await snap(page, '40-monthly-metrics', errors)
})
