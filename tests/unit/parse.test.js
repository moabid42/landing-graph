import { describe, it, expect } from 'vitest'
import {
  parseDate,
  slug,
  parseBlocks,
  parseTrack,
  assignSides,
  assignLanes,
} from '../../src/content.js'

describe('parseDate', () => {
  it('reads YYYY-MM as the middle of that month', () => {
    // January is the first twelfth of the year, so its midpoint is 0.5/12.
    expect(parseDate('2024-01')).toBeCloseTo(2024 + 0.5 / 12, 6)
    expect(parseDate('2024-12')).toBeCloseTo(2024 + 11.5 / 12, 6)
  })

  it('defaults a bare year to mid-year', () => {
    expect(parseDate('2024')).toBeCloseTo(2024 + 5.5 / 12, 6)
  })

  it('accepts a single-digit month', () => {
    expect(parseDate('2024-3')).toBeCloseTo(parseDate('2024-03'), 6)
  })

  it('treats "now" and empty as ongoing', () => {
    expect(parseDate('now')).toBeNull()
    expect(parseDate('NOW')).toBeNull()
    expect(parseDate('  now  ')).toBeNull()
    expect(parseDate('')).toBeNull()
    expect(parseDate(undefined)).toBeNull()
  })

  it('rejects garbage and out-of-range months', () => {
    expect(parseDate('last tuesday')).toBeNull()
    expect(parseDate('2024-13')).toBeNull()
    expect(parseDate('2024-00')).toBeNull()
    expect(parseDate('24-03')).toBeNull()
  })

  it('orders chronologically', () => {
    expect(parseDate('2023-06')).toBeLessThan(parseDate('2023-07'))
    expect(parseDate('2023-12')).toBeLessThan(parseDate('2024-01'))
  })
})

describe('slug', () => {
  it('lowercases and joins on single hyphens', () => {
    expect(slug('Your First Talk')).toBe('your-first-talk')
  })

  it('collapses punctuation and trims stray hyphens', () => {
    expect(slug('  C++ / Rust!  ')).toBe('c-rust')
    expect(slug('42 Heilbronn — Arkadia')).toBe('42-heilbronn-arkadia')
  })
})

describe('parseBlocks', () => {
  const md = `# Heading that is not an entry

## First
- org: Somewhere
- start: 2020-01
Body line one.
Body line two.

## Second
- start: 2021-02
Only a body.
`

  it('splits on "## " and keeps fields apart from body', () => {
    const blocks = parseBlocks(md)
    expect(blocks).toHaveLength(2)
    expect(blocks[0].title).toBe('First')
    expect(blocks[0].fields).toEqual({ org: 'Somewhere', start: '2020-01' })
    expect(blocks[0].body).toBe('Body line one. Body line two.')
    expect(blocks[1].title).toBe('Second')
  })

  it('ignores html comments', () => {
    const blocks = parseBlocks(`<!-- ## Commented\n- start: 1999-01\n-->\n## Real\n- start: 2020-01\n`)
    expect(blocks.map((b) => b.title)).toEqual(['Real'])
  })

  it('tolerates a forgotten colon after a field name', () => {
    const [block] = parseBlocks('## T\n- start 2020-01\n')
    expect(block.fields.start).toBe('2020-01')
  })

  it('returns nothing for a file with no entries', () => {
    expect(parseBlocks('# Just a title\n\nSome prose.\n')).toEqual([])
  })
})

describe('parseTrack', () => {
  const one = (md) => parseTrack(md, 'work', 'test.md')[0]

  it('builds an entry with an id derived from track and title', () => {
    const e = one('## My Job\n- org: ACME\n- start: 2020-01\n- end: 2021-01\nDid things.\n')
    expect(e.id).toBe('work-my-job')
    expect(e.track).toBe('work')
    expect(e.org).toBe('ACME')
    expect(e.text).toBe('Did things.')
    expect(e.dropped).toBe(false)
    expect(e.single).toBe(false)
  })

  it('honours an explicit id', () => {
    expect(one('## T\n- id: custom\n- start: 2020-01\n').id).toBe('custom')
  })

  it('leaves end null for an ongoing entry', () => {
    expect(one('## T\n- start: 2020-01\n- end: now\n').end).toBeNull()
    expect(one('## T\n- start: 2020-01\n').end).toBeNull()
  })

  it('marks "(dropped)" ends and still reads the date', () => {
    const e = one('## T\n- start: 2020-01\n- end: 2020-09 (dropped)\n')
    expect(e.dropped).toBe(true)
    expect(e.end).toBeCloseTo(parseDate('2020-09'), 6)
  })

  it('turns "date:" into a single-moment entry with a nominal span', () => {
    const e = one('## Talk\n- date: 2024-05\n')
    expect(e.single).toBe(true)
    expect(e.end - e.start).toBeCloseTo(0.2, 6)
  })

  it('collapses a range of a month or less into a single moment', () => {
    const e = one('## T\n- start: 2024-05\n- end: 2024-05\n')
    expect(e.single).toBe(true)
    expect(e.end - e.start).toBeCloseTo(0.2, 6)
  })

  it('skips an entry whose end precedes its start', () => {
    expect(parseTrack('## T\n- start: 2024-05\n- end: 2020-01\n', 'work', 'f.md')).toEqual([])
  })

  it('skips an entry with no start at all', () => {
    expect(parseTrack('## T\n- org: ACME\n', 'work', 'f.md')).toEqual([])
  })

  it('reads part-time and full-time, and drops anything else', () => {
    expect(one('## T\n- start: 2020-01\n- time: part-time\n').time).toBe('part')
    expect(one('## T\n- start: 2020-01\n- time: full-time\n').time).toBe('full')
    expect(one('## T\n- start: 2020-01\n- time: sometimes\n').time).toBeNull()
    expect(one('## T\n- start: 2020-01\n').time).toBeNull()
  })

  it('keeps only http(s) links', () => {
    expect(one('## T\n- start: 2020-01\n- link: https://x.dev\n').link).toBe('https://x.dev')
    expect(one('## T\n- start: 2020-01\n- link: not a url\n').link).toBeNull()
  })

  it('renders topics as a middot-separated string', () => {
    expect(one('## T\n- start: 2020-01\n- topics: a, b ,c\n').meta).toBe('a · b · c')
    expect(one('## T\n- start: 2020-01\n').meta).toBe('')
  })
})

describe('assignSides', () => {
  const branch = (start, end, n = 1) => ({
    start,
    end,
    entries: Array.from({ length: n }, (_, i) => ({ id: `${start}-${i}` })),
  })

  it('puts every branch on one side or the other', () => {
    const branches = [branch(2020, 2021), branch(2020.5, 2022), branch(2023, null)]
    assignSides(branches)
    for (const b of branches) expect([-1, 1]).toContain(b.side)
  })

  it('splits two branches that overlap in time', () => {
    const branches = [branch(2020, 2024), branch(2021, 2023)]
    assignSides(branches)
    expect(branches[0].side).not.toBe(branches[1].side)
  })

  it('keeps the two columns close in total load', () => {
    const branches = Array.from({ length: 8 }, (_, i) => branch(2010 + i, 2030))
    assignSides(branches)
    const load = (s) =>
      branches.filter((b) => b.side === s).reduce((n, b) => n + b.entries.length, 0)
    expect(Math.abs(load(-1) - load(1))).toBeLessThanOrEqual(1)
  })
})

describe('assignLanes', () => {
  const branch = (start, end, side) => ({ start, end, side, entries: [{}] })

  it('gives overlapping branches on one side different lanes', () => {
    const branches = [
      branch(2020, 2025, 1),
      branch(2021, 2024, 1),
      branch(2022, 2023, 1),
    ]
    assignLanes(branches)
    expect(new Set(branches.map((b) => b.lane)).size).toBe(3)
  })

  it('reuses a lane once a branch has merged back', () => {
    const branches = [branch(2020, 2021, 1), branch(2022, 2023, 1)]
    assignLanes(branches)
    expect(branches[0].lane).toBe(branches[1].lane)
  })

  it('signs the lane by side, and never uses lane 0 (the trunk)', () => {
    const branches = [branch(2020, 2021, 1), branch(2020, 2021, -1)]
    assignLanes(branches)
    expect(branches[0].lane).toBeGreaterThan(0)
    expect(branches[1].lane).toBeLessThan(0)
  })

  it('keeps an ongoing branch holding its lane forever', () => {
    const branches = [branch(2020, null, 1), branch(2030, 2031, 1)]
    assignLanes(branches)
    expect(branches[0].lane).not.toBe(branches[1].lane)
  })
})
