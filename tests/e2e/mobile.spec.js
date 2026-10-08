import { test, expect } from '@playwright/test'
import { url } from './site.js'
import { checkTimelineViews } from './timeline-views.js'

// Under 700px the timeline swaps to the git-log layout: one column, a trunk
// in the gutter, and branch lines routed between rows. Different renderer,
// so it needs its own checks.

test.describe('the mobile timeline', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(url())
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

  test('switches between highlights and the complete history', async ({
    page,
  }) => {
    await checkTimelineViews(page, '.mtl-entry', '.mtl-point')
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

  for (const width of [320, 375, 390]) {
    test(`fits both views without horizontal scrolling at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 })
      for (const view of ['Highlights', 'Everything']) {
        await page.getByRole('button', { name: new RegExp(`^${view}`) }).click()
        await expect
          .poll(() =>
            page.evaluate(
              () =>
                document.documentElement.scrollWidth -
                document.documentElement.clientWidth
            )
          )
          .toBeLessThanOrEqual(0)

        // Checking just the document misses content spilling into its side
        // padding. Every card and control must fit inside the timeline too.
        await expect
          .poll(() =>
            page.locator('#timeline').evaluate((timeline) => {
              const bounds = timeline.getBoundingClientRect()
              return [
                ...timeline.querySelectorAll(
                  '.tl-views button, .mtl-entry .tl-card, .mtl-entry .tl-card *, .mtl-point .plabel'
                ),
              ]
                .filter(
                  (el) => el.getBoundingClientRect().right > bounds.right + 1
                )
                .map((el) => el.className)
            })
          )
          .toEqual([])

        const heading = await page.locator('.tl-sec-head h2').boundingBox()
        const switcher = await page.locator('.tl-views').boundingBox()
        expect(
          Math.abs(
            heading.y + heading.height / 2 - switcher.y - switcher.height / 2
          )
        ).toBeLessThan(1)
      }
    })
  }

  test('filters on mobile too', async ({ page }) => {
    const button = page.locator('.tl-legend .tl-filter').first()
    await button.click()
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.mtl-entry.dim')).not.toHaveCount(0)
  })
})
