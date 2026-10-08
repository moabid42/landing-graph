import { test, expect } from '@playwright/test'
import { POST_LINK, url } from './site.js'
import { checkTimelineViews, checkTrackDimming } from './timeline-views.js'
import AxeBuilder from '@axe-core/playwright'

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
    await checkTrackDimming(page, '.mtl-entry')
  })
})

test.describe('the mobile section navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(url())
  })

  const more = (page) => page.locator('.nav-more-toggle')
  const menu = (page) => page.locator('#more-sections')

  for (const [width, labels] of [
    [320, ['Timeline', 'Writing']],
    [375, ['Timeline', 'Writing']],
    [390, ['Timeline', 'Writing']],
    [699, ['Timeline', 'Writing']],
    [700, ['README', 'Pinned', 'Timeline', 'Writing']],
    [749, ['README', 'Pinned', 'Timeline', 'Writing']],
    [750, ['README', 'Pinned', 'Timeline', 'Writing', 'Research']],
    [768, ['README', 'Pinned', 'Timeline', 'Writing', 'Research']],
    [899, ['README', 'Pinned', 'Timeline', 'Writing', 'Research']],
  ]) {
    test(`fits the tabs and More menu at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      const nav = page.getByRole('navigation', { name: 'Sections' })
      const tabs = nav.getByRole('link')
      await expect(tabs).toHaveCount(labels.length)
      for (const [index, label] of labels.entries())
        await expect(tabs.nth(index)).toContainText(label)
      await expect(more(page)).toHaveAttribute('aria-expanded', 'false')
      expect(await nav.evaluate((el) => el.scrollWidth - el.clientWidth)).toBe(
        0
      )
      await more(page).click()
      await expect(more(page)).toHaveAttribute('aria-expanded', 'true')
      await expect(menu(page).getByRole('link')).toHaveCount(7 - labels.length)
      const bounds = await menu(page).boundingBox()
      expect(bounds.x).toBeGreaterThanOrEqual(0)
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width)
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth
        )
      ).toBe(0)
    })
  }

  test('reaches every overflow section and closes after navigation', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 844 })
    for (const [label, id] of [
      ['Pinned', 'work'],
      ['Research', 'research'],
      ['Stack', 'stack'],
      ['Contact', 'contact'],
    ]) {
      await more(page).click()
      await menu(page)
        .getByRole('link', { name: new RegExp(`^${label}`) })
        .click()
      await expect(page).toHaveURL(url(`/#${id}`))
      await expect(page.locator(`#${id}`)).toBeVisible()
      await expect(menu(page)).toBeHidden()
      await expect(more(page)).toHaveAttribute('aria-expanded', 'false')
      await expect(more(page)).toHaveClass(/active/)
      await expect(more(page)).toHaveText(label)
      expect(
        await page
          .locator('.gh-tabs')
          .evaluate((el) => el.scrollWidth - el.clientWidth)
      ).toBe(0)
      await expect
        .poll(async () => {
          const heading = await page.locator(`#${id} h2`).boundingBox()
          const header = await page.locator('.gh-header').boundingBox()
          return heading.y >= header.y + header.height
        })
        .toBe(true)
    }
  })

  test('reaches Writing directly and returns home through the crumb or menu', async ({
    page,
  }) => {
    const writing = page.locator('.gh-tabs > a[href="#blog"]')
    for (const home of ['crumb', 'menu']) {
      await writing.click()
      await expect(page).toHaveURL(url('/#blog'))
      await expect(writing).toHaveAttribute('aria-current', 'location')
      await expect(more(page)).not.toHaveClass(/active/)
      if (home === 'crumb') await page.locator('.crumb .repo-name').click()
      else {
        await more(page).click()
        await menu(page)
          .getByRole('link', { name: 'README', exact: true })
          .click()
      }
      await expect(page).toHaveURL(url())
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
      await expect(menu(page)).toBeHidden()
    }
  })

  test('moves the current section between the tabs and menu on tablet resize', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 749, height: 844 })
    await more(page).click()
    await menu(page)
      .getByRole('link', { name: /^Research/ })
      .click()
    await expect(more(page)).toHaveText('Research')
    await more(page).click()
    await expect(
      menu(page).getByRole('link', { name: /^Research/ })
    ).toHaveAttribute('aria-current', 'location')
    await page.setViewportSize({ width: 768, height: 844 })
    await expect(menu(page)).toBeHidden()
    await expect(more(page)).toHaveText('More')
    await expect(
      page.locator('.gh-tabs > a[href="#research"]')
    ).toHaveAttribute('aria-current', 'location')
    await more(page).click()
    await expect(
      menu(page).getByRole('link', { name: /^Research/ })
    ).toHaveCount(0)
    await page.setViewportSize({ width: 749, height: 844 })
    await expect(menu(page)).toBeHidden()
    await expect(more(page)).toHaveText('Research')
    await expect(page).toHaveURL(url('/#research'))
  })

  test('tracks scrolling between Timeline and the overflow sections', async ({
    page,
  }) => {
    await page
      .locator('#timeline')
      .evaluate((el) => el.scrollIntoView({ behavior: 'instant' }))
    await expect(
      page.locator('.gh-tabs > a[href="#timeline"]')
    ).toHaveAttribute('aria-current', 'location')
    await expect(more(page)).not.toHaveClass(/active/)
    await page
      .locator('#work')
      .evaluate((el) => el.scrollIntoView({ behavior: 'instant' }))
    await expect(more(page)).toHaveClass(/active/)
    await more(page).click()
    await expect(
      menu(page).getByRole('link', { name: /^Pinned/ })
    ).toHaveAttribute('aria-current', 'location')
    await page.keyboard.press('Escape')
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await expect(more(page)).not.toHaveClass(/active/)
    await expect(more(page)).toHaveText('More')
    await more(page).click()
    await expect(
      menu(page).getByRole('link', { name: 'README', exact: true })
    ).toHaveAttribute('aria-current', 'page')
  })

  test('supports keyboard access, Escape, and outside clicks', async ({
    page,
  }) => {
    await more(page).focus()
    await page.keyboard.press('Enter')
    await page.keyboard.press('Tab')
    await expect(menu(page).getByRole('link').first()).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(menu(page)).toBeHidden()
    await expect(more(page)).toBeFocused()
    await more(page).click()
    await page.locator('.gh-header .avatar').click()
    await expect(menu(page)).toBeHidden()
  })

  test('closes when keyboard focus leaves the navigation', async ({ page }) => {
    await more(page).click()
    await menu(page).getByRole('link').last().focus()
    await page.keyboard.press('Tab')
    await expect(menu(page)).toBeHidden()
  })

  test('returns from a post to a section through More', async ({ page }) => {
    const href = await page.locator(POST_LINK).first().getAttribute('href')
    await page.goto(href)
    await expect(more(page)).not.toHaveClass(/active/)
    await expect(
      page.locator('.gh-tabs > a').filter({ hasText: 'Writing' })
    ).toHaveAttribute('aria-current', 'page')
    await more(page).click()
    await expect(
      menu(page).getByRole('link', { name: /^Writing/ })
    ).toHaveCount(0)
    await menu(page)
      .getByRole('link', { name: /^Research/ })
      .click()
    await expect(page).toHaveURL(url('/#research'))
    await expect(page.locator('#research')).toBeVisible()
    await expect(menu(page)).toBeHidden()
  })

  test('restores the desktop tabs after resizing', async ({ page }) => {
    await more(page).click()
    await page.setViewportSize({ width: 1440, height: 900 })
    await expect(more(page)).toBeHidden()
    await expect(menu(page)).toBeHidden()
    await expect(
      page.getByRole('navigation', { name: 'Sections' }).getByRole('link')
    ).toHaveCount(7)
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(more(page)).toHaveAttribute('aria-expanded', 'false')
  })

  for (const theme of ['dark', 'light']) {
    test(`the open More menu is accessible in ${theme} mode`, async ({
      page,
    }) => {
      if (theme === 'light')
        await page
          .getByRole('button', { name: 'Switch to light theme' })
          .click()
      await more(page).click()
      const { violations } = await new AxeBuilder({ page })
        .include('.gh-header')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
      expect(violations).toEqual([])
    })
  }
})
