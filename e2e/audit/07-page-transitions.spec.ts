import { test, expect } from '@playwright/test'
import { snap, watch } from './helpers'
import {
  recordedAnimations as animations,
  resetRecording as reset,
  settled,
  signInRecording,
} from './view-transitions'

// Route changes animate the page content (PageTransition + View Transitions API).
// Each test is one scenario of the agreed behaviour.

test.describe('Transición entre páginas', () => {
  test('al navegar del Inicio a Cuentas, la página sale y la nueva entra', async ({ page }) => {
    const errors = watch(page)
    await signInRecording(page)

    await page.getByRole('link', { name: 'Cuentas' }).first().click()
    await page.waitForURL(/\/accounts/)
    await expect
      .poll(async () => (await animations(page)).map((a) => a.name))
      .toEqual(expect.arrayContaining(['y2-page-out', 'y2-page-in']))
    await settled(page)
    await snap(page, '07-accounts-after-transition', errors)
  })

  test('nunca se ven dos páginas a la vez: la nueva entra cuando la vieja ya se fue', async ({ page }) => {
    await signInRecording(page)

    await page.getByRole('link', { name: 'Cuentas' }).first().click()
    await page.waitForURL(/\/accounts/)
    await expect.poll(async () => (await animations(page)).length).toBeGreaterThan(0)

    const all = await animations(page)
    const out = all.find((a) => a.name === 'y2-page-out')
    const inn = all.find((a) => a.name === 'y2-page-in')
    expect(out, 'exit animation').toBeDefined()
    expect(inn, 'enter animation').toBeDefined()
    expect(inn!.delay).toBeGreaterThanOrEqual(out!.delay + out!.duration)
  })

  test('en móvil, el menú no queda tapado ni muestra la pestaña anterior durante la transición', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await signInRecording(page)
    await page.waitForLoadState('networkidle')
    const nav = page.getByRole('navigation', { name: 'Navegación móvil' })

    // Slow the transition down so a frame in the middle of it can be inspected.
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Animation.enable')
    await cdp.send('Animation.setPlaybackRate', { playbackRate: 0.1 })

    await nav.getByRole('link', { name: 'Tarjetas' }).click()
    await page.waitForFunction(() => window.__vtReady > 0 && window.__vtPending > 0, undefined, {
      polling: 50,
    })
    const duringTransition = await page.screenshot({ clip: (await nav.boundingBox())! })

    await settled(page)
    await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 })
    const afterTransition = await page.screenshot({ clip: (await nav.boundingBox())! })

    expect(duringTransition.equals(afterTransition)).toBe(true)
  })

  test('pasar de tarjeta en Cuentas no anima la página', async ({ page }) => {
    await signInRecording(page)
    await page.getByRole('link', { name: 'Cuentas' }).first().click()
    await page.waitForURL(/\/accounts/)
    await settled(page)
    await reset(page)

    const urlBefore = page.url()
    const next = page.getByRole('button', { name: 'Tarjeta siguiente' }).first()
    const prev = page.getByRole('button', { name: 'Tarjeta anterior' }).first()
    await ((await next.isEnabled()) ? next : prev).click()
    await expect.poll(() => page.url()).not.toBe(urlBefore)
    await settled(page)

    const pageAnimations = (await animations(page)).filter((a) => a.name.startsWith('y2-page'))
    expect(pageAnimations).toEqual([])
  })
})
