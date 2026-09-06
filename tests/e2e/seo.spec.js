import { test, expect } from '@playwright/test'
import config from '../../site.config.js'

const origin = (config.seo.url || '').replace(/\/+$/, '')

const isOpenGraph = (key) => key.startsWith('og:') || key.startsWith('article:')

const tag = (page, key) =>
  page.locator(
    isOpenGraph(key)
      ? `head meta[property="${key}"]`
      : `head meta[name="${key}"]`
  )

const meta = (page, key) => tag(page, key).getAttribute('content')

test.describe('share cards and crawlability', () => {
  test('the README route carries a full share card', async ({ page }) => {
    await page.goto('/')
    expect(await meta(page, 'og:type')).toBe('website')
    expect(await meta(page, 'og:title')).toBe(
      `${config.identity.handle} / ${config.identity.repo}`
    )
    expect(await meta(page, 'og:description')).toBe(config.seo.description)
    expect(await meta(page, 'og:url')).toBe(`${origin}/`)
    expect(await meta(page, 'og:site_name')).toBe(config.identity.repo)
    expect(await meta(page, 'twitter:card')).toBeTruthy()
  })

  test('a post overrides the card with its own title and summary', async ({
    page,
  }) => {
    const link = page.locator('#blog a[href^="#/blog/"]').first()
    await page.goto('/')
    const slug = (await link.getAttribute('href')).replace('#/blog/', '')
    await link.click()

    await expect.poll(() => meta(page, 'og:type')).toBe('article')
    expect(await meta(page, 'og:url')).toBe(`${origin}/#/blog/${slug}`)
    expect(await meta(page, 'og:title')).not.toBe(
      `${config.identity.handle} / ${config.identity.repo}`
    )
    // a shared post must not describe itself with the site blurb
    expect(await meta(page, 'og:description')).not.toBe(config.seo.description)
    expect(await meta(page, 'article:published_time')).toMatch(/^\d{4}-\d{2}/)
  })

  test('going back to the README restores the site card', async ({ page }) => {
    await page.goto('/')
    await page.locator('#blog a[href^="#/blog/"]').first().click()
    await expect.poll(() => meta(page, 'og:type')).toBe('article')
    await page.goBack()
    await expect.poll(() => meta(page, 'og:type')).toBe('website')
    // the article-only tag is removed, not blanked
    await expect(tag(page, 'article:published_time')).toHaveCount(0)
  })

  test('every route declares one canonical url', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('head link[rel="canonical"]')).toHaveCount(1)
    expect(
      await page.locator('head link[rel="canonical"]').getAttribute('href')
    ).toBe(`${origin}/`)

    await page.locator('#blog a[href^="#/blog/"]').first().click()
    await expect(page.locator('head link[rel="canonical"]')).toHaveCount(1)
    await expect
      .poll(() =>
        page.locator('head link[rel="canonical"]').getAttribute('href')
      )
      .toMatch(/#\/blog\//)
  })

  test('index.html carries the card statically, for crawlers without js', async ({
    request,
  }) => {
    const html = await (await request.get('/')).text()
    for (const tag of ['og:title', 'og:description', 'og:image', 'og:url']) {
      expect(html, tag).toContain(`property="${tag}"`)
    }
    expect(html).toContain('name="twitter:card"')
    expect(html).toContain('rel="canonical"')
  })

  test('robots.txt points at the sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt')
    expect(res.ok()).toBe(true)
    expect(await res.text()).toContain(`Sitemap: ${origin}/sitemap.xml`)
  })

  test('sitemap.xml lists the home route and every post', async ({
    request,
    page,
  }) => {
    const xml = await (await request.get('/sitemap.xml')).text()
    expect(xml).toContain(`<loc>${origin}/</loc>`)

    await page.goto('/')
    const slugs = await page
      .locator('#blog a[href^="#/blog/"]')
      .evaluateAll((as) => as.map((a) => a.getAttribute('href')))
    for (const href of slugs) {
      expect(xml, href).toContain(href.replace('#/blog/', ''))
    }
  })
})
