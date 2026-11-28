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

// Return trip: in Cuentas there is always a card in hand; going to Inicio, by the
// menu or Back, puts it back in its place.

async function goHomeByMenu(page: Page, mobile: boolean) {
  const link = mobile
    ? page.getByRole('navigation', { name: 'Navegación móvil' }).getByRole('link', { name: 'Inicio' })
    : page.getByRole('link', { name: 'Inicio', exact: true }).first()
  await link.click()
  await page.waitForURL(/\/dashboard/)
}

async function expectSingleImageFlight(page: Page) {
  await expect.poll(() => flyingCards(page)).not.toEqual([])
  await settled(page)
  const cardImageFades = (await recordedAnimations(page)).filter((a) =>
    /^::view-transition-(old|new)\(y2-card-/.test(a.pseudoElement),
  )
  expect(cardImageFades).toEqual([])
}

for (const viewport of [
  { label: 'escritorio', width: 1440, height: 900, mobile: false },
  { label: 'móvil', width: 390, height: 844, mobile: true },
]) {
  test(`${viewport.label}: ir al Inicio desde el menú devuelve la tarjeta a su sitio`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await signInRecording(page)
    await page.getByRole('button', { name: 'Abrir cuenta Nómina' }).click()
    await page.waitForURL(/\/accounts\?accountId=/)
    await settled(page)
    await resetRecording(page)

    await goHomeByMenu(page, viewport.mobile)
    await expectSingleImageFlight(page)
  })
}

// Next does not run history traversals (Back/Forward) inside a view transition:
// nothing animates on Back, not even the page transition. When this test starts
// passing, drop the .fail.
test('KNOWN LIMITATION: el botón Atrás también devuelve la tarjeta a su sitio', async ({ page }) => {
  test.fail()
  await signInRecording(page)
  await page.getByRole('button', { name: 'Abrir cuenta Nómina' }).click()
  await page.waitForURL(/\/accounts\?accountId=/)
  await settled(page)
  await resetRecording(page)

  await page.goBack()
  await page.waitForURL(/\/dashboard/)
  await expectSingleImageFlight(page)
})

test('al volver, el Inicio muestra como seleccionada la tarjeta que tenía en Cuentas', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await signInRecording(page)
  const nav = page.getByRole('navigation', { name: 'Navegación móvil' })
  await nav.getByRole('link', { name: 'Tarjetas' }).click()
  await page.waitForURL(/\/accounts/)
  await settled(page)

  // Move to the other card, so the one in hand is not Inicio's default.
  const before = page.url()
  await page.getByRole('button', { name: 'Tarjeta siguiente' }).first().click()
  await expect.poll(() => page.url()).not.toBe(before)
  await settled(page)
  await resetRecording(page)

  await goHomeByMenu(page, true)
  await expectSingleImageFlight(page)
  // On mobile only the front card of the stack can be opened.
  await expect(page.getByRole('button', { name: 'Abrir cuenta Efectivo' })).toBeVisible()
})

test('después de volver, ir a Cuentas desde el menú no hace volar ninguna tarjeta', async ({ page }) => {
  await signInRecording(page)
  await page.getByRole('button', { name: 'Abrir cuenta Nómina' }).click()
  await page.waitForURL(/\/accounts\?accountId=/)
  await settled(page)
  await goHomeByMenu(page, false)
  await settled(page)
  await resetRecording(page)

  await page.getByRole('link', { name: 'Cuentas' }).first().click()
  await page.waitForURL(/\/accounts/)
  await expect
    .poll(async () => (await recordedAnimations(page)).map((a) => a.name))
    .toContain('y2-page-in')
  await settled(page)
  expect(await flyingCards(page)).toEqual([])
})

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
