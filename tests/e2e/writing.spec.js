import { test, expect } from '@playwright/test'
import { POST_LINK, postPath, slugOf, url } from './site.js'
import { readPosts } from '../../plugins/posts.js'

const published = readPosts('content/blog')

test.describe('the writing section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(url())
  })

  test('shows only the three latest posts as compact log entries', async ({
    page,
  }) => {
    const posts = page.locator(POST_LINK)
    await expect(posts).toHaveCount(Math.min(3, published.length))
    for (const [i, post] of published.slice(0, 3).entries()) {
      await expect(posts.nth(i)).toHaveAttribute('href', postPath(post.slug))
      const row = page.locator('.post-row').nth(i)
      await expect(row.locator('.post-sha')).toHaveText(/^[a-f0-9]{7}$/)
      await expect(row.locator('.post-meta')).toContainText(/\d+ min read/)
      await expect(row.locator('time')).toHaveAttribute('datetime', post.date)
      if (post.summary) {
        await expect(row.locator('.post-summary')).toHaveText(post.summary)
      }
    }
    await expect(page.locator('.pager')).toHaveCount(0)
  })

  test('opens all writing and preserves the list on reload and history navigation', async ({
    page,
  }) => {
    await page.getByRole('link', { name: 'View all writing →' }).click()
    await expect(page).toHaveURL(url('/#all-writing'))
    await expect(page.locator(POST_LINK)).toHaveCount(published.length)
    await page.reload()
    await expect(page.locator(POST_LINK)).toHaveCount(published.length)
    await page.goBack()
    await expect(page.locator(POST_LINK)).toHaveCount(
      Math.min(3, published.length)
    )
    await page.goForward()
    await expect(page.locator(POST_LINK)).toHaveCount(published.length)
    await page.getByRole('link', { name: '← Latest writing' }).click()
    await expect(page.locator(POST_LINK)).toHaveCount(
      Math.min(3, published.length)
    )
  })

  test('returns from an older post to the full writing list', async ({
    page,
  }) => {
    await page.getByRole('link', { name: 'View all writing →' }).click()
    await page.locator(POST_LINK).last().click()
    await page.getByRole('link', { name: '← all writing' }).click()
    await expect(page).toHaveURL(url('/#all-writing'))
    await expect(page.locator(POST_LINK)).toHaveCount(published.length)
  })

  test('keeps both writing lists within a narrow mobile viewport', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 700 })
    await page
      .locator('.hero-cta')
      .getByRole('link', { name: 'Explore my work' })
      .click()
    await expect(page).toHaveURL(url('/#blog'))
    for (const fullList of [false, true]) {
      if (fullList) {
        await page.getByRole('link', { name: 'View all writing →' }).click()
      }
      await expect
        .poll(async () => {
          const heading = await page.locator('#all-writing').boundingBox()
          const header = await page.locator('.gh-header').boundingBox()
          return heading.y >= header.y + header.height
        })
        .toBe(true)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth
        )
      ).toBe(0)
      for (const row of await page.locator('.post-row').all()) {
        const bounds = await row.boundingBox()
        expect(bounds.x).toBeGreaterThanOrEqual(0)
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(320)
      }
    }
  })

  test('opens a post from its link and shows the body', async ({ page }) => {
    const first = page.locator(POST_LINK).first()
    const title = (await first.innerText()).trim()
    const slug = slugOf(await first.getAttribute('href'))

    await first.click()
    await expect(page).toHaveURL(new RegExp(`${postPath(slug)}$`))
    await expect(page.locator('h1')).toContainText(title)
    await expect(page).toHaveTitle(
      new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    )

    // the body arrives separately from the heading — wait it out and check
    // that prose actually rendered, not just the placeholder
    await expect(page.locator('.post-status')).toHaveCount(0)
    await expect(page.locator('.readme-body .md-body').last()).not.toBeEmpty()
  })

  test('opens a post directly by url', async ({ page }) => {
    const slug = slugOf(
      await page.locator(POST_LINK).first().getAttribute('href')
    )

    await page.goto(postPath(slug))
    await expect(page.locator('h1')).not.toHaveCount(0)
    // the timeline belongs to the README view, not to a post
    await expect(page.locator('.tl-wrap')).toHaveCount(0)
  })

  test('goes back to the README from a post', async ({ page }) => {
    await page.locator(POST_LINK).first().click()
    await expect(page.locator('.tl-wrap')).toHaveCount(0)
    await page.goBack()
    await expect(page.locator('.tl-wrap')).toHaveCount(1)
  })

  test('falls back to the README for a slug that does not exist', async ({
    page,
  }) => {
    await page.goto(postPath('no-such-post'))
    await expect(page.locator('body')).not.toBeEmpty()
  })

  // A post page is short until its body chunk lands: title, date, topics,
  // then the footer. If it is shorter than the window at that point, the
  // arriving body pushes the footer down — and on Linux and Windows it also
  // brings the scrollbar in, which takes real width and shifts every element
  // on screen at once. CI measured 0.83 CLS for that; macOS, whose scrollbars
  // float above the content, measured 0.065 and never showed it. So assert
  // the page already fills the window while the body is still in flight.
  test('a post fills the window before its body arrives', async ({ page }) => {
    const slug = slugOf(
      await page.locator(POST_LINK).first().getAttribute('href')
    )

    // Hold the body chunk open so the loading state is a place we can stand.
    let release
    const held = new Promise((r) => (release = r))
    await page.route(`**/assets/${slug}-*.js`, async (route) => {
      await held
      await route.continue()
    })

    await page.locator(POST_LINK).first().click()
    await expect(page.locator('.post-status.loading')).toBeVisible()

    const { scrollHeight, viewport } = await page.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      viewport: window.innerHeight,
    }))
    expect(
      scrollHeight,
      'the page must not grow once the body lands'
    ).toBeGreaterThan(viewport)

    release()
    await expect(page.locator('.post-status')).toHaveCount(0)
  })

  // The site routed on '#/blog/<slug>' before it routed on paths, and those
  // links are published where they cannot be edited.
  test('still opens a post from an old hash link', async ({ page }) => {
    const slug = slugOf(
      await page.locator(POST_LINK).first().getAttribute('href')
    )

    await page.goto(`${url()}#/blog/${slug}`)
    await expect(page).toHaveURL(new RegExp(`${postPath(slug)}$`))
    await expect(page.locator('.tl-wrap')).toHaveCount(0)
    await expect(page.locator('h1')).not.toHaveCount(0)
  })
})
