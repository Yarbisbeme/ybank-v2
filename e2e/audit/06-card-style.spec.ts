import { test, expect, type Page } from '@playwright/test'
import { auditUser, signIn, snap, sql, watch } from './helpers'

// Regression: the card designer kept base, second colour, intensity, finish and network
// in form state only. Saving dropped them and reopening the editor showed the defaults.

function cardStyleOf(accountName: string): string {
  const { email } = auditUser()
  // coalesce: concat_ws skips NULLs, which would shift the fields.
  return sql(
    `select concat_ws('|', a.card_base, coalesce(a.color_secondary, ''), a.card_shape_intensity, a.card_finish, coalesce(a.network, ''))
     from accounts a join auth.users u on u.id = a.user_id
     where u.email = '${email}' and a.name = '${accountName}'`,
  )
}

function accountIdOf(accountName: string): string {
  const { email } = auditUser()
  return sql(
    `select a.id from accounts a join auth.users u on u.id = a.user_id
     where u.email = '${email}' and a.name = '${accountName}'`,
  )
}

async function openEditor(page: Page, accountName: string) {
  await page.goto(`/accounts?accountId=${accountIdOf(accountName)}`)
  await page.getByRole('button', { name: `Abrir cuenta ${accountName}` }).click()
  await expect(page.getByRole('dialog', { name: /editar cuenta/i })).toBeVisible()
  return page.getByRole('dialog', { name: /editar cuenta/i })
}

test('editing a card saves every style option and reopens with it', async ({ page }) => {
  const errors = watch(page)
  await signIn(page)
  expect(cardStyleOf('Nómina')).toBe('textured||1|matte|')

  let editor = await openEditor(page, 'Nómina')
  await editor.getByRole('button', { name: 'Mastercard' }).click()
  await editor.getByRole('tab', { name: 'Base' }).click()
  await editor.getByRole('button', { name: 'Degradado' }).click()
  await editor.getByRole('tab', { name: 'Color' }).click()
  await editor.getByRole('button', { name: 'Segundo color coral' }).click()
  await editor.getByRole('tab', { name: 'Forma' }).click()
  await editor.getByRole('button', { name: 'Fuerte' }).click()
  await editor.getByRole('tab', { name: 'Acabado' }).click()
  await editor.getByRole('button', { name: /metálico/i }).click()
  await snap(page, '06-card-style-before-save', errors)
  await editor.getByRole('button', { name: /guardar cambios/i }).click()
  await expect(editor).toBeHidden()

  await expect
    .poll(() => cardStyleOf('Nómina'), { timeout: 15_000 })
    .toBe('gradient|#e4572e|2|metal|mastercard')

  editor = await openEditor(page, 'Nómina')
  await expect(editor.getByRole('button', { name: 'Mastercard' })).toHaveAttribute('aria-pressed', 'true')
  await editor.getByRole('tab', { name: 'Base' }).click()
  await expect(editor.getByRole('button', { name: 'Degradado' })).toHaveAttribute('aria-pressed', 'true')
  await editor.getByRole('tab', { name: 'Color' }).click()
  await expect(editor.getByRole('button', { name: 'Segundo color coral' })).toHaveAttribute('aria-pressed', 'true')
  await editor.getByRole('tab', { name: 'Forma' }).click()
  await expect(editor.getByRole('button', { name: 'Fuerte' })).toHaveAttribute('aria-pressed', 'true')
  await editor.getByRole('tab', { name: 'Acabado' }).click()
  await expect(editor.getByRole('button', { name: /metálico/i })).toHaveAttribute('aria-pressed', 'true')
  await snap(page, '06-card-style-reopened', errors)
})
