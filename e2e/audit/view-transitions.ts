import type { Page } from '@playwright/test'
import { signIn } from './helpers'

/** One CSS animation run by a view transition, as seen when it became ready. */
export interface RecordedAnimation {
  name: string
  /** e.g. "::view-transition-group(y2-card-…)"; empty for animations on real elements. */
  pseudoElement: string
  delay: number
  duration: number
}

declare global {
  interface Window {
    __vtAnimations: RecordedAnimation[]
    __vtPending: number
    __vtReady: number
  }
}

/** Records the CSS animations each view transition runs, without changing its behaviour. */
export async function recordViewTransitions(page: Page) {
  await page.addInitScript(() => {
    window.__vtAnimations = []
    window.__vtPending = 0
    window.__vtReady = 0
    const original = document.startViewTransition?.bind(document)
    if (!original) return
    document.startViewTransition = ((arg: Parameters<typeof original>[0]) => {
      window.__vtPending += 1
      const transition = original(arg)
      transition.ready
        .then(() => {
          window.__vtReady += 1
          for (const anim of document.getAnimations()) {
            const name = (anim as CSSAnimation).animationName
            if (!name) continue
            const effect = anim.effect as KeyframeEffect | null
            const timing = effect?.getComputedTiming()
            window.__vtAnimations.push({
              name,
              pseudoElement: effect?.pseudoElement ?? '',
              delay: Number(timing?.delay ?? 0),
              duration: Number(timing?.duration ?? 0),
            })
          }
        })
        .catch(() => {})
      // Pending until the transition has fully finished, not just started animating.
      transition.finished
        .catch(() => {})
        .finally(() => {
          window.__vtPending -= 1
        })
      return transition
    }) as typeof document.startViewTransition
  })
}

/** Waits until every view transition started so far has finished. */
export const settled = (page: Page) => page.waitForFunction(() => window.__vtPending === 0)

export const resetRecording = (page: Page) =>
  page.evaluate(() => {
    window.__vtAnimations = []
    window.__vtReady = 0
  })

export const recordedAnimations = (page: Page) => page.evaluate(() => window.__vtAnimations)

/** Signs in with the recorder installed, and starts with an empty recording. */
export async function signInRecording(page: Page) {
  await recordViewTransitions(page)
  await signIn(page)
  await settled(page)
  await resetRecording(page)
}
