import { test, expect, type Page } from '@playwright/test'
import { expectBalance, balanceOf, signIn } from './helpers'

// Lists only move when their content changes because of something the user did;
// everything pressable responds on press. Requires 01–03 (audit user with
// "Audit ingreso" and "Audit traspaso").

interface RowAnimation {
  name: string
  delay: string
  text: string
}

declare global {
  interface Window {
    __rowAnimations: RowAnimation[]
  }
}

const ROW_ANIMATIONS = ['y2-row-enter', 'y2-row-highlight', 'y2-row-collapse']

/** Records row animations as they start (CSS animationstart), names and delays. */
async function recordRowAnimations(page: Page) {
  await page.addInitScript((names) => {
    window.__rowAnimations = []
    document.addEventListener(
      'animationstart',
      (event) => {
        if (!names.includes(event.animationName)) return
        const target = event.target as HTMLElement
        window.__rowAnimations.push({
          name: event.animationName,
          delay: getComputedStyle(target).animationDelay,
          text: (target.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 60),
        })
      },
      true,
    )
  }, ROW_ANIMATIONS)
}

const rowAnimations = (page: Page) => page.evaluate(() => window.__rowAnimations)
const resetRows = (page: Page) => page.evaluate(() => { window.__rowAnimations = [] })
const filterTab = (page: Page, name: string) =>
  page.getByRole('radio', { name: new RegExp(`^${name}$`, 'i') }).first()

async function signInOnInicio(page: Page) {
  await recordRowAnimations(page)
  await signIn(page)
  await expect(page.getByText('Audit ingreso').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
}

test.describe('Listas: solo se mueven cuando su contenido cambia por algo que hice', () => {
  test('llegar a una pantalla no escalona la lista', async ({ page }) => {
    await signInOnInicio(page)
    expect(await rowAnimations(page)).toEqual([])
  })

  test('filtrar escalona las filas nuevas de arriba abajo', async ({ page }) => {
    await signInOnInicio(page)
    await filterTab(page, 'Ingresos').click()
    await expect(page.getByText('Audit traspaso')).toHaveCount(0)
    await resetRows(page)

    await filterTab(page, 'Todos').click()
    await expect(page.getByText('Audit traspaso').first()).toBeVisible()
    await expect.poll(async () => (await rowAnimations(page)).length).toBeGreaterThanOrEqual(2)

    const enters = (await rowAnimations(page)).filter((a) => a.name === 'y2-row-enter')
    expect(enters.length).toBeGreaterThanOrEqual(2)
    const delays = enters.map((a) => parseFloat(a.delay))
    expect(delays[0]).toBe(0)
    expect(delays[1]).toBeCloseTo(0.02, 3)
  })

  test('registrar un movimiento resalta solo esa fila, una vez', async ({ page }) => {
    await signInOnInicio(page)
    const before = balanceOf('Nómina')
    await resetRows(page)

    await page.getByRole('button', { name: /registrar movimiento/i }).first().click()
    await page.getByRole('radio', { name: 'Salida', exact: true }).click()
    await page.getByPlaceholder('0.00').last().fill('100')
    const account = page.getByRole('combobox', { name: 'Seleccionar cuenta...' }).last()
    await account.click()
    await account.fill('Nómina')
    await page.getByRole('option').filter({ hasText: 'Nómina' }).first().click()
    await page.getByPlaceholder('Nota u observación...').fill('Lista gasto')
    await page.locator('button[type="submit"][form="tx-form"]').click()

    await expectBalance('Nómina', before - 100)
    await expect(page.getByText('Lista gasto').first()).toBeVisible()
    await page.waitForLoadState('networkidle')

    const animations = await rowAnimations(page)
    expect(animations.map((a) => a.name)).toEqual(['y2-row-highlight'])
    expect(animations[0].text).toContain('Lista gasto')
  })

  test('eliminar un movimiento lo pliega', async ({ page }) => {
    await signInOnInicio(page)
    await expect(page.getByText('Lista gasto').first()).toBeVisible()
    const before = balanceOf('Nómina')
    await resetRows(page)

    await page.getByText('Lista gasto', { exact: true }).first().click()
    await page.getByRole('button', { name: /eliminar movimiento/i }).click()
    const dialog = page.getByRole('dialog', { name: /eliminar movimiento/i })
    await dialog.getByRole('button', { name: /^eliminar$/i }).click()

    await expectBalance('Nómina', before + 100)
    await expect(page.getByText('Lista gasto')).toHaveCount(0)
    const animations = await rowAnimations(page)
    expect(animations.map((a) => a.name)).toEqual(['y2-row-collapse'])
    expect(animations[0].text).toContain('Lista gasto')
  })

  test('con "reducir movimiento" no hay escalonado', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await signInOnInicio(page)
    await filterTab(page, 'Ingresos').click()
    await expect(page.getByText('Audit traspaso')).toHaveCount(0)
    await filterTab(page, 'Todos').click()
    await expect(page.getByText('Audit traspaso').first()).toBeVisible()
    expect(await rowAnimations(page)).toEqual([])
  })
})

test.describe('Pulsaciones: todo lo que se pulsa responde al instante', () => {
  const scaleOf = (page: Page, name: RegExp) =>
    page.getByRole('button', { name }).first().evaluate((el) => getComputedStyle(el).scale)

  test('un botón se hunde al presionarlo, antes de soltar', async ({ page }) => {
    await signIn(page)
    const button = page.getByRole('button', { name: /registrar movimiento/i }).first()
    await button.hover()
    await page.mouse.down()
    await expect.poll(() => scaleOf(page, /registrar movimiento/i)).toBe('0.97')
    await page.mouse.up()
  })

  test('un control deshabilitado no responde', async ({ page }) => {
    await signIn(page)
    const disabled = page.getByRole('button', { name: 'Tarjeta anterior' }).first()
    await expect(disabled).toBeDisabled()
    await disabled.hover()
    await page.mouse.down()
    const scale = await disabled.evaluate((el) => getComputedStyle(el).scale)
    await page.mouse.up()
    expect(scale).toBe('none')
  })

  test('con "reducir movimiento" el botón no se hunde', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await signIn(page)
    await page.getByRole('button', { name: /registrar movimiento/i }).first().hover()
    await page.mouse.down()
    const scale = await scaleOf(page, /registrar movimiento/i)
    await page.mouse.up()
    expect(['none', '1']).toContain(scale)
  })
})
