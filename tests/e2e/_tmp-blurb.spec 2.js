import { test, expect } from '@playwright/test'
import { url } from './site.js'

test('blurb breaks before "Every job"', async ({ page }) => {
  await page.goto(url())
  const q = page.locator('.readme-body blockquote')
  await expect(q.locator('br')).toHaveCount(1)
  expect(await q.innerHTML()).toContain('<br/>Every job')
})
