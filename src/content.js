// Timeline content is authored in content/timeline/*.md — one file per
// track, plus tags.md for point events. This module parses them into the
// shapes the Timeline renders. Editing a markdown file is all it takes to
// add or remove an entry; dates sort and branch lanes assign automatically.
//
// Which tracks exist, what they are called and what color they run in is
// site.config.js. Nothing here is hardcoded to a particular track.
import config from '../site.config.js'
import {
  TRACK_SOURCES,
  TAGS_SOURCE,
  TAGS_FILE,
  trackFile,
} from './loadContent.js'

// Legend shape, in config order. Carries the colors too, so the renderer
// can publish them as CSS variables instead of a stylesheet naming tracks.
export const TRACKS = Object.fromEntries(
  config.tracks.map((t) => [
    t.key,
    {
      label: t.label ?? t.key,
      color: t.color,
      colorLight: t.colorLight ?? t.color,
    },
  ])
)

// Tracks whose entries ride ONE shared branch: a running thread that forks
// at the first entry and stays open until now (each entry is a commit on it).
const CONTINUOUS = new Set(
  config.tracks.filter((t) => t.continuous).map((t) => t.key)
)

// Minimum clearance (in years) before a branch lane is reused, so a
// merge-back curve never blends into the next branch-out in the same lane.
const LANE_CLEARANCE = 0.05

// Parse problems that would otherwise be silent skips. The Timeline
// renders these in a warning banner so a typo in a content file is
// impossible to miss.
export const PROBLEMS = []
const problem = (file, title, msg) => {
  PROBLEMS.push({ file, title, msg })
  console.warn(`[content] ${file} · ${title}: ${msg}`)
}

// "YYYY-MM" -> decimal year (mid-month); "now" -> null (ongoing).
// Anything else is reported instead of silently misparsing.
function parseDate(s, ctx, field) {
  if (!s || s.trim().toLowerCase() === 'now') return null
  const m = s.trim().match(/^(\d{4})(?:-(\d{1,2}))?$/)
  if (!m) {
    if (ctx) problem(ctx.file, ctx.title, `unreadable ${field} "${s}" — use YYYY-MM or "now"`)
    return null
  }
  const mo = m[2] ? +m[2] : 6
  if (mo < 1 || mo > 12) {
    if (ctx) problem(ctx.file, ctx.title, `bad month in ${field} "${s}"`)
    return null
  }
  return +m[1] + (mo - 0.5) / 12
}

// A track configured with no file, or a file with no configured track, is
// a typo either way — both are silent no-ops otherwise.
for (const t of config.tracks)
  if (!(t.key in TRACK_SOURCES))
    problem(trackFile(t.key), t.key, 'track is configured but the file is missing')
for (const key of Object.keys(TRACK_SOURCES))
  if (!config.tracks.some((t) => t.key === key))
    problem(trackFile(key), key, 'file has no track in site.config.js — not rendered')

const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// Split a markdown file into "## Title" blocks with `- key: value` fields
// and a free-text body.
function parseBlocks(md) {
  const src = md.replace(/<!--[\s\S]*?-->/g, '')
  return src
    .split(/\n(?=## )/)
    .filter((b) => b.trim().startsWith('## '))
    .map((b) => {
      const lines = b.trim().split('\n')
      const title = lines[0].replace(/^## /, '').trim()
      const fields = {}
      const body = []
      for (const ln of lines.slice(1)) {
        // tolerate a forgotten colon after the field name
        const m = ln.match(/^- *([a-z]+):? *(.+)$/)
        if (m) fields[m[1]] = m[2].trim()
        else if (ln.trim() && !ln.startsWith('#')) body.push(ln.trim())
      }
      return { title, fields, body: body.join(' ') }
    })
}

function parseTrack(md, track, file) {
  return parseBlocks(md)
    .map(({ title, fields, body }) => {
      const ctx = { file, title }
      // "date: YYYY-MM" -> single-date event (a talk, a competition):
      // one moment instead of a start/end range
      let single = 'date' in fields && !fields.start
      if ('date' in fields && fields.start)
        problem(file, title, 'has both "start" and "date" — using "start"')
      const rawStart = fields.start || fields.date
      const start = parseDate(rawStart, ctx, single ? 'date' : 'start')
      if (start === null) {
        if (!rawStart)
          problem(file, title, 'missing "start" (or "date") — entry skipped')
        else if (rawStart.trim().toLowerCase() === 'now')
          problem(file, title, `"${single ? 'date' : 'start'}: now" is not a date — entry skipped`)
        else problem(file, title, 'entry skipped')
        return null
      }
      let end = null
      let dropped = false
      if (single) {
        if (fields.end)
          problem(file, title, '"date" entries take no "end" — ignored')
        end = start + 0.2 // nominal span so the branch forks and merges back
      } else {
        // "end: YYYY-MM (dropped)" -> closed without merging
        const endRaw = fields.end || ''
        dropped = /\(dropped\)/i.test(endRaw)
        end = parseDate(endRaw.replace(/\(dropped\)/i, '').trim(), ctx, 'end')
        if (end !== null && end < start) {
          problem(file, title, `"end" (${fields.end}) is before "start" (${fields.start}) — entry skipped`)
          return null
        }
        // a range of a month or less reads as one moment: show a single
        // date and draw the clean short arc instead of a squashed loop
        if (end !== null && end - start < 0.1) {
          single = true
          end = start + 0.2
        }
      }
      // optional "time: part-time | full-time" -> colored chip on the card
      const timeRaw = (fields.time || '').toLowerCase()
      const time = /part/.test(timeRaw)
        ? 'part'
        : /full/.test(timeRaw)
          ? 'full'
          : null
      if (fields.time && !time)
        problem(file, title, `unknown time "${fields.time}" — use part-time or full-time`)
      // optional "link: https://…" -> Learn more button on the card
      const link = fields.link || null
      if (link && !/^https?:\/\//.test(link))
        problem(file, title, `link "${link}" is not an http(s) URL — ignored`)
      return {
        id: fields.id || slug(`${track}-${title}`),
        track,
        title,
        org: fields.org || '',
        start,
        end,
        dropped,
        single,
        time,
        link: link && /^https?:\/\//.test(link) ? link : null,
        text: body,
        meta: fields.topics
          ? fields.topics.split(',').map((t) => t.trim()).join(' · ')
          : '',
      }
    })
    .filter(Boolean)
}

// Sides are chosen dynamically, not per track: walking branches in date
// order, each one lands on the side carrying the least overlapping card
// load, so both columns stay busy no matter how the content shifts.
function assignSides(branches) {
  const placed = []
  for (const b of branches) {
    const load = (side) =>
      placed.reduce(
        (s, o) =>
          o.side === side &&
          o.start < (b.end ?? Infinity) &&
          (o.end ?? Infinity) > b.start
            ? s + o.entries.length
            : s,
        0
      )
    const total = (side) =>
      placed.reduce((s, o) => (o.side === side ? s + o.entries.length : s), 0)
    const l = load(-1)
    const r = load(1)
    b.side = l !== r ? (l < r ? -1 : 1) : total(1) <= total(-1) ? 1 : -1
    placed.push(b)
  }
}

// Greedy interval coloring per side: first free lane wins, so concurrent
// branches fan out and lanes are reclaimed once a branch has merged back.
function assignLanes(branches) {
  for (const side of [-1, 1]) {
    const list = branches
      .filter((b) => b.side === side)
      .sort((a, b) => a.start - b.start)
    const laneBusyUntil = []
    for (const b of list) {
      let lane = laneBusyUntil.findIndex((t) => t + LANE_CLEARANCE <= b.start)
      if (lane === -1) lane = laneBusyUntil.length
      laneBusyUntil[lane] = b.end ?? Infinity
      b.lane = (lane + 1) * side
    }
  }
}

const allEntries = config.tracks
  .filter((t) => t.key in TRACK_SOURCES)
  .flatMap((t) => parseTrack(TRACK_SOURCES[t.key], t.key, trackFile(t.key)))
  .sort((a, b) => a.start - b.start)

// One branch per entry, except CONTINUOUS tracks, whose entries share a
// single branch that forks at the first one and stays open until now.
export const BRANCHES = []
{
  const shared = {}
  for (const e of allEntries) {
    if (CONTINUOUS.has(e.track)) {
      let b = shared[e.track]
      if (!b) {
        b = {
          id: 'branch-' + e.track,
          track: e.track,
          start: e.start,
          end: null,
          entries: [],
        }
        shared[e.track] = b
        BRANCHES.push(b)
      }
      b.entries.push(e)
      e.branch = b.id
    } else {
      BRANCHES.push({
        id: e.id,
        track: e.track,
        start: e.start,
        end: e.end,
        entries: [e],
      })
      e.branch = e.id
    }
  }
  BRANCHES.sort((a, b) => a.start - b.start)
  assignSides(BRANCHES)
  assignLanes(BRANCHES)
  for (const b of BRANCHES) for (const e of b.entries) e.lane = b.lane
}

export const ENTRIES = allEntries

export const POINTS = parseBlocks(TAGS_SOURCE)
  .map(({ title, fields }) => {
    const at = parseDate(fields.date, { file: TAGS_FILE, title }, 'date')
    if (at === null) {
      if (!fields.date)
        problem(TAGS_FILE, title, 'missing "date" — tag skipped')
      return null
    }
    return { id: slug(title), at, label: title }
  })
  .filter(Boolean)
