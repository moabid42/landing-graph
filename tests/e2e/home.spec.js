import { test, expect } from '@playwright/test'
import { url } from './site.js'
import config from '../../site.config.js'

const { identity, links, footer, seo } = config
const label = (url) =>
  url.replace(/^https?:\/\/(www\.)?/, '').replace(/^mailto:/, '')

test.describe('the README page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(url())
  })

  // The crumb and the title are deliberately different: one is a repository
  // breadcrumb, the other is what a search result says.
  test('titles the tab from seo.title, not from the crumb', async ({
    page,
  }) => {
    await expect(page).toHaveTitle(seo.title)
  })

  test('renders the header crumb from the config', async ({ page }) => {
    await expect(page.locator('.crumb .avatar')).toHaveText(identity.avatar)
    await expect(page.locator('.crumb a').first()).toHaveText(identity.handle)
    await expect(page.locator('.repo-name')).toHaveText(identity.repo)
  })

  test('renders the hero from the config', async ({ page }) => {
    await expect(page.locator('h1').first()).toHaveText(identity.name)
    await expect(page.locator('.hero-sub')).toHaveText(identity.tagline)
  })

  test('shows the status row only when a status is set', async ({ page }) => {
    const status = page.locator('.hero-status .status')
    if (identity.status) {
      await expect(status).toContainText(identity.status)
    } else {
      await expect(status).toHaveCount(0)
    }
  })

  test('lists every configured remote in the contact table', async ({
    page,
  }) => {
    const rows = page.locator('#contact table tr')
    await expect(rows).toHaveCount(links.length)
    for (const [i, link] of links.entries()) {
      const row = rows.nth(i)
      await expect(row.locator('td').first()).toHaveText(link.name)
      await expect(row.locator('a')).toHaveAttribute('href', link.url)
      await expect(row.locator('a')).toHaveText(label(link.url))
      await expect(row.locator('.kind')).toHaveText(`(${link.kind})`)
    }
  })

  test('opens external remotes in a new tab, but not mailto', async ({
    page,
  }) => {
    for (const link of links) {
      // scoped to the table: the Email me button is a second mailto anchor
      const anchor = page.locator(`#contact table a[href="${link.url}"]`)
      const target = await anchor.getAttribute('target')
      expect(target, link.name).toBe(
        link.url.startsWith('mailto:') ? null : '_blank'
      )
    }
  })

  test('renders the footer with the current year', async ({ page }) => {
    const expected = footer.text.replace('{year}', new Date().getFullYear())
    await expect(page.locator('footer')).toContainText(expected)
    await expect(page.locator('footer')).not.toContainText('{year}')
  })

  test('applies the seo description to the document', async ({ page }) => {
    const meta = page.locator('meta[name="description"]')
    await expect(meta).toHaveAttribute('content', config.seo.description)
  })

  test('loads without console errors or failed requests', async ({ page }) => {
    const errors = []
    const failed = []
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    page.on('requestfailed', (r) => failed.push(r.url()))
    await page.reload()
    await page.waitForLoadState('networkidle')
    expect(errors).toEqual([])
    expect(failed).toEqual([])
  })

  test('never shows the content warning banner', async ({ page }) => {
    // The banner means a markdown file failed to parse.
    await expect(page.locator('.tl-problems')).toHaveCount(0)
  })
})
