import { test, expect } from '@playwright/test'
import { POST_LINK, url } from './site.js'
import AxeBuilder from '@axe-core/playwright'

// axe catches the machine-checkable half of accessibility: contrast, names,
// roles, landmarks. The checks below it cover the half axe cannot see —
// keyboard reachability and focus visibility.

const scan = (page) =>
  new AxeBuilder({ page }).withTags([
    'wcag2a',
    'wcag2aa',
    'wcag21a',
    'wcag21aa',
  ])

// Timeline entries fade in over 0.45s as they scroll into view. Scanning
// mid-fade makes axe composite a half-faded colour — #58a6ff read as
// #3d70ab — and report a contrast failure for a colour nobody ever sees.
// Which entries are mid-fade depends on where the layout drops them, so
// this passes locally and fails on a runner whose fonts pack the timeline
// slightly tighter. Wait for the page to stop moving before scanning.
const settled = (page) =>
  page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (a) =>
          a.playState !== 'running' ||
          a.effect?.getComputedTiming().iterations === Infinity
      )
  )

const report = (violations) =>
  violations
    .map(
      (v) =>
        `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes
          .slice(0, 4)
          .map((n) => n.target.join(' '))
          .join('\n  ')}`
    )
    .join('\n')

test.describe('accessibility', () => {
  test('the README page has no violations', async ({ page }) => {
    await page.goto(url())
    await page.locator('.tl-card').first().waitFor()
    await settled(page)
    const { violations } = await scan(page).analyze()
    expect(report(violations)).toBe('')
  })

  test('the README page has no violations in light mode', async ({ page }) => {
    await page.goto(url())
    await page.locator('.gh-header button.gh-btn').click()
    await page.locator('.tl-card').first().waitFor()
    await settled(page)
    const { violations } = await scan(page).analyze()
    expect(report(violations)).toBe('')
  })

  test('a blog post has no violations', async ({ page }) => {
    await page.goto(url())
    await page.locator(POST_LINK).first().click()
    await page.locator('h1').waitFor()
    // the body is a dynamic import, and mermaid another one inside it; scan
    // the finished post, not either placeholder (both get their own check
    // below)
    await expect(page.locator('.post-status')).toHaveCount(0)
    await expect(page.locator('.md-mermaid.loading')).toHaveCount(0)
    const { violations } = await scan(page).analyze()
    expect(report(violations)).toBe('')
  })

  // Opening a post shows two placeholders in turn: the post body is a
  // dynamic import, and mermaid is another one inside it. Both are on screen
  // for a moment on a slow connection, so both have to be readable.
  test('the loading placeholders are readable while a post renders', async ({
    page,
  }) => {
    await page.goto(url())
    await page.locator(POST_LINK).first().click()

    const contrast = async (root) => {
      const { violations } = await scan(page)
        .include(root)
        .disableRules(['role-img-alt'])
        .analyze()
      return report(violations.filter((v) => v.id === 'color-contrast'))
    }

    // first the body placeholder, while the post chunk is in flight
    expect(await contrast('.readme-body')).toBe('')

    // then the diagram placeholder, while mermaid is in flight
    await expect(page.locator('.post-status')).toHaveCount(0)
    expect(await contrast('.md-body')).toBe('')
  })

  test('a filtered timeline has no violations', async ({ page }) => {
    await page.goto(url())
    await page.locator('.tl-legend .tl-filter').first().click()
    await settled(page)
    const { violations } = await scan(page).analyze()
    expect(report(violations)).toBe('')
  })

  test('the first tab stop is a skip link that reaches the content', async ({
    page,
  }) => {
    await page.goto(url())
    await page.keyboard.press('Tab')

    const skip = page.locator(':focus')
    await expect(skip).toHaveClass(/skip-link/)
    await expect(skip).toBeVisible()

    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#top$/)
    await expect(page.locator('main#top')).toBeVisible()
  })

  test('every focused control shows a visible focus ring', async ({ page }) => {
    await page.goto(url())
    const controls = ['.gh-header button.gh-btn', '.tl-legend .tl-filter']

    for (const selector of controls) {
      const el = page.locator(selector).first()
      await el.focus()
      const ring = await el.evaluate((n) => {
        const s = getComputedStyle(n)
        return {
          outlineWidth: s.outlineWidth,
          outlineStyle: s.outlineStyle,
          boxShadow: s.boxShadow,
        }
      })
      const visible =
        (ring.outlineStyle !== 'none' && parseFloat(ring.outlineWidth) > 0) ||
        (ring.boxShadow !== 'none' && ring.boxShadow !== '')
      expect(visible, `${selector} has no focus ring`).toBe(true)
    }
  })

  test('the theme toggle says what it will do', async ({ page }) => {
    await page.goto(url())
    const toggle = page.locator('.gh-header button.gh-btn')
    await expect(toggle).toHaveAttribute('aria-label', /light|dark/i)
  })

  test('the timeline filters expose their pressed state', async ({ page }) => {
    await page.goto(url())
    const button = page.locator('.tl-legend .tl-filter').first()
    await expect(button).toHaveAttribute('aria-pressed', 'false')
    await button.click()
    await expect(button).toHaveAttribute('aria-pressed', 'true')
  })
})
