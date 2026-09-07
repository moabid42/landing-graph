import { test, expect } from '@playwright/test'
import { POST_LINK, postPath, slugOf, url } from './site.js'

test.describe('the writing section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(url())
  })

  test('lists the posts', async ({ page }) => {
    const posts = page.locator(POST_LINK)
    await expect(posts).not.toHaveCount(0)
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
