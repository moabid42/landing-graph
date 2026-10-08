import { expect } from '@playwright/test'

export async function checkTrackDimming(page, entries) {
  const other = page.locator(`${entries}.dim`).first()
  const id = await other.getAttribute('data-id')
  const card = page.locator(`${entries}[data-id="${id}"] .tl-card`)
  await expect
    .poll(() => card.evaluate((el) => Number(getComputedStyle(el).opacity)))
    .toBeLessThan(0.3)
  expect(
    await card.evaluate((el) => Number(getComputedStyle(el).opacity))
  ).toBeGreaterThan(0)
  await expect(page.locator(`${entries}:not(.dim) .tl-card`).first()).toHaveCSS(
    'opacity',
    '1'
  )
  // Faded context is not part of the selected track's accessible list.
  await expect(other).toHaveAttribute('aria-hidden', 'true')
  await expect(card).toHaveAttribute('inert', '')
  await page.locator('.tl-filter[aria-pressed="true"]').click()
  await expect(card).toHaveCSS('opacity', '1')
  await expect(card).not.toHaveAttribute('inert')
  await expect(page.locator(`${entries}[aria-hidden="true"]`)).toHaveCount(0)
}

export async function checkTimelineViews(page, entries, points) {
  const highlights = page.getByRole('button', { name: /^Highlights/ })
  const everything = page.getByRole('button', { name: /^Everything/ })
  await expect(highlights).toHaveAttribute('aria-pressed', 'true')
  await expect(
    page.locator(`${entries} .tl-card h3`, { hasText: 'Decnique' })
  ).toHaveCount(1)
  await expect(
    page.locator(`${entries} .tl-card h3`, { hasText: 'FSTT, MIP' })
  ).toHaveCount(0)
  const selectedIds = await page
    .locator(entries)
    .evaluateAll((items) => items.map((e) => e.dataset.id))
  const selectedPoints = await page.locator(points).count()
  const total = Number(await everything.locator('.counter').innerText())
  expect(total).toBeGreaterThan(selectedIds.length)

  // Switching clears a track focus and remeasures the graph. Use the keyboard
  // too, so these controls stay usable without a pointer.
  await page.locator('.tl-legend .tl-filter').first().click()
  await everything.focus()
  await page.keyboard.press('Enter')
  await expect(everything).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator(entries)).toHaveCount(total)
  await expect(page.locator(`${entries}.dim`)).toHaveCount(0)
  await expect(
    page.locator(`${entries} .tl-card h3`, { hasText: 'FSTT, MIP' })
  ).toHaveCount(1)
  expect(await page.locator(points).count()).toBeGreaterThan(selectedPoints)
  const counts = await page.locator('.tl-legend .counter').allTextContents()
  expect(counts.reduce((sum, count) => sum + Number(count), 0)).toBe(total)

  await highlights.focus()
  await page.keyboard.press('Space')
  await expect(highlights).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator(entries)).toHaveCount(selectedIds.length)
  expect(
    await page
      .locator(entries)
      .evaluateAll((items) => items.map((e) => e.dataset.id))
  ).toEqual(selectedIds)
  await expect(page.locator(points)).toHaveCount(selectedPoints)
}
