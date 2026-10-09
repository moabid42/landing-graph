import { test, expect } from '@playwright/test'
import { url } from './site.js'

// The boundary is only reachable by making something throw during render, so
// these tests break the page on purpose and check that the damage is
// contained rather than white-screening the site.

const failTimeline = (page, message) =>
  page.addInitScript((message) => {
    // Navigation also observes sizes. Fail only the timeline's observation
    // so this exercises its boundary rather than the page-level boundary.
    window.ResizeObserver = class extends window.ResizeObserver {
      observe(target, options) {
        if (target.closest('#timeline')) throw new Error(message)
        super.observe(target, options)
      }
    }
  }, message)

test.describe('the error boundary', () => {
  test('is not shown when nothing is wrong', async ({ page }) => {
    await page.goto(url())
    await expect(page.locator('.err-boundary')).toHaveCount(0)
  })

  test('contains a failing timeline and leaves the page standing', async ({
    page,
  }) => {
    await failTimeline(page, 'boom: synthetic timeline failure')
    page.on('console', () => {}) // the boundary logs, which is expected

    await page.goto(url())

    const boundary = page.locator('#timeline .err-boundary')
    await expect(boundary).toHaveCount(1)
    await expect(page.locator('.err-boundary')).toHaveCount(1)
    await expect(boundary).toContainText('The timeline')
    await expect(boundary).toContainText('boom: synthetic timeline failure')

    // everything outside the timeline still rendered
    await expect(page.locator('.gh-header')).toBeVisible()
    await expect(page.locator('#contact table')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
  })

  test('announces itself to assistive tech', async ({ page }) => {
    await failTimeline(page, 'boom')
    page.on('console', () => {})
    await page.goto(url())
    await expect(page.locator('#timeline .err-boundary')).toHaveAttribute(
      'role',
      'alert'
    )
  })
})
