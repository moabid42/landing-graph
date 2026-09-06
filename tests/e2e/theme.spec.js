import { test, expect } from '@playwright/test'
import config from '../../site.config.js'

const toggle = (page) => page.locator('.gh-header button.gh-btn')
const themeAttr = (page) =>
  page.evaluate(() => document.documentElement.dataset.theme ?? null)
const trackVar = (page, key) =>
  page.evaluate(
    (k) =>
      getComputedStyle(document.documentElement)
        .getPropertyValue(`--tl-track-${k}`)
        .trim(),
    key
  )

test.describe('the theme toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('switches between dark and light', async ({ page }) => {
    await expect(toggle(page)).toHaveText('light')
    await toggle(page).click()
    expect(await themeAttr(page)).toBe('light')
    await expect(toggle(page)).toHaveText('dark')
    await toggle(page).click()
    expect(await themeAttr(page)).toBeNull()
  })

  test('remembers the choice across a reload', async ({ page }) => {
    await toggle(page).click()
    await page.reload()
    expect(await themeAttr(page)).toBe('light')
    await expect(toggle(page)).toHaveText('dark')
  })

  test('swaps in the light palette from the config', async ({ page }) => {
    const track = config.tracks.find((t) => t.colorLight)
    test.skip(!track, 'no track declares a light colour')

    expect(await trackVar(page, track.key)).toBe(track.color)
    await toggle(page).click()
    expect(await trackVar(page, track.key)).toBe(track.colorLight)
  })

  test('repaints the branch lines when the theme flips', async ({ page }) => {
    const stroke = () =>
      page
        .locator('svg.branches path.branch')
        .first()
        .evaluate((p) => getComputedStyle(p).stroke)
    const dark = await stroke()
    await toggle(page).click()
    expect(await stroke()).not.toBe(dark)
  })
})
