import { describe, it, expect } from 'vitest'
import { clamp, fmtDate, nowDecimal, sha } from '../../src/Timeline.jsx'
import { parseDate } from '../../src/content.js'

describe('clamp', () => {
  it('holds a value inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
  })

  it('returns the upper bound when the range is inverted', () => {
    // The layout relies on this: a branch too short to hold its node still
    // gets a defined position instead of NaN.
    expect(clamp(5, 10, 0)).toBe(0)
  })
})

describe('fmtDate', () => {
  it('renders a decimal year as MM/YYYY', () => {
    expect(fmtDate(2024 + 0.5 / 12)).toBe('01/2024')
    expect(fmtDate(2024 + 11.5 / 12)).toBe('12/2024')
  })

  it('round-trips every month of parseDate', () => {
    for (let m = 1; m <= 12; m++) {
      const iso = `2023-${String(m).padStart(2, '0')}`
      expect(fmtDate(parseDate(iso))).toBe(`${String(m).padStart(2, '0')}/2023`)
    }
  })

  it('never falls outside months 01..12', () => {
    for (const frac of [0, 0.001, 0.499, 0.5, 0.999]) {
      const month = Number(fmtDate(2024 + frac).slice(0, 2))
      expect(month).toBeGreaterThanOrEqual(1)
      expect(month).toBeLessThanOrEqual(12)
    }
  })
})

describe('sha', () => {
  it('is seven lowercase hex characters', () => {
    expect(sha('anything')).toMatch(/^[0-9a-f]{7}$/)
  })

  it('is deterministic, so a card keeps its sha across reloads', () => {
    expect(sha('work-my-job')).toBe(sha('work-my-job'))
  })

  it('separates different ids', () => {
    expect(sha('a')).not.toBe(sha('b'))
  })

  it('handles an empty string', () => {
    expect(sha('')).toMatch(/^[0-9a-f]{7}$/)
  })
})

describe('nowDecimal', () => {
  it('lands in the current year', () => {
    const now = nowDecimal()
    const year = new Date().getFullYear()
    expect(now).toBeGreaterThanOrEqual(year)
    expect(now).toBeLessThan(year + 1.1)
  })
})
