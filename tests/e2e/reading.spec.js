import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { postPath, url } from './site.js'
import { feedPath } from '../../src/paths.js'

const cloud = postPath('surrounded-by-slops-cloud-red-teaming')
const memory = postPath('did-someone-say-memory')

test('the sidebar follows chapters, stays visible, and supports bookmarked chapters', async ({
  page,
}) => {
  await page.goto(url(cloud))
  const contents = page.locator('.post-contents')
  await expect(contents).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'TL;DR', exact: true })
  ).toHaveCount(0)
  await expect(page.locator('.article-meta')).toContainText(/\d+ min read/)
  const chapter = contents.getByRole('link', {
    name: 'IAM Mentality',
    exact: true,
  })
  await chapter.click()
  await expect(page).toHaveURL(/#iam-mentality$/)
  await expect(chapter).toHaveAttribute('aria-current', 'location')
  const heading = page.locator('.post-body #iam-mentality')
  const position = await heading.boundingBox()
  const header = await page.locator('.gh-header').boundingBox()
  expect(position.y).toBeGreaterThan(header.height)
  expect(position.y).toBeLessThan(header.height + 50)
  expect((await contents.boundingBox()).y).toBeLessThan(header.height + 40)

  await page
    .locator('.post-body #conscious-not-paranoid')
    .evaluate((node) => node.scrollIntoView({ behavior: 'instant' }))
  await expect(
    contents.getByRole('link', { name: 'Conscious, Not Paranoid', exact: true })
  ).toHaveAttribute('aria-current', 'location')
  await page.reload()
  await expect(page.locator('.post-status')).toHaveCount(0)
  await expect(chapter).toHaveAttribute('aria-current', 'location')
  expect((await heading.boundingBox()).y).toBeGreaterThan(header.height)
})

test('code is highlighted and Copy writes only the original code', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto(url(memory))
  const block = page.locator('.md-code-block').first()
  await expect(block.locator('code span')).not.toHaveCount(0)
  const code = await block.locator('code').innerText()
  await block.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect(
    block.getByRole('button', { name: 'Copied!', exact: true })
  ).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(code)
})

test('a denied clipboard selects the code and explains manual copying', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('Clipboard denied')) },
    })
  })
  await page.goto(url(memory))
  const block = page.locator('.md-code-block').first()
  const code = await block.locator('code').innerText()
  await block.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect(block.getByRole('status')).toContainText('Code selected')
  expect(await page.evaluate(() => window.getSelection().toString())).toBe(code)
})

test('illustrations expand, zoom, and close with Escape while restoring focus', async ({
  page,
}) => {
  await page.goto(url(postPath('pe-hell')))
  const image = page.getByRole('button', { name: /^Expand image:/ }).first()
  await image.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  const expandedImage = dialog.locator('img')
  await expect(expandedImage).toBeVisible()
  const fitted = await expandedImage.boundingBox()
  expect(fitted.height).toBeLessThanOrEqual(page.viewportSize().height - 96)
  await expandedImage.click()
  await expect(
    dialog.getByRole('button', { name: 'Zoom out' })
  ).toHaveAttribute('aria-pressed', 'true')
  expect((await expandedImage.boundingBox()).width).toBeCloseTo(
    fitted.width * 2,
    0
  )
  await expandedImage.click()
  await expect(dialog.getByRole('button', { name: 'Zoom in' })).toHaveAttribute(
    'aria-pressed',
    'false'
  )
  await expect(dialog.getByRole('button')).toHaveCount(2)
  const violations = (
    await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  ).violations
  expect(violations).toEqual([])
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(image).toBeFocused()
  expect(
    await page.evaluate(() => document.documentElement.style.overflow)
  ).toBe('')
  await image.click()
  await dialog.getByRole('button', { name: 'Close expanded view' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(image).toBeFocused()
})

test('Mermaid diagrams expand with distinct SVG ids and still respond to theme changes', async ({
  page,
}) => {
  const raw =
    '## Diagram\n\n```mermaid\nflowchart LR\nA[Read] --> B[Understand]\n```\n'
  await page.route(/\/assets\/did-someone-say-memory-[^/]+\.js$/, (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `export default ${JSON.stringify(raw)}`,
    })
  )
  await page.goto(url(memory))
  await page.getByRole('button', { name: /^Expand flowchart/ }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.locator('svg')).toBeVisible()
  const ids = await page
    .locator('svg[id]')
    .evaluateAll((nodes) => nodes.map((node) => node.id))
  expect(new Set(ids).size).toBe(ids.length)
  await dialog.getByRole('button', { name: 'Close expanded view' }).click()
  await page.getByRole('button', { name: 'Switch to light theme' }).click()
  await page.getByRole('button', { name: /^Expand flowchart/ }).click()
  await expect(dialog.locator('svg')).toBeVisible()
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze())
      .violations
  ).toEqual([])
})

test('related posts exclude the current article and the RSS feed is available', async ({
  page,
  request,
}) => {
  await page.goto(url(memory))
  const related = page.locator('.related-posts a')
  await expect(related).toHaveCount(3)
  for (const anchor of await related.all())
    expect(await anchor.getAttribute('href')).not.toBe(memory)
  await expect(
    page.getByRole('link', { name: 'Subscribe via RSS' })
  ).toHaveAttribute('href', feedPath())
  const response = await request.get(url(feedPath()))
  expect(response.ok()).toBe(true)
  expect(await response.text()).toContain('<rss')
  const title = await related.first().innerText()
  await related.first().click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
  await expect(page.locator('.post-status')).toHaveCount(0)
  await expect(page.locator('.post-contents a')).toHaveCount(
    await page.locator('.post-body h2[id], .post-body h3[id]').count()
  )
})

for (const width of [320, 390, 768, 1024]) {
  test(`the reading layout and chapter menu work at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto(url(`${cloud}#iam-mentality`))
    const menu = page.locator('.post-contents-mobile')
    await expect(menu).toBeVisible()
    await expect(page.locator('.post-contents')).toBeHidden()
    await menu.locator('summary').click()
    await menu
      .getByRole('link', { name: 'The Seven Questions', exact: true })
      .click()
    await expect(menu).not.toHaveAttribute('open')
    await expect(page).toHaveURL(/#the-seven-questions$/)
    await expect(
      menu.locator('a[href="#the-seven-questions"]')
    ).toHaveAttribute('aria-current', 'location')
    const position = await page
      .locator('.post-body #the-seven-questions')
      .boundingBox()
    const header = await page.locator('.gh-header').boundingBox()
    expect(position.y).toBeGreaterThan(header.height)
    expect(position.y).toBeLessThan(header.height + 60)
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      )
    ).toBe(0)
    const prose = await page
      .locator('.post-body .md-body')
      .evaluate((node) => ({
        font: parseFloat(getComputedStyle(node).fontSize),
        width: node.getBoundingClientRect().width,
      }))
    expect(prose.font).toBeGreaterThanOrEqual(17)
    expect(prose.width).toBeLessThanOrEqual(720)
  })
}
