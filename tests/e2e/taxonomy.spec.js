import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { pagePath } from '../../src/paths.js'
import { url } from './site.js'

const collections = [
  {
    page: 'work',
    label: 'projects',
    rows: '.project-list > li',
    query: 'domain:cloud-security language:Python topic:iam',
    count: 1,
  },
  {
    page: 'writing',
    label: 'writing',
    rows: '.post-row',
    query: 'domain:systems-programming language:C topic:memory-management',
    count: 3,
  },
  {
    page: 'research',
    label: 'research',
    rows: '.research-release',
    query: 'language:C topic:anti-debugging',
    count: 1,
  },
]

for (const collection of collections) {
  test(`${collection.label} supports qualifiers, reloads and clearing`, async ({
    page,
  }) => {
    await page.goto(url(pagePath(collection.page)))
    const search = page.getByRole('searchbox', {
      name: `Search ${collection.label}`,
    })
    await search.fill(collection.query)
    await expect(page.locator(collection.rows)).toHaveCount(collection.count)
    await page.reload()
    await expect(search).toHaveValue(collection.query)
    await expect(page.locator(collection.rows)).toHaveCount(collection.count)
    expect(new URL(page.url()).searchParams.get('q')).toBe(collection.query)
    await page.getByRole('button', { name: 'Clear filters' }).click()
    await expect(page).toHaveURL(url(pagePath(collection.page)))
  })
}

test('sidebar counts, language colors and search stay synchronized', async ({
  page,
}) => {
  await page.goto(url(pagePath('work')))
  const search = page.getByRole('searchbox', { name: 'Search projects' })
  const sidebar = page.getByRole('complementary', { name: 'projects filters' })
  await sidebar
    .getByRole('button', { name: /^Domain: Cloud Security \d+$/ })
    .click()
  await expect(search).toHaveValue('domain:cloud-security')
  await sidebar.getByRole('button', { name: /^Language: Python \d+$/ }).click()
  await expect(search).toHaveValue('domain:cloud-security language:Python')
  await expect(page.locator('.project-list > li')).toHaveCount(3)
  await expect(
    sidebar.getByRole('button', { name: /^Language: Python \d+$/ })
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(
    sidebar
      .getByRole('button', { name: /^Language: Python \d+$/ })
      .locator('.language-dot')
  ).toHaveCSS('background-color', 'rgb(53, 114, 165)')
  await search.fill('domain:cloud-security language:JavaScript')
  await expect(page.locator('.project-list > li')).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Remove language:JavaScript filter' })
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Remove language:JavaScript filter' })
    .click()
  await expect(search).toHaveValue('domain:cloud-security')
})

test('quoted filters, exclusions and update-date ranges work together', async ({
  page,
}) => {
  await page.goto(url(pagePath('work')))
  const search = page.getByRole('searchbox', { name: 'Search projects' })
  await search.fill(
    'domain:"Cloud Security" -language:Python updated:>=2026-07-01'
  )
  await expect(page.locator('.project-list > li')).not.toHaveCount(0)
  for (const row of await page.locator('.project-list > li').all()) {
    await expect(
      row.locator('.result-language').filter({ hasText: 'Python' })
    ).toHaveCount(0)
    await expect(row.locator('.result-updated')).toContainText('Updated')
  }
  await page
    .getByRole('complementary', { name: 'projects filters' })
    .getByRole('button', { name: /^Language: Python \d+$/ })
    .click()
  await expect(search).not.toHaveValue(/-language:Python/)
  await expect(page.locator('.project-list > li')).toHaveCount(3)
  await search.fill('updated:2026-02-30')
  await expect(page.getByRole('alert')).toContainText('Use updated:')
  await expect(page.locator('.project-list > li')).toHaveCount(0)
})

test('sidebars list domains, topics and languages and scroll with the page', async ({
  page,
}) => {
  for (const collection of collections) {
    await page.goto(url(pagePath(collection.page)))
    const sidebar = page.getByRole('complementary', {
      name: `${collection.label} filters`,
    })
    await expect(sidebar.getByRole('heading')).toHaveText([
      'Domains',
      'Topics',
      'Languages',
    ])
    await expect(sidebar).toHaveCSS('position', 'sticky')
    await sidebar.scrollIntoViewIfNeeded()
    const scrollBefore = await page.evaluate(() => window.scrollY)
    await sidebar.hover({ position: { x: 50, y: 100 } })
    await page.mouse.wheel(0, 200)
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(scrollBefore)
    expect(await sidebar.evaluate((element) => element.scrollTop)).toBe(0)
    await expect(sidebar).toHaveCSS('overflow-y', 'visible')
  }
})

test('recently updated sorting uses real dates and persists in the URL', async ({
  page,
}) => {
  await page.goto(url(pagePath('work')))
  await page
    .getByRole('button', { name: 'Sort by: Recommended (projects)' })
    .click()
  await page.getByRole('menuitemradio', { name: 'Recently updated' }).click()
  const dates = await page
    .locator('.project-list .result-updated time')
    .evaluateAll((elements) => elements.map((element) => element.dateTime))
  expect(dates.length).toBeGreaterThan(0)
  expect(dates).toEqual([...dates].sort().reverse())
  expect(new URL(page.url()).searchParams.get('sort')).toBe('updated')
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Sort by: Recently updated (projects)' })
  ).toBeVisible()
})

test('sort menus support keyboard selection and dismissal', async ({
  page,
}) => {
  await page.goto(url(pagePath('work')))
  const trigger = page.getByRole('button', {
    name: /^Sort by: .* \(projects\)$/,
  })
  const menu = page.getByRole('menu', { name: 'Sort projects' })
  const recommended = page.getByRole('menuitemradio', { name: 'Recommended' })
  const updated = page.getByRole('menuitemradio', { name: 'Recently updated' })

  await trigger.focus()
  await page.keyboard.press('ArrowDown')
  await expect(recommended).toBeFocused()
  await expect(recommended).toHaveAttribute('aria-checked', 'true')
  await page.keyboard.press('End')
  await expect(updated).toBeFocused()
  await page.keyboard.press('Home')
  await expect(recommended).toBeFocused()
  await page.keyboard.press('ArrowUp')
  await expect(updated).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(menu).toBeHidden()
  await expect(trigger).toBeFocused()
  await expect(trigger).toContainText('Recently updated')

  await page.keyboard.press('Space')
  await expect(updated).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()
  await expect(trigger).toBeFocused()

  for (const key of ['Tab', 'Shift+Tab']) {
    await trigger.click()
    await page.keyboard.press(key)
    await expect(menu).toBeHidden()
    await expect(page.locator(':focus')).toHaveCount(1)
  }

  await trigger.click()
  await page.getByRole('searchbox', { name: 'Search projects' }).click()
  await expect(menu).toBeHidden()
})

test('sort menus fit narrow screens across all archives', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 })
  for (const collection of collections) {
    await page.goto(url(pagePath(collection.page)))
    const trigger = page.getByRole('button', {
      name: new RegExp(`^Sort by: .* \\(${collection.label}\\)$`),
    })
    await trigger.click()
    const panel = await page.locator('.archive-sort-menu').boundingBox()
    expect(panel.x).toBeGreaterThanOrEqual(0)
    expect(panel.x + panel.width).toBeLessThanOrEqual(320)
    expect(panel.y).toBeGreaterThanOrEqual(0)
    expect(panel.y + panel.height).toBeLessThanOrEqual(844)
    await page.getByRole('menuitemradio', { name: 'Recently updated' }).click()
    await expect(trigger).toContainText('Recently updated')
    expect(new URL(page.url()).searchParams.get('sort')).toBe('updated')
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth
      )
    ).toBeLessThanOrEqual(0)
  }
})

test('short filtered results stay below search when the sidebar is taller', async ({
  page,
}) => {
  for (const width of [1440, 1024]) {
    await page.setViewportSize({ width, height: 1144 })
    await page.goto(url(pagePath('work')))
    const search = page.getByRole('searchbox', { name: 'Search projects' })
    for (const query of [
      'language:Solidity',
      'no-matching-project-12345',
      '',
    ]) {
      await search.fill(query)
      const searchToResultsGap = async () => {
        const input = await page.locator('.archive-query').boundingBox()
        const results = await page
          .locator('.archive-result-toolbar')
          .boundingBox()
        return Math.round(results.y - input.y - input.height)
      }
      await expect.poll(searchToResultsGap).toBeGreaterThanOrEqual(0)
      await expect.poll(searchToResultsGap).toBeLessThanOrEqual(24)
    }
  }
})

test('legacy topic links become visible search qualifiers', async ({
  page,
}) => {
  await page.goto(url(`${pagePath('work')}?q=vector&topic=C%2B%2B&page=999`))
  await expect(
    page.getByRole('searchbox', { name: 'Search projects' })
  ).toHaveValue('vector language:C++')
  await expect(page.locator('.project-list h3')).toHaveText('ft_containers')
  expect(new URL(page.url()).searchParams.has('topic')).toBe(false)
  expect(new URL(page.url()).searchParams.has('page')).toBe(false)
})

test('mobile filters expand, select a language and return to results without overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 })
  for (const collection of collections) {
    await page.goto(url(pagePath(collection.page)))
    const sidebar = page.getByRole('complementary', {
      name: `${collection.label} filters`,
    })
    await expect(sidebar).toBeHidden()
    await page.getByRole('button', { name: /^Filters/ }).click()
    await expect(sidebar).toBeVisible()
    await expect(sidebar.getByRole('heading')).toHaveText([
      'Domains',
      'Topics',
      'Languages',
    ])
    await expect(sidebar).toHaveCSS('overflow-y', 'visible')
    await sidebar
      .getByRole('button', {
        name:
          collection.page === 'work'
            ? /^Language: Python \d+$/
            : /^Language: C \d+$/,
      })
      .click()
    await page.getByRole('button', { name: /^Show \d+ results?$/ }).click()
    await expect(sidebar).toBeHidden()
    await expect(page.locator(collection.rows)).not.toHaveCount(0)
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth
        )
      )
      .toBeLessThanOrEqual(0)
  }
})

for (const theme of ['dark', 'light']) {
  test(`all sidebar archives are accessible in ${theme} mode`, async ({
    page,
  }) => {
    for (const collection of collections) {
      await page.goto(url(pagePath(collection.page)))
      if (
        theme === 'light' &&
        (await page
          .getByRole('button', { name: 'Switch to light theme' })
          .count())
      )
        await page
          .getByRole('button', { name: 'Switch to light theme' })
          .click()
      await page
        .getByRole('searchbox', { name: `Search ${collection.label}` })
        .fill(collection.query)
      await page
        .getByRole('button', {
          name: new RegExp(`^Sort by: .* \\(${collection.label}\\)$`),
        })
        .click()
      const { violations } = await new AxeBuilder({ page })
        .include(
          collection.page === 'work'
            ? '#work'
            : collection.page === 'writing'
              ? '#blog'
              : '#research'
        )
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
      expect(violations).toEqual([])
    }
  })
}
