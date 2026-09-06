import { describe, it, expect } from 'vitest'
import {
  buildScale,
  BREAK_PX,
  MIN_MONTH_PX,
  PAD_TOP,
  YEAR_PX,
} from '../../src/timeline/scale.js'

// The vertical scale is the most intricate arithmetic in the project and the
// place both shipped layout bugs lived. It is pure, so it can be pinned here
// against hand-built content instead of only through a browser.

const entry = (start, end = null) => ({ start, end })
const scale = (opts) =>
  buildScale({ now: 2024.5, entries: [], points: [], ...opts })

describe('buildScale', () => {
  it('starts at the earliest dated thing', () => {
    const s = scale({ entries: [entry(2015.5, 2016.5), entry(2020.5)] })
    expect(s.startYear).toBe(2015)
  })

  it('lets a tag set the start when it predates every entry', () => {
    const s = scale({ entries: [entry(2020.5)], points: [{ at: 2011.2 }] })
    expect(s.startYear).toBe(2011)
  })

  it('pads the top so the first card is not flush with the edge', () => {
    const s = scale({ entries: [entry(2020.5)] })
    expect(s.y(2020)).toBeGreaterThanOrEqual(PAD_TOP)
  })

  it('runs strictly downwards as time moves forwards', () => {
    const s = scale({ entries: [entry(2018.5, 2019.5), entry(2022.1)] })
    let prev = -Infinity
    for (let d = 2018; d <= 2024.5; d += 0.05) {
      const y = s.y(d)
      expect(y, `y(${d.toFixed(2)}) went backwards`).toBeGreaterThanOrEqual(
        prev
      )
      prev = y
    }
  })

  it('never returns NaN, even outside the content range', () => {
    const s = scale({ entries: [entry(2020.5, 2021.5)] })
    for (const d of [1900, 2019, 2020.5, 2024.5, 2100]) {
      expect(Number.isFinite(s.y(d)), `y(${d})`).toBe(true)
    }
  })

  describe('empty years', () => {
    it('collapses a gap into one break instead of one per year', () => {
      // 2010 active, nothing until 2020: nine dead years in between.
      const s = scale({ entries: [entry(2010.5, 2010.9), entry(2020.5)] })
      expect(s.breaks).toHaveLength(1)
      expect(s.breaks[0]).toEqual({ from: 2011, to: 2019 })
    })

    it('spends only BREAK_PX on that gap, not nine years of pixels', () => {
      const s = scale({ entries: [entry(2010.5, 2010.9), entry(2020.5)] })
      const gap = s.y(2020) - s.y(2011)
      expect(gap).toBeCloseTo(BREAK_PX, 0)
      expect(gap).toBeLessThan(YEAR_PX)
    })

    it('reports no breaks when every year carries something', () => {
      const s = scale({ entries: [entry(2021.5, 2024.4)] })
      expect(s.breaks).toEqual([])
    })

    it('keeps an ongoing entry alive through the years it spans', () => {
      // A job running 2015 to now leaves no gap behind it.
      const s = scale({ entries: [entry(2015.5)] })
      expect(s.breaks).toEqual([])
    })

    it('lists only the years that are actually drawn', () => {
      const s = scale({ entries: [entry(2010.5, 2010.9), entry(2020.5)] })
      expect(s.years).not.toContain(2015)
      expect(s.years).toContain(2010)
      expect(s.years).toContain(2020)
    })
  })

  describe('density', () => {
    it('gives a month with tall cards more room than an empty one', () => {
      const entries = [entry(2022.04), entry(2022.96)]
      const flat = scale({ entries })
      const busy = scale({ entries, density: { [2022 * 12 + 0]: 600 } })
      // January grew, so everything after it moved down
      expect(busy.y(2023) - busy.y(2022)).toBeGreaterThan(
        flat.y(2023) - flat.y(2022)
      )
    })

    it('never shrinks a month below the floor', () => {
      const s = scale({
        entries: [entry(2022.5)],
        density: { [2022 * 12 + 3]: 1 },
      })
      const april = s.y(2022 + 4 / 12) - s.y(2022 + 3 / 12)
      expect(april).toBeGreaterThanOrEqual(MIN_MONTH_PX - 0.001)
    })

    it('advances time inside a month at the floor slope only', () => {
      // A tall month belongs to the cards starting in it, which hang below
      // their own date — time itself must not stretch to fill the space.
      const s = scale({
        entries: [entry(2022.04)],
        density: { [2022 * 12 + 0]: 800 },
      })
      const acrossJanuary = s.y(2022 + 0.99 / 12) - s.y(2022)
      expect(acrossJanuary).toBeLessThanOrEqual(MIN_MONTH_PX + 0.001)
    })
  })

  describe('invY', () => {
    it('inverts y across the whole range', () => {
      const s = scale({ entries: [entry(2018.5, 2020.5), entry(2022.3)] })
      for (const d of [2019.1, 2020.0, 2022.5, 2023.7]) {
        expect(s.invY(s.y(d)), `round trip at ${d}`).toBeCloseTo(d, 1)
      }
    })

    it('survives a pixel above the top of the graph', () => {
      const s = scale({ entries: [entry(2020.5)] })
      expect(Number.isFinite(s.invY(0))).toBe(true)
    })

    it('keeps rising as pixels increase', () => {
      const s = scale({ entries: [entry(2018.5, 2021.5)] })
      let prev = -Infinity
      for (let px = 0; px < 2000; px += 50) {
        const d = s.invY(px)
        expect(d).toBeGreaterThanOrEqual(prev)
        prev = d
      }
    })
  })

  it('handles a single entry without dividing by zero', () => {
    const s = scale({ entries: [entry(2024.2, 2024.4)] })
    expect(Number.isFinite(s.y(2024.3))).toBe(true)
    expect(Number.isFinite(s.invY(100))).toBe(true)
  })
})
