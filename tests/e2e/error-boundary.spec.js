import { test, expect } from '@playwright/test'

// The boundary is only reachable by making something throw during render, so
// these tests break the page on purpose and check that the damage is
// contained rather than white-screening the site.

test.describe('the error boundary', () => {
  test('is not shown when nothing is wrong', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.err-boundary')).toHaveCount(0)
  })

  test('contains a failing timeline and leaves the page standing', async ({
    page,
  }) => {
    // ResizeObserver is constructed in the timeline's layout effect and
    // nowhere else, so breaking it fails exactly one subtree.
    await page.addInitScript(() => {
      window.ResizeObserver = function () {
        throw new Error('boom: synthetic timeline failure')
      }
    })
    page.on('console', () => {}) // the boundary logs, which is expected

    await page.goto('/')

    const boundary = page.locator('.err-boundary')
    await expect(boundary).toHaveCount(1)
    await expect(boundary).toContainText('The timeline')
    await expect(boundary).toContainText('boom: synthetic timeline failure')

    // everything outside the timeline still rendered
    await expect(page.locator('.gh-header')).toBeVisible()
    await expect(page.locator('#contact table')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
  })

  test('announces itself to assistive tech', async ({ page }) => {
    await page.addInitScript(() => {
      window.ResizeObserver = function () {
        throw new Error('boom')
      }
    })
    page.on('console', () => {})
    await page.goto('/')
    await expect(page.locator('.err-boundary')).toHaveAttribute('role', 'alert')
  })
})
