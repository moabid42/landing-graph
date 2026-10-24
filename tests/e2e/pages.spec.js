import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFileSync } from 'node:fs'
import config from '../../site.config.js'
import { PAGES } from '../../src/pages.js'
import { pagePath, absolute } from '../../src/paths.js'
import { absoluteImages, readPosts } from '../../plugins/posts.js'
import { url } from './site.js'
import { parseProjects } from '../../src/projects/parse.js'
import { readingMinutes } from '../../src/readingTime.js'

const projects = parseProjects(readFileSync('content/projects.md', 'utf8'))
const pins = projects.filter((project) => project.pinned)

for (const [route, info] of Object.entries(PAGES)) {
  test(`${route} opens directly, survives a reload and has its own static metadata`, async ({
    page,
    request,
  }) => {
    const path = pagePath(route)
    const response = await request.get(url(path))
    expect(response.status()).toBe(200)
    const html = await response.text()
    expect(html).toContain(
      `<title>${info.title} · ${config.identity.repo}</title>`
    )
    expect(html).toContain(`rel="canonical" href="${absolute(path)}"`)
    expect(html).toContain('class="prerendered"')
    const markdown = await request.get(url(`${path}index.md`))
    expect(markdown.status()).toBe(200)
    expect(await markdown.text()).toContain(`# ${info.title}`)
    const sitemap = await (await request.get(url('/sitemap.xml'))).text()
    expect(sitemap).toContain(`<loc>${absolute(path)}</loc>`)
    await page.goto(url(path))
    await expect(page.locator('h1')).toHaveText(info.title)
    await expect(
      page.locator('.gh-tabs a[aria-current="page"]')
    ).toHaveAttribute('href', path)
    await page.reload()
    await expect(page.locator('h1')).toHaveText(info.title)
    await expect(page).toHaveTitle(`${info.title} · ${config.identity.repo}`)
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
      'content',
      'website'
    )
  })
}

test('soul loads on demand and its authored text reaches the static exports', async ({
  page,
  request,
}) => {
  const source = readFileSync('content/soul.md', 'utf8')
  const body = source.replace(/<!--[\s\S]*?-->/g, '').trim()
  const authoringNote = source.match(/<!--\s*([^\n]+)/)?.[1]
  const bodyRequests = []
  page.on('request', (incoming) => {
    if (/\/assets\/Soul-[^/]+\.js/.test(incoming.url()))
      bodyRequests.push(incoming.url())
  })

  await page.goto(url())
  expect(bodyRequests).toHaveLength(0)
  await page.locator(`.gh-tabs a[href="${pagePath('soul')}"]`).click()
  const prose = page.locator('.soul-content .md-body')
  await expect(prose).toBeVisible()
  expect((await prose.innerText()).trim()).not.toBe('')
  expect(bodyRequests).toHaveLength(1)
  await expect(page.locator('.article-meta')).toContainText(
    `${readingMinutes(body)} min read`
  )
  await expect(page.locator('.article-meta time')).toHaveAttribute(
    'datetime',
    '2026-10-04'
  )
  await expect(page.locator('.article-meta time')).toHaveText(
    'Updated 04.10.2026'
  )

  const markdown = await (
    await request.get(url(`${pagePath('soul')}index.md`))
  ).text()
  const full = await (await request.get(url('/llms-full.txt'))).text()
  expect(markdown).toContain(absoluteImages(body))
  expect(full).toContain(absoluteImages(body))
  for (const [, imageUrl] of markdown.matchAll(/!\[[^\]\n]*\]\(([^)\s]+)\)/g)) {
    expect(imageUrl).toMatch(/^https?:\/\//)
    const image = await request.get(url(new URL(imageUrl).pathname))
    expect(image.status()).toBe(200)
  }
  if (authoringNote) {
    await expect(prose).not.toContainText(authoringNote)
    expect(markdown).not.toContain(authoringNote)
    expect(full).not.toContain(authoringNote)
  }
  const schema = JSON.parse(
    await page.locator('script[type="application/ld+json"]').textContent()
  )
  expect(schema['@type']).toBe('AboutPage')
})

test('landing page contains highlights with working links to the complete collections', async ({
  page,
}) => {
  await page.goto(url())
  await expect(page.locator('#stack')).toHaveCount(0)
  await expect(
    page.getByRole('link', { name: 'Stack', exact: true })
  ).toHaveCount(0)
  await expect(page.locator('#work .pin-card')).toHaveCount(
    Math.min(2, pins.length)
  )
  await expect(page.locator('.post-row')).toHaveCount(
    Math.min(3, readPosts('content/blog').length)
  )
  await expect(page.locator('.research-release')).toHaveCount(
    Math.min(1, config.research.length)
  )
  await expect(page.locator('.tl-views')).toHaveCount(0)
  await expect(page.locator('.tl-view-note')).toContainText('Highlights')
  const highlightCount = await page.locator('.tl-entry').count()
  await page
    .getByRole('link', { name: 'View full timeline', exact: true })
    .click()
  await expect(page).toHaveURL(url(pagePath('timeline')))
  await expect(
    page.getByRole('button', { name: /^Everything/ })
  ).toHaveAttribute('aria-pressed', 'true')
  expect(await page.locator('.tl-entry').count()).toBeGreaterThan(
    highlightCount
  )
  await expect(page.locator('#research')).toHaveCount(0)
  await expect(page.locator('#blog')).toHaveCount(0)
})

test('old full-writing hash links open the new archive', async ({ page }) => {
  await page.goto(url('/#all-writing'))
  await expect(page).toHaveURL(url(pagePath('writing')))
  await expect(page.locator('.post-row')).toHaveCount(
    readPosts('content/blog').length
  )
})

test('research filters search summaries and topics and can recover from empty results', async ({
  page,
}) => {
  await page.goto(url(pagePath('research')))
  await expect(page.locator('.research-release')).toHaveCount(
    config.research.length
  )
  await page.getByRole('searchbox', { name: 'Search research' }).fill('entropy')
  await expect(page.locator('.research-release')).toHaveCount(1)
  await expect(page.locator('.release-body h3')).toHaveText(
    'RCPRNG: Robust Complete PRNG'
  )
  await page
    .getByRole('searchbox', { name: 'Search research' })
    .fill('no-such-publication-12345')
  await expect(page.locator('.research-release')).toHaveCount(0)
  await expect(page.getByText('No papers match these filters')).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await page.getByRole('button', { name: /^Language: C \d+$/ }).click()
  await expect(page.locator('.research-release')).toHaveCount(1)
  await expect(page.locator('.release-body h3')).toHaveText(
    'HOP: Hook Oriented Programming'
  )
})

test('browser history restores the archive scroll position and updates the selected tab', async ({
  page,
}) => {
  await page.goto(url(pagePath('writing')))
  const last = page.locator('.post-title').last()
  await last.scrollIntoViewIfNeeded()
  const scroll = await page.evaluate(() => window.scrollY)
  await last.click()
  await expect(page.locator('.post-page')).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  await page.goBack()
  await expect(page.locator('h1')).toHaveText('Writing')
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scroll)
  await expect(page.locator('.gh-tabs a[aria-current="page"]')).toHaveAttribute(
    'href',
    pagePath('writing')
  )
  await page.goForward()
  await expect(page.locator('.post-page')).toBeVisible()
})

for (const theme of ['dark', 'light']) {
  test(`dedicated pages are accessible and retain the ${theme} theme during navigation`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(url(pagePath('writing')))
    if (theme === 'light')
      await page.getByRole('button', { name: 'Switch to light theme' }).click()
    for (const route of Object.keys(PAGES)) {
      await page.locator(`.gh-tabs a[href="${pagePath(route)}"]`).click()
      await expect(page.locator('h1')).toHaveText(PAGES[route].title)
      await expect(
        page.getByRole('button', {
          name: `Switch to ${theme === 'light' ? 'dark' : 'light'} theme`,
        })
      ).toBeVisible()
      await page.waitForFunction(() =>
        document
          .getAnimations()
          .every((animation) => animation.playState !== 'running')
      )
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
      expect(
        violations.map(
          (violation) =>
            `${violation.id}: ${violation.nodes.map((node) => node.target).join(', ')}`
        )
      ).toEqual([])
    }
  })
}
