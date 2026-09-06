import { test, expect } from '@playwright/test'

test.describe('the writing section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('lists the posts', async ({ page }) => {
    const posts = page.locator('#blog a[href^="#/blog/"]')
    await expect(posts).not.toHaveCount(0)
  })

  test('opens a post from its link and shows the body', async ({ page }) => {
    const first = page.locator('#blog a[href^="#/blog/"]').first()
    const title = (await first.innerText()).trim()
    const slug = (await first.getAttribute('href')).replace('#/blog/', '')

    await first.click()
    await expect(page).toHaveURL(new RegExp(`#/blog/${slug}$`))
    await expect(page.locator('h1')).toContainText(title)
    await expect(page).toHaveTitle(
      new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    )
  })

  test('opens a post directly by url', async ({ page }) => {
    const slug = (
      await page
        .locator('#blog a[href^="#/blog/"]')
        .first()
        .getAttribute('href')
    ).replace('#/blog/', '')

    await page.goto(`/#/blog/${slug}`)
    await expect(page.locator('h1')).not.toHaveCount(0)
    // the timeline belongs to the README view, not to a post
    await expect(page.locator('.tl-wrap')).toHaveCount(0)
  })

  test('goes back to the README from a post', async ({ page }) => {
    await page.locator('#blog a[href^="#/blog/"]').first().click()
    await expect(page.locator('.tl-wrap')).toHaveCount(0)
    await page.goBack()
    await expect(page.locator('.tl-wrap')).toHaveCount(1)
  })

  test('falls back to the README for a slug that does not exist', async ({
    page,
  }) => {
    await page.goto('/#/blog/no-such-post')
    await expect(page.locator('body')).not.toBeEmpty()
  })
})
