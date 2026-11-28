import { test, expect, type Page } from '@playwright/test'
import { recordedAnimations, resetRecording, settled, signInRecording } from './view-transitions'

// Continuity of the card the user opens: tapping it on Inicio carries the same card
// to its place in Cuentas. Only an intentional tap does it; arriving some other way
// or moving between cards must not make any card fly.

const flyingCards = async (page: Page) =>
  (await recordedAnimations(page))
    .map((a) => a.pseudoElement)
    .filter((p) => p.startsWith('::view-transition-group(y2-card-'))

for (const viewport of [
  { label: 'escritorio', width: 1440, height: 900 },
  { label: 'móvil', width: 390, height: 844 },
]) {
  test(`${viewport.label}: tocar la tarjeta en el Inicio la lleva a su sitio en Cuentas`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await signInRecording(page)

    await page.getByRole('button', { name: 'Abrir cuenta Nómina' }).click()
    await page.waitForURL(/\/accounts\?accountId=/)
    await expect.poll(() => flyingCards(page)).not.toEqual([])
    await settled(page)

    // One object, one image: a crossfade between the two renders doubles its labels.
    const cardImageFades = (await recordedAnimations(page)).filter((a) =>
      /^::view-transition-(old|new)\(y2-card-/.test(a.pseudoElement),
    )
    expect(cardImageFades).toEqual([])
  })
}

test('entrar a Cuentas desde el menú no hace volar ninguna tarjeta', async ({ page }) => {
  await signInRecording(page)

  await page.getByRole('link', { name: 'Cuentas' }).first().click()
  await page.waitForURL(/\/accounts/)
  // The page transition must have run, so an absent card flight is meaningful.
  await expect
    .poll(async () => (await recordedAnimations(page)).map((a) => a.name))
    .toContain('y2-page-in')
  await settled(page)
  expect(await flyingCards(page)).toEqual([])
})

test('pasar de tarjeta en Cuentas no hace volar ninguna tarjeta', async ({ page }) => {
  await signInRecording(page)
  await page.getByRole('button', { name: 'Abrir cuenta Nómina' }).click()
  await page.waitForURL(/\/accounts\?accountId=/)
  await settled(page)
  await resetRecording(page)

  const urlBefore = page.url()
  const next = page.getByRole('button', { name: 'Tarjeta siguiente' }).first()
  const prev = page.getByRole('button', { name: 'Tarjeta anterior' }).first()
  await ((await next.isEnabled()) ? next : prev).click()
  await expect.poll(() => page.url()).not.toBe(urlBefore)
  await settled(page)
  expect(await flyingCards(page)).toEqual([])
})
