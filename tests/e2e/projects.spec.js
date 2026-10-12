import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFileSync } from 'node:fs'
import { parseProjects } from '../../src/projects/parse.js'
import { pagePath } from '../../src/paths.js'
import { url } from './site.js'

const projects = parseProjects(readFileSync('content/projects.md', 'utf8'))
const total = projects.length
const pins = projects.filter((project) => project.pinned)

test.describe('projects', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(url(pagePath('work')))
  })

  test('shows flagged pins and includes every project across the archive pages', async ({
    page,
  }) => {
    await expect(page.locator('.pin-grid .pin-card h3')).toHaveText(
      pins.map((project) => `${project.title}${project.visibility}`)
    )
    await expect(page.locator('.page-facts')).toContainText(`${total} projects`)
    await expect(page.locator('.archive-count')).toHaveText(
      `Showing 1–${Math.min(total, 10)} of ${total}`
    )
    const titles = []
    const next = page.getByRole('button', { name: 'Next project page' })
    let currentPage = 1
    do {
      titles.push(...(await page.locator('.project-list h3').allTextContents()))
      if (!(await next.count()) || (await next.isDisabled())) break
      await next.click()
      currentPage++
      await expect(
        page.locator('.archive-pagination [role="status"]')
      ).toHaveText(`Page ${currentPage} of ${Math.ceil(total / 10)}`)
      await expect(page.locator('.archive-count')).toHaveText(
        `Showing ${(currentPage - 1) * 10 + 1}–${Math.min(currentPage * 10, total)} of ${total}`
      )
    } while (currentPage <= Math.ceil(total / 10))
    expect(titles.sort()).toEqual(
      projects.map((project) => project.title).sort()
    )
    await page
      .getByRole('searchbox', { name: 'Search projects' })
      .fill('redteam-copilot')
    await expect(page.locator('.project-list > li')).toHaveCount(1)
    await expect(page.locator('.project-list .project-date')).toHaveCount(0)
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
    await expect(history.locator('.archive-count')).toHaveText(
      `Showing 1–2 of 2 matches (${total} total)`
    )
    await search.fill('gCp')
    await expect(rows).toHaveCount(1)
    await expect(rows.first()).toContainText('L3AK CTF 2025 Infra')
    await history.getByRole('button', { name: 'Clear filters' }).click()
    await rows
      .filter({ hasText: 'Landing Graph' })
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
    await expect(page.locator('.pin-grid .pin-card')).toHaveCount(pins.length)
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

  test('clears an unsupported bookmarked topic while preserving the project search', async ({
    page,
  }) => {
    await page.goto(
      url(`${pagePath('work')}?q=redteam-copilot&topic=unknown-topic&page=999`)
    )
    await expect(
      page.getByRole('searchbox', { name: 'Search projects' })
    ).toHaveValue('redteam-copilot')
    await expect(
      page.getByRole('combobox', { name: 'Filter projects by topic' })
    ).toHaveValue('')
    await expect(page.locator('.project-list > li')).toHaveCount(1)
    await expect(page.locator('.archive-count')).toHaveText(
      `Showing 1–1 of 1 matches (${total} total)`
    )
    await expect(page).toHaveURL(url(`${pagePath('work')}?q=redteam-copilot`))
    await page.reload()
    await expect(page.locator('.project-list > li')).toHaveCount(1)
    await expect(page.locator('.post-row')).toHaveCount(0)
  })

  test('keeps project and writing collections and filters on their corresponding pages', async ({
    page,
  }) => {
    await page
      .getByRole('combobox', { name: 'Filter projects by topic' })
      .selectOption('caching')
    await expect(page.locator('.post-row')).toHaveCount(0)
    const navigation = page.getByRole('navigation', { name: 'Sections' })
    await navigation.getByRole('link', { name: /^Writing/ }).click()
    await expect(page).toHaveURL(url(pagePath('writing')))
    await expect(
      page.getByRole('combobox', { name: 'Filter writing by topic' })
    ).toHaveValue('')
    await expect(page.locator('.post-row')).not.toHaveCount(0)
    await expect(page.locator('#work')).toHaveCount(0)
    await page.getByRole('searchbox', { name: 'Search writing' }).fill('memory')
    await navigation.getByRole('link', { name: /^Projects/ }).click()
    await expect(page).toHaveURL(url(pagePath('work')))
    await expect(
      page.getByRole('searchbox', { name: 'Search projects' })
    ).toHaveValue('')
    await expect(page.locator('.project-list > li')).toHaveCount(
      Math.min(total, 10)
    )
    await expect(page.locator('.post-row')).toHaveCount(0)
    await page.goBack()
    await expect(
      page.getByRole('searchbox', { name: 'Search writing' })
    ).toHaveValue('memory')
    await expect(page.locator('.post-row')).not.toHaveCount(0)
    await expect(page.locator('#work')).toHaveCount(0)
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
