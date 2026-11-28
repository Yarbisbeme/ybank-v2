import { test, expect, type Page } from '@playwright/test'
import { signIn, snap, watch } from './helpers'

// Route changes animate the page content (PageTransition + View Transitions API).
// Same-page updates, such as swiping cards on /accounts (?accountId=), must not:
// they would replay the page animation on every card.

declare global {
  interface Window {
    __vtAnimations: string[]
    __vtPending: number
  }
}

/** Records the CSS animations each view transition runs, without changing its behaviour. */
async function recordViewTransitions(page: Page) {
  await page.addInitScript(() => {
    window.__vtAnimations = []
    window.__vtPending = 0
    const original = document.startViewTransition?.bind(document)
    if (!original) return
    document.startViewTransition = ((arg: Parameters<typeof original>[0]) => {
      window.__vtPending += 1
      const transition = original(arg)
      transition.ready
        .then(() => {
          for (const anim of document.getAnimations()) {
            const name = (anim as CSSAnimation).animationName
            if (name) window.__vtAnimations.push(name)
          }
        })
        .catch(() => {})
        .finally(() => {
          window.__vtPending -= 1
        })
      return transition
    }) as typeof document.startViewTransition
  })
}

const settled = (page: Page) => page.waitForFunction(() => window.__vtPending === 0)
const reset = (page: Page) => page.evaluate(() => { window.__vtAnimations = [] })
const animations = (page: Page) => page.evaluate(() => window.__vtAnimations)

test('route changes animate the page; card swipes on /accounts do not', async ({ page }) => {
  const errors = watch(page)
  await recordViewTransitions(page)
  await signIn(page)
  await settled(page)
  await reset(page)

  await page.getByRole('link', { name: 'Cuentas' }).first().click()
  await page.waitForURL(/\/accounts/)
  await expect.poll(() => animations(page)).toEqual(
    expect.arrayContaining(['y2-page-out', 'y2-page-in']),
  )
  await settled(page)
  await snap(page, '07-accounts-after-transition', errors)

  await reset(page)
  const urlBefore = page.url()
  const next = page.getByRole('button', { name: 'Tarjeta siguiente' }).first()
  const prev = page.getByRole('button', { name: 'Tarjeta anterior' }).first()
  await ((await next.isEnabled()) ? next : prev).click()
  await expect.poll(() => page.url()).not.toBe(urlBefore)
  await settled(page)

  const pageAnimations = (await animations(page)).filter((name) => name.startsWith('y2-page'))
  expect(pageAnimations).toEqual([])
})
