import { describe, it, expect, beforeEach } from 'vitest'
import { parseTrack, parseDate, PROBLEMS } from '../../src/content.js'

// Bad content must never fail silently: every skip or ignore is recorded in
// PROBLEMS, which the timeline renders as a warning banner above the graph.
// These tests pin the messages a fork will actually see.

const msgs = () => PROBLEMS.map((p) => p.msg)

describe('reported problems', () => {
  beforeEach(() => {
    PROBLEMS.length = 0
  })

  it('records the file and title alongside every message', () => {
    parseTrack('## Broken\n- start: yesterday\n', 'work', 'content/work.md')
    // Two messages: the date is unreadable, and so the entry is skipped.
    expect(PROBLEMS).toHaveLength(2)
    for (const p of PROBLEMS) {
      expect(p.file).toBe('content/work.md')
      expect(p.title).toBe('Broken')
      expect(p.msg).toBeTruthy()
    }
    expect(msgs()[1]).toBe('entry skipped')
  })

  it('names an unreadable date and says what the format is', () => {
    parseDate('yesterday', { file: 'f.md', title: 'T' }, 'start')
    expect(msgs()[0]).toMatch(/unreadable start "yesterday"/)
    expect(msgs()[0]).toMatch(/YYYY-MM/)
  })

  it('names a month outside 1..12', () => {
    parseDate('2024-13', { file: 'f.md', title: 'T' }, 'end')
    expect(msgs()[0]).toMatch(/bad month in end/)
  })

  it('stays quiet when no context is passed', () => {
    parseDate('nonsense')
    expect(PROBLEMS).toEqual([])
  })

  it('flags a missing start', () => {
    parseTrack('## T\n- org: ACME\n', 'work', 'f.md')
    expect(msgs()[0]).toMatch(/missing "start"/)
  })

  it('flags "start: now", which has no date to place the entry at', () => {
    parseTrack('## T\n- start: now\n', 'work', 'f.md')
    expect(msgs()[0]).toMatch(/"start: now" is not a date/)
  })

  it('flags "date: now" with the field name the author used', () => {
    parseTrack('## T\n- date: now\n', 'work', 'f.md')
    expect(msgs()[0]).toMatch(/"date: now" is not a date/)
  })

  it('flags an entry carrying both start and date, and keeps start', () => {
    const [e] = parseTrack(
      '## T\n- start: 2020-01\n- date: 2022-01\n',
      'work',
      'f.md'
    )
    expect(msgs()[0]).toMatch(/has both "start" and "date" — using "start"/)
    expect(e.start).toBeCloseTo(parseDate('2020-01'), 6)
    expect(e.single).toBe(false)
  })

  it('flags an "end" on a single-date entry and ignores it', () => {
    const [e] = parseTrack(
      '## T\n- date: 2020-01\n- end: 2021-01\n',
      'work',
      'f.md'
    )
    expect(msgs()[0]).toMatch(/"date" entries take no "end"/)
    expect(e.end - e.start).toBeCloseTo(0.2, 6)
  })

  it('flags an end before the start and drops the entry', () => {
    const out = parseTrack(
      '## T\n- start: 2024-01\n- end: 2020-01\n',
      'work',
      'f.md'
    )
    expect(out).toEqual([])
    expect(msgs().join(' ')).toMatch(/is before "start"/)
  })

  it('flags an unknown time value', () => {
    parseTrack('## T\n- start: 2020-01\n- time: weekends\n', 'work', 'f.md')
    expect(msgs()[0]).toMatch(/unknown time "weekends"/)
  })

  it('flags a link that is not an http url', () => {
    parseTrack('## T\n- start: 2020-01\n- link: mailto:a@b.c\n', 'work', 'f.md')
    expect(msgs()[0]).toMatch(/is not an http\(s\) URL/)
  })

  it('flags an unreadable end date but keeps the entry open', () => {
    const [e] = parseTrack(
      '## T\n- start: 2020-01\n- end: whenever\n',
      'work',
      'f.md'
    )
    expect(msgs()[0]).toMatch(/unreadable end/)
    expect(e.end).toBeNull()
  })
})
