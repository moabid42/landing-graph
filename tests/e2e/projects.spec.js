import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFileSync } from 'node:fs'
import config from '../../site.config.js'
import { pagePath } from '../../src/paths.js'
import { url } from './site.js'

const source = readFileSync('content/timeline/projects.md', 'utf8').replace(
  /<!--[\s\S]*?-->/g,
  ''
)
const total = [...source.matchAll(/^## /gm)].length

test.describe('project history', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(url(pagePath('work')))
  })

  test('combines search and topic filters, toggles tags, and clears empty results', async ({
    page,
  }) => {
    const history = page.locator('.project-history')
    const rows = history.locator('.project-list > li')
    const search = history.getByRole('searchbox', { name: 'Search projects' })
    const topic = history.getByRole('combobox', {
      name: 'Filter projects by topic',
    })
    await expect(rows).toHaveCount(Math.min(total, 10))
    await search.fill('42 Heilbronn')
    await expect(rows).not.toHaveCount(0)
    for (const row of await rows.all())
      await expect(row.locator('.project-org')).toHaveText('42 Heilbronn')
    await search.fill('no-matching-project-12345')
    await expect(rows).toHaveCount(0)
    await expect(
      history.getByText('No projects match these filters')
    ).toBeVisible()
    await history.getByRole('button', { name: 'Clear filters' }).click()
    await expect(rows).toHaveCount(Math.min(total, 10))
    await topic.selectOption('caching')
    await expect(rows).toHaveCount(2)
    await search.fill('gCp')
    await expect(rows).toHaveCount(1)
    await expect(rows.first()).toContainText('L3AK CTF 2025 Infra')
    await history.getByRole('button', { name: 'Clear filters' }).click()
    await rows
      .first()
      .getByRole('button', { name: 'react', exact: true })
      .click()
    await expect(topic).toHaveValue('react')
    await expect(rows).toHaveCount(1)
    await rows
      .first()
      .getByRole('button', { name: 'react', exact: true })
      .click()
    await expect(topic).toHaveValue('')
    await expect(rows).toHaveCount(Math.min(total, 10))
    await expect(page.locator('.pin-grid .pin-card')).toHaveCount(
      config.work.length
    )
  })

  test('restores filters on reload and browser history and clamps an out-of-range page', async ({
    page,
  }) => {
    await page.goto(url(`${pagePath('work')}?q=GCP&topic=caching&page=999`))
    const search = page.getByRole('searchbox', { name: 'Search projects' })
    const topic = page.getByRole('combobox', {
      name: 'Filter projects by topic',
    })
    await expect(search).toHaveValue('GCP')
    await expect(topic).toHaveValue('caching')
    await expect(page.locator('.project-list > li')).toHaveCount(1)
    await expect(page).toHaveURL(url(`${pagePath('work')}?q=GCP&topic=caching`))
    await page.reload()
    await expect(search).toHaveValue('GCP')
    await expect(topic).toHaveValue('caching')
    await page
      .getByRole('navigation', { name: 'Sections' })
      .getByRole('link', { name: /^Writing/ })
      .click()
    await page.goBack()
    await expect(search).toHaveValue('GCP')
    await expect(topic).toHaveValue('caching')
    await expect(page.locator('.project-list > li')).toHaveCount(1)
    await page.getByRole('button', { name: 'Clear filters' }).click()
    await expect(page).toHaveURL(url(pagePath('work')))
  })

  test('keeps the filter controls inside narrow viewports', async ({
    page,
  }) => {
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 844 })
      await page
        .getByRole('combobox', { name: 'Filter projects by topic' })
        .selectOption('distributed-systems')
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              document.documentElement.scrollWidth -
              document.documentElement.clientWidth
          )
        )
        .toBe(0)
      await page.getByRole('button', { name: 'Clear filters' }).click()
    }
  })

  for (const theme of ['dark', 'light']) {
    test(`the filtered project history is accessible in ${theme} mode`, async ({
      page,
    }) => {
      if (theme === 'light')
        await page
          .getByRole('button', { name: 'Switch to light theme' })
          .click()
      await page
        .getByRole('combobox', { name: 'Filter projects by topic' })
        .selectOption('caching')
      const { violations } = await new AxeBuilder({ page })
        .include('#work')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
      expect(violations).toEqual([])
    })
  }
})
