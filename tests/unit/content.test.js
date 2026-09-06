import { describe, it, expect } from 'vitest'
import config from '../../site.config.js'
import {
  TRACKS,
  ENTRIES,
  BRANCHES,
  POINTS,
  PROBLEMS,
} from '../../src/content.js'

// These run against whatever is actually in content/, so they double as a
// content lint: a typo in a markdown file fails the build here, not silently
// in the browser.

describe('shipped content', () => {
  it('parses with no problems', () => {
    // PROBLEMS is what the warning banner renders. It must be empty on main.
    expect(PROBLEMS).toEqual([])
  })

  it('produces entries and tags', () => {
    expect(ENTRIES.length).toBeGreaterThan(0)
    expect(POINTS.length).toBeGreaterThan(0)
  })
})

describe('TRACKS', () => {
  it('mirrors site.config.js, in order', () => {
    expect(Object.keys(TRACKS)).toEqual(config.tracks.map((t) => t.key))
  })

  it('carries a label and both palettes for every track', () => {
    for (const [key, t] of Object.entries(TRACKS)) {
      expect(t.label, key).toBeTruthy()
      expect(t.color, key).toMatch(/^#[0-9a-f]{3,8}$/i)
      expect(t.colorLight, key).toMatch(/^#[0-9a-f]{3,8}$/i)
    }
  })
})

describe('ENTRIES', () => {
  it('are sorted by start date', () => {
    const starts = ENTRIES.map((e) => e.start)
    expect(starts).toEqual([...starts].sort((a, b) => a - b))
  })

  it('have unique ids', () => {
    const ids = ENTRIES.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('only use tracks declared in the config', () => {
    for (const e of ENTRIES) expect(Object.keys(TRACKS)).toContain(e.track)
  })

  it('never end before they start', () => {
    for (const e of ENTRIES) {
      if (e.end !== null) expect(e.end, e.id).toBeGreaterThanOrEqual(e.start)
    }
  })

  it('carry the title and body the card renders', () => {
    for (const e of ENTRIES) {
      expect(e.title, e.id).toBeTruthy()
      expect(typeof e.text, e.id).toBe('string')
    }
  })
})

describe('BRANCHES', () => {
  it('account for every entry exactly once', () => {
    const onBranches = BRANCHES.flatMap((b) =>
      b.entries.map((e) => e.id)
    ).sort()
    expect(onBranches).toEqual(ENTRIES.map((e) => e.id).sort())
  })

  it('give each entry a back-reference to its branch', () => {
    for (const b of BRANCHES) {
      for (const e of b.entries) expect(e.branch, e.id).toBe(b.id)
    }
  })

  it('put a continuous track on exactly one shared branch', () => {
    const continuous = config.tracks.filter((t) => t.continuous)
    for (const t of continuous) {
      const mine = BRANCHES.filter((b) => b.track === t.key)
      const entries = ENTRIES.filter((e) => e.track === t.key)
      if (entries.length === 0) continue
      expect(mine, t.key).toHaveLength(1)
      expect(mine[0].entries.length, t.key).toBe(entries.length)
      // a running thread stays open, so the graph can merge it into HEAD
      expect(mine[0].end, t.key).toBeNull()
    }
  })

  it('give every entry of a normal track its own branch', () => {
    const normal = config.tracks.filter((t) => !t.continuous).map((t) => t.key)
    for (const key of normal) {
      const mine = BRANCHES.filter((b) => b.track === key)
      const entries = ENTRIES.filter((e) => e.track === key)
      expect(mine.length, key).toBe(entries.length)
    }
  })

  it('are sorted by start date', () => {
    const starts = BRANCHES.map((b) => b.start)
    expect(starts).toEqual([...starts].sort((a, b) => a - b))
  })

  it('never put two overlapping branches in the same lane', () => {
    for (const a of BRANCHES) {
      for (const b of BRANCHES) {
        if (a === b || a.lane !== b.lane) continue
        const overlap =
          a.start < (b.end ?? Infinity) && (a.end ?? Infinity) > b.start
        expect(overlap, `${a.id} and ${b.id} share lane ${a.lane}`).toBe(false)
      }
    }
  })

  it('never sit on the trunk itself', () => {
    for (const b of BRANCHES) expect(b.lane, b.id).not.toBe(0)
  })

  it('agree with their entries about which lane they are in', () => {
    for (const b of BRANCHES) {
      for (const e of b.entries) expect(e.lane, e.id).toBe(b.lane)
    }
  })
})

describe('POINTS', () => {
  it('have an id, a label and a date', () => {
    for (const p of POINTS) {
      expect(p.id).toBeTruthy()
      expect(p.label).toBeTruthy()
      expect(Number.isFinite(p.at), p.id).toBe(true)
    }
  })

  it('have unique ids', () => {
    const ids = POINTS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
