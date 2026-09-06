import { test, expect } from '@playwright/test'
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
    await page.goto('/')
    await page.locator('.tl-card').first().waitFor()
    const { violations } = await scan(page).analyze()
    expect(report(violations)).toBe('')
  })

  test('the README page has no violations in light mode', async ({ page }) => {
    await page.goto('/')
    await page.locator('.gh-header button.gh-btn').click()
    await page.locator('.tl-card').first().waitFor()
    const { violations } = await scan(page).analyze()
    expect(report(violations)).toBe('')
  })

  test('a blog post has no violations', async ({ page }) => {
    await page.goto('/')
    await page.locator('#blog a[href^="#/blog/"]').first().click()
    await page.locator('h1').waitFor()
    // mermaid renders asynchronously; scan the finished diagram, not the
    // placeholder (which gets its own check below)
    await expect(page.locator('.md-mermaid.loading')).toHaveCount(0)
    const { violations } = await scan(page).analyze()
    expect(report(violations)).toBe('')
  })

  test('the diagram placeholder is readable while it renders', async ({
    page,
  }) => {
    await page.goto('/')
    await page.locator('#blog a[href^="#/blog/"]').first().click()
    const { violations } = await scan(page)
      .include('.md-body')
      .disableRules(['role-img-alt'])
      .analyze()
    expect(report(violations.filter((v) => v.id === 'color-contrast'))).toBe('')
  })

  test('a filtered timeline has no violations', async ({ page }) => {
    await page.goto('/')
    await page.locator('.tl-legend .tl-filter').first().click()
    const { violations } = await scan(page).analyze()
    expect(report(violations)).toBe('')
  })

  test('the first tab stop is a skip link that reaches the content', async ({
    page,
  }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')

    const skip = page.locator(':focus')
    await expect(skip).toHaveClass(/skip-link/)
    await expect(skip).toBeVisible()

    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#top$/)
    await expect(page.locator('main#top')).toBeVisible()
  })

  test('every focused control shows a visible focus ring', async ({ page }) => {
    await page.goto('/')
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
    await page.goto('/')
    const toggle = page.locator('.gh-header button.gh-btn')
    await expect(toggle).toHaveAttribute('aria-label', /light|dark/i)
  })

  test('the timeline filters expose their pressed state', async ({ page }) => {
    await page.goto('/')
    const button = page.locator('.tl-legend .tl-filter').first()
    await expect(button).toHaveAttribute('aria-pressed', 'false')
    await button.click()
    await expect(button).toHaveAttribute('aria-pressed', 'true')
  })
})
