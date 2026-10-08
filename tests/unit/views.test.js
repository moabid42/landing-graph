import { describe, expect, it } from 'vitest'
import { BRANCHES, ENTRIES, POINTS, parseTrack } from '../../src/content.js'
import { selectTimeline } from '../../src/timeline/views.js'

describe('timeline views', () => {
  const history = { entries: ENTRIES, branches: BRANCHES, points: POINTS }

  it('reads highlight as an explicit opt-in', () => {
    const entries = parseTrack(
      '## Featured\n- start: 2024-01\n- highlight: true\n\n## Other\n- start: 2024-02\n',
      'work',
      'test.md'
    )
    expect(entries.map((e) => e.highlight)).toEqual([true, false])
  })

  it('includes only featured entries and milestones, while everything keeps them all', () => {
    const highlights = selectTimeline(history, true)
    expect(highlights.entries.map((e) => e.id)).toEqual(
      ENTRIES.filter((e) => e.highlight).map((e) => e.id)
    )
    expect(highlights.points).toEqual(POINTS.filter((p) => p.highlight))
    expect(highlights.entries.length).toBeGreaterThan(0)
    expect(highlights.entries.length).toBeLessThan(ENTRIES.length)
    expect(highlights.points.length).toBeGreaterThan(0)
    expect(selectTimeline(history, false).entries).toEqual(ENTRIES)
  })

  it('routes only visible branches without changing the full history', () => {
    const original = JSON.stringify(history)
    const highlights = selectTimeline(history, true)
    const commits = highlights.branches.flatMap((b) => b.entries)
    expect(commits.map((e) => e.id).sort()).toEqual(
      highlights.entries.map((e) => e.id).sort()
    )
    for (const b of highlights.branches) {
      expect(b.start).toBe(b.entries[0].start)
      for (const e of b.entries) expect(e.lane).toBe(b.lane)
      for (const other of highlights.branches) {
        if (b === other || b.lane !== other.lane) continue
        expect(
          b.start < (other.end ?? Infinity) && (b.end ?? Infinity) > other.start
        ).toBe(false)
      }
    }
    expect(JSON.stringify(history)).toBe(original)
  })

  it('starts a shared branch at its first featured commit and removes empty branches', () => {
    const early = { id: 'early', start: 2020, highlight: false }
    const later = { id: 'later', start: 2024, highlight: true }
    const hidden = { id: 'hidden', start: 2021, highlight: false }
    const view = selectTimeline(
      {
        entries: [early, hidden, later],
        branches: [
          { id: 'shared', start: 2020, end: null, entries: [early, later] },
          { id: 'hidden', start: 2021, end: 2022, entries: [hidden] },
        ],
        points: [],
      },
      true
    )
    expect(view.branches).toHaveLength(1)
    expect(view.branches[0].start).toBe(2024)
    expect(view.branches[0].end).toBeNull()
    expect(view.branches[0].entries.map((e) => e.id)).toEqual(['later'])
  })
})
