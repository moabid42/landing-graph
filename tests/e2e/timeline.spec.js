import { test, expect } from '@playwright/test'
import { url } from './site.js'
import config from '../../site.config.js'

// Scroll so that `el` sits in the middle of the viewport, in one jump and
// without smooth scrolling — the point being to land somewhere without ever
// having passed through the intervening content.
async function jumpTo(page, selector) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel)
    const r = el.getBoundingClientRect()
    window.scrollTo({
      top: window.scrollY + r.top - window.innerHeight / 2,
      behavior: 'instant',
    })
  }, selector)
}

// Cards whose box is currently inside the viewport.
function cardsInViewport(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('.tl-entry')]
      .map((li) => {
        const card = li.querySelector('.tl-card')
        const r = card.getBoundingClientRect()
        return {
          id: li.dataset.id,
          inView: r.bottom > 0 && r.top < window.innerHeight,
          opacity: getComputedStyle(li).opacity,
        }
      })
      .filter((c) => c.inView)
  )
}

test.describe('the timeline graph', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(url())
    await page.locator('.tl-wrap .tl-card').first().waitFor()
  })

  test('draws a card for every entry and a line for every branch', async ({
    page,
  }) => {
    await expect(page.locator('.tl-entry')).not.toHaveCount(0)
    await expect(page.locator('svg.branches path.branch')).not.toHaveCount(0)
    await expect(page.locator('.head-node')).toHaveCount(1)
  })

  test('shows a legend button per track, and the counts add up', async ({
    page,
  }) => {
    const buttons = page.locator('.tl-legend .tl-filter')
    await expect(buttons).toHaveCount(config.tracks.length)

    let total = 0
    for (const [i, track] of config.tracks.entries()) {
      await expect(buttons.nth(i)).toContainText(track.label)
      total += Number(await buttons.nth(i).locator('.counter').innerText())
    }
    expect(total).toBe(await page.locator('.tl-entry').count())
  })

  test('filtering by a track dims every other track', async ({ page }) => {
    const track = config.tracks[0].key
    await page.locator(`.tl-legend .tl-filter.${track}`).click()

    await expect(page.locator(`.tl-entry:not(.dim)`)).not.toHaveCount(0)
    const dimmedOfSameTrack = await page.evaluate((t) => {
      return [...document.querySelectorAll('.tl-entry')].filter((li) => {
        const isTrack = li.querySelector(`.gh-label.${t}`) !== null
        return isTrack && li.classList.contains('dim')
      }).length
    }, track)
    expect(dimmedOfSameTrack).toBe(0)

    // and the branch lines follow the same filter
    await expect(page.locator('svg.branches path.branch.dim')).not.toHaveCount(
      0
    )
  })

  test('clicking the active filter again clears it', async ({ page }) => {
    const button = page.locator('.tl-legend .tl-filter').first()
    await button.click()
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await button.click()
    await expect(button).toHaveAttribute('aria-pressed', 'false')
    await expect(page.locator('.tl-entry.dim')).toHaveCount(0)
  })

  test('parks HEAD below every card, as the tip of the graph', async ({
    page,
  }) => {
    const { headTop, lowestCardBottom } = await page.evaluate(() => {
      const wrap = document.querySelector('.tl-wrap').getBoundingClientRect()
      const head = document.querySelector('.head-node').getBoundingClientRect()
      const bottoms = [...document.querySelectorAll('.tl-entry .tl-card')].map(
        (c) => c.getBoundingClientRect().bottom - wrap.top
      )
      return {
        headTop: head.top - wrap.top,
        lowestCardBottom: Math.max(...bottoms),
      }
    })
    // An entry dated this month would otherwise land its node on the HEAD dot.
    expect(headTop).toBeGreaterThan(lowestCardBottom)
  })

  test('runs every open branch down into HEAD', async ({ page }) => {
    const gaps = await page.evaluate(() => {
      const headY = Number(
        document.querySelector('.head-node').style.top.replace('px', '')
      )
      return [
        ...document.querySelectorAll('svg.branches path.branch.ongoing'),
      ].map((p) => {
        const end = p.getPointAtLength(p.getTotalLength())
        return Math.abs(end.y - headY)
      })
    })
    expect(gaps.length).toBeGreaterThan(0)
    for (const gap of gaps) expect(gap).toBeLessThan(1)
  })

  test('reveals the cards that are on screen when you land mid-timeline', async ({
    page,
  }) => {
    // Regression: the reveal observer used to watch the entry <li>, which is a
    // zero-height box at the top of the timeline rather than the card. Jumping
    // straight to the bottom left every card on screen invisible.
    await jumpTo(page, '.head-node')
    await expect
      .poll(async () => (await cardsInViewport(page)).length)
      .toBeGreaterThan(0)
    await expect
      .poll(async () => {
        const cards = await cardsInViewport(page)
        return cards.filter((c) => c.opacity !== '1').map((c) => c.id)
      })
      .toEqual([])
  })

  test('reveals cards progressively rather than all at once', async ({
    page,
  }) => {
    const revealed = () => page.locator('.tl-entry.revealed').count()
    const atTop = await revealed()
    await jumpTo(page, '.head-node')
    await expect.poll(revealed).toBeGreaterThan(atTop)
  })

  test('keeps the sticky year marker in step with the scroll', async ({
    page,
  }) => {
    await jumpTo(page, '.head-node')
    const year = page.locator('.sticky-year')
    await expect(year).toHaveClass(/visible/)
    await expect(year).toHaveText(/^(now|\d{4})$/)
  })
})
