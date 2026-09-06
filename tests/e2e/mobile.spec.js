import { test, expect } from '@playwright/test'

// Under 700px the timeline swaps to the git-log layout: one column, a trunk
// in the gutter, and branch lines routed between rows. Different renderer,
// so it needs its own checks.

test.describe('the mobile timeline', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.locator('.mtl-entry').first().waitFor()
  })

  test('renders the git-log layout, not the desktop graph', async ({
    page,
  }) => {
    await expect(page.locator('.mtl-entry')).not.toHaveCount(0)
    await expect(page.locator('.mtl-headnode')).toHaveCount(1)
    await expect(page.locator('.tl-wrap .tl-entry')).toHaveCount(0)
  })

  test('draws a branch line for the entries', async ({ page }) => {
    // each branch is a <g class="mbranch"> wrapping its path
    await expect(
      page.locator('svg.mtl-branches g.mbranch path')
    ).not.toHaveCount(0)
  })

  test('closes the log with HEAD below the last row', async ({ page }) => {
    const { headTop, lastRowBottom } = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('.mtl-entry')]
      const head = document.querySelector('.mtl-headnode')
      return {
        headTop: head.getBoundingClientRect().top + window.scrollY,
        lastRowBottom: Math.max(
          ...rows.map((r) => r.getBoundingClientRect().bottom + window.scrollY)
        ),
      }
    })
    expect(headTop).toBeGreaterThanOrEqual(lastRowBottom - 1)
  })

  test('never scrolls the page sideways', async ({ page }) => {
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('filters on mobile too', async ({ page }) => {
    const button = page.locator('.tl-legend .tl-filter').first()
    await button.click()
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.mtl-entry.dim')).not.toHaveCount(0)
  })
})
