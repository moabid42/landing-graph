import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { BRANCHES, ENTRIES, POINTS, PROBLEMS, TRACKS } from './content.js'

const BRANCH_OF = Object.fromEntries(
  BRANCHES.flatMap((b) => b.entries.map((e) => [e.id, b]))
)
import { IconMerge, IconIssueOpen, IconTag, IconClosed } from './icons.jsx'

// Track colors live in site.config.js, not in a stylesheet. Publishing them
// as CSS variables is what lets a new track be one config line: the rules in
// styles.css all read var(--tl-c), and each element points --tl-c at its own
// track. Both themes are emitted up front so a theme flip is pure CSS.
const TRACK_CSS =
  ':root{' +
  Object.entries(TRACKS)
    .map(([k, t]) => `--tl-track-${k}:${t.color};`)
    .join('') +
  "}html[data-theme='light']{" +
  Object.entries(TRACKS)
    .map(([k, t]) => `--tl-track-${k}:${t.colorLight};`)
    .join('') +
  '}'

// Every element that carries a track class also carries its color.
const trackVar = (track) => ({ '--tl-c': `var(--tl-track-${track})` })

const CV = 44 // curve length of a branch-out / merge-in join, px
const HEAD_GAP = 72 // clearance kept under the lowest card before HEAD
const BREAK_PX = 56 // total height a run of empty years collapses to

export function nowDecimal() {
  const d = new Date()
  return d.getFullYear() + (d.getMonth() + d.getDate() / 30) / 12
}

// decimal year -> "MM/YYYY"
export function fmtDate(y) {
  const yr = Math.floor(y)
  const m = Math.min(12, Math.max(1, Math.round((y - yr) * 12 + 0.5)))
  return String(m).padStart(2, '0') + '/' + yr
}

// deterministic fake short-sha per entry (FNV-1a)
export function sha(s) {
  let h = 0x811c9dc5
  for (const c of s) {
    h ^= c.charCodeAt(0)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7)
}

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

function useReducedMotion() {
  return useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )
}

function Card({ e, ended, cardRef, style }) {
  return (
    <article className="tl-card" ref={cardRef} style={style}>
      <p className="tl-meta">
        <span className="sha">{sha(e.id)}</span>
        <span className="dates">
          {e.single
            ? fmtDate(e.start)
            : `${fmtDate(e.start)} — ${e.end ? fmtDate(e.end) : 'now'}`}
        </span>
        {e.link && (
          <a
            className="tl-more"
            href={e.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn more <span aria-hidden="true">↗</span>
          </a>
        )}
      </p>
      <h3>{e.title}</h3>
      <p className="org">{e.org}</p>
      <p className="txt">{e.text}</p>
      <div className="tl-labels">
        <span
          className={`state ${e.dropped ? 'dropped' : ended ? 'merged' : 'open'}`}
        >
          {e.dropped ? (
            <IconClosed width={12} height={12} />
          ) : ended ? (
            <IconMerge width={12} height={12} />
          ) : (
            <IconIssueOpen width={12} height={12} />
          )}
          {e.dropped ? 'Dropped' : ended ? 'Merged' : 'Open'}
        </span>
        <span className={`gh-label ${e.track}`} style={trackVar(e.track)}>
          {e.track}
        </span>
        {e.time && (
          <span className={`worktime ${e.time}`}>
            {e.time === 'part' ? 'part-time' : 'full-time'}
          </span>
        )}
        {e.meta &&
          e.meta.split(' · ').map((t, i) => (
            <span key={`${t}-${i}`} className="topic">
              {t}
            </span>
          ))}
      </div>
    </article>
  )
}

export default function Timeline() {
  const [filter, setFilter] = useState(null)
  const [mobile, setMobile] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 699px)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 699px)')
    const on = (e) => setMobile(e.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  if (typeof window === 'undefined') return null

  const counts = ENTRIES.reduce((m, e) => {
    m[e.track] = (m[e.track] || 0) + 1
    return m
  }, {})

  return (
    <>
      <style>{TRACK_CSS}</style>
      {PROBLEMS.length > 0 && (
        <div className="tl-problems" role="alert">
          <strong>
            ⚠ content warnings — some entries may be missing below
          </strong>
          <ul>
            {PROBLEMS.map((p, i) => (
              <li key={i}>
                <code>{p.file}</code> · {p.title}: {p.msg}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div
        className="tl-legend"
        role="group"
        aria-label="Filter timeline by track"
      >
        {Object.entries(TRACKS).map(([key, t]) => (
          <button
            key={key}
            className={`tl-filter ${key}`}
            aria-pressed={filter === key}
            onClick={() => setFilter(filter === key ? null : key)}
          >
            <span
              className={`swatch ${key}`}
              style={trackVar(key)}
              aria-hidden="true"
            />
            {t.label}
            <span className="counter">{counts[key] || 0}</span>
          </button>
        ))}
      </div>
      {mobile ? (
        <MobileTimeline filter={filter} />
      ) : (
        <DesktopTimeline filter={filter} />
      )}
    </>
  )
}

/* =====================================================================
   Mobile: git-log flow. Real `git log --graph` output is narrow and
   ordinal — one column, commits in order, spacing by entry rather than
   elapsed time. Trunk in a left gutter; each entry forks off the trunk
   at its card, and its branch line keeps running through the following
   rows until the row where its END date falls — so concurrent chapters
   visibly overlap, like parallel branches in real git log. Year pills
   and "···" time-skips sit inline on the trunk; HEAD closes the log.
   ===================================================================== */
const M_TRUNK = 20 // trunk x
const M_LANE0 = 28 // first branch lane x
const M_LANE_W = 9 // px between branch lanes
const M_CV = 16 // curve length of mobile fork/merge joins

function MobileTimeline({ filter }) {
  const wrapRef = useRef(null)
  const fillRef = useRef(null)
  const headRef = useRef(null)
  const rowRefs = useRef({})
  const [graph, setGraph] = useState(null)
  const [revealed, setRevealed] = useState(() => new Set())
  const reduced = useReducedMotion()
  const NOW = useMemo(nowDecimal, [])

  const rows = useMemo(() => {
    const items = [
      ...ENTRIES.map((e) => ({ kind: 'entry', key: e.id, at: e.start, e })),
      ...POINTS.map((p) => ({ kind: 'point', key: p.id, at: p.at, p })),
    ].sort((a, b) => a.at - b.at)
    const out = []
    let prevYear = null
    for (const it of items) {
      const yr = Math.floor(it.at)
      if (yr !== prevYear) {
        if (prevYear !== null && yr > prevYear + 1)
          out.push({
            kind: 'skip',
            key: 'skip' + yr,
            from: prevYear + 1,
            to: yr - 1,
          })
        out.push({ kind: 'year', key: 'year' + yr, yr })
        prevYear = yr
      }
      out.push(it)
    }
    return out
  }, [NOW]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- measure rows, map dates to pixel positions, route branches ----
     Anchors (row, date) pairs give a piecewise date→y function; each
     branch then spans from its card down to y(end), reusing the same
     greedy lane assignment idea as the desktop graph. */
  useLayoutEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    let raf = 0
    const compute = () => {
      const head = headRef.current
      if (!head) return
      const headY = head.offsetTop + head.offsetHeight / 2
      const anchors = [[NOW, headY]]
      for (const row of rows) {
        const el = rowRefs.current[row.key]
        if (!el) continue
        if (row.kind === 'year')
          anchors.push([row.yr, el.offsetTop + el.offsetHeight / 2])
        else if (row.kind === 'skip') {
          anchors.push([row.from, el.offsetTop])
          anchors.push([row.to + 1, el.offsetTop + el.offsetHeight])
        } else if (row.kind === 'point')
          anchors.push([row.at, el.offsetTop + el.offsetHeight / 2])
        else anchors.push([row.at, el.offsetTop + 12])
      }
      anchors.sort((a, b) => a[0] - b[0])
      const A = []
      for (const [d, ay] of anchors) {
        if (A.length && d - A[A.length - 1][0] < 1 / 24) continue
        A.push([d, Math.max(ay, A.length ? A[A.length - 1][1] + 2 : ay)])
      }
      const dateToY = (d) => {
        if (d <= A[0][0]) return A[0][1]
        for (let i = 1; i < A.length; i++)
          if (d <= A[i][0]) {
            const [d0, y0] = A[i - 1]
            const [d1, y1] = A[i]
            return y0 + ((d - d0) / (d1 - d0)) * (y1 - y0)
          }
        return A[A.length - 1][1]
      }
      const branches = []
      for (const b of BRANCHES) {
        const els = b.entries.map((e) => rowRefs.current[e.id]).filter(Boolean)
        if (!els.length) continue
        const forkY = els[0].offsetTop + 24
        let mergeY = b.end === null ? headY : Math.min(dateToY(b.end), headY)
        // a branch at least wraps the last card riding it
        const last = els[els.length - 1]
        mergeY = clamp(mergeY, last.offsetTop + last.offsetHeight - 4, headY)
        branches.push({
          id: b.id,
          track: b.track,
          done: b.end !== null && b.end <= NOW,
          forkY,
          mergeY,
          // commit dots for the other cards riding the same branch
          dots: els.slice(1).map((el) => el.offsetTop + 24),
        })
      }
      branches.sort((a, b) => a.forkY - b.forkY)
      const laneEnds = []
      let maxLane = 0
      for (const b of branches) {
        let lane = 0
        while (laneEnds[lane] !== undefined && laneEnds[lane] > b.forkY) lane++
        laneEnds[lane] = b.mergeY
        b.lx = M_LANE0 + lane * M_LANE_W
        maxLane = Math.max(maxLane, lane)
      }
      const next = {
        branches,
        headY,
        H: wrap.offsetHeight,
        padLeft: M_LANE0 + maxLane * M_LANE_W + 16,
      }
      setGraph((prev) =>
        JSON.stringify(prev) === JSON.stringify(next) ? prev : next
      )
    }
    compute()
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(compute)
    })
    ro.observe(wrap)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [rows, NOW])

  /* trunk scroll-progress fill */
  useEffect(() => {
    const onScroll = () => {
      const el = wrapRef.current
      if (!el || !fillRef.current) return
      const max = el.clientHeight - 34
      const fill = reduced
        ? max
        : clamp(window.innerHeight / 2 - el.getBoundingClientRect().top, 0, max)
      fillRef.current.style.height = fill + 'px'
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [reduced])

  /* reveal-once */
  useEffect(() => {
    if (reduced) return
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((x) => {
          if (x.isIntersecting) {
            const id = x.target.dataset.id
            setRevealed((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))
            io.unobserve(x.target)
          }
        }),
      { rootMargin: '0px 0px -6% 0px' }
    )
    wrapRef.current
      ?.querySelectorAll('.tl-item:not(.revealed)')
      .forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [reduced])

  const dimmed = (track) => filter !== null && filter !== track
  const shown = (id) => (reduced || revealed.has(id) ? 'revealed' : '')

  const branchPath = (b) => {
    const t = M_TRUNK
    const cv = Math.min(M_CV, Math.max(4, (b.mergeY - b.forkY) / 2))
    let d = `M ${t} ${b.forkY} C ${t} ${b.forkY + cv * 0.7} ${b.lx} ${b.forkY + cv * 0.5} ${b.lx} ${b.forkY + cv}`
    d += ` L ${b.lx} ${b.mergeY - cv}`
    d += ` C ${b.lx} ${b.mergeY - cv * 0.5} ${t} ${b.mergeY - cv * 0.7} ${t} ${b.mergeY}`
    return d
  }

  return (
    <div
      className="mtl"
      ref={wrapRef}
      style={graph ? { '--mtl-pad': graph.padLeft + 'px' } : undefined}
    >
      <span className="mtl-trunk" aria-hidden="true" />
      <span className="mtl-fill" ref={fillRef} aria-hidden="true" />
      {graph && (
        <svg
          className="mtl-branches"
          width={graph.padLeft + M_LANE_W}
          height={graph.H}
          aria-hidden="true"
        >
          {graph.branches.map((b) => (
            <g
              key={b.id}
              className={`mbranch ${b.track} ${b.done ? 'done' : ''} ${
                dimmed(b.track) ? 'dim' : ''
              }`}
              style={trackVar(b.track)}
            >
              <path d={branchPath(b)} />
              <circle cx={M_TRUNK} cy={b.forkY} r="3.5" />
              {b.mergeY < graph.headY - 2 && (
                <circle cx={M_TRUNK} cy={b.mergeY} r="3.5" />
              )}
              {b.dots.map((dy) => (
                <circle key={dy} cx={b.lx} cy={dy} r="3.5" />
              ))}
            </g>
          ))}
        </svg>
      )}
      <ol className="mtl-list">
        {rows.map((row) => {
          const ref = (n) => (rowRefs.current[row.key] = n)
          if (row.kind === 'year')
            return (
              <li
                key={row.key}
                ref={ref}
                className="mtl-year"
                aria-hidden="true"
              >
                <span className="pill">{row.yr}</span>
              </li>
            )
          if (row.kind === 'skip')
            return (
              <li
                key={row.key}
                ref={ref}
                className="mtl-skip"
                title={`${row.from} – ${row.to}`}
                aria-hidden="true"
              >
                <span className="dots" />
              </li>
            )
          if (row.kind === 'point') {
            const p = row.p
            return (
              <li
                key={row.key}
                ref={ref}
                data-id={p.id}
                className={`tl-item mtl-point ${shown(p.id)}`}
              >
                <span className="diamond" aria-hidden="true" />
                <span className="plabel">
                  <IconTag width={11} height={11} /> {Math.floor(p.at)} ·{' '}
                  {p.label}
                </span>
              </li>
            )
          }
          const e = row.e
          const ended = e.end !== null && e.end <= NOW
          return (
            <li
              key={row.key}
              ref={ref}
              data-id={e.id}
              className={`tl-item mtl-entry ${dimmed(e.track) ? 'dim' : ''} ${shown(e.id)}`}
            >
              <Card e={e} ended={ended} />
            </li>
          )
        })}
      </ol>
      <div className="mtl-headnode" ref={headRef}>
        <span className="dot" aria-hidden="true" />
        <span className="lbl">HEAD → now</span>
      </div>
    </div>
  )
}

/* =====================================================================
   Desktop: full two-sided graph on a proportional time scale.
   ===================================================================== */
function DesktopTimeline({ filter }) {
  const wrapRef = useRef(null)
  const progressRef = useRef(null)
  const yearRef = useRef(null)
  const cardRefs = useRef({})
  const [width, setWidth] = useState(0)
  const [tops, setTops] = useState(null)
  const [extra, setExtra] = useState(0)
  // bottom of the lowest card, measured; HEAD is parked below it
  const [contentBottom, setContentBottom] = useState(0)
  // per-month trunk heights, sized by how much card content starts in each
  // month (measured after first layout); null = first render, fixed scale
  const [density, setDensity] = useState(null)
  // revealed lives in state (not classList) so filter re-renders don't wipe it
  const [revealed, setRevealed] = useState(() => new Set())
  const reduced = useReducedMotion()
  const NOW = useMemo(nowDecimal, [])

  /* ---- geometry ---- */
  const YEAR_PX = 300
  const MIN_MONTH_PX = 10 // floor for months where nothing starts
  const PAD_TOP = 80

  // Piecewise scale derived from the content: the range starts at the
  // earliest dated thing, runs of years with no activity collapse into a
  // short "···" break on the trunk, and within active years each month is
  // as tall as the boxes that start in it need — density, not elapsed time.
  const scale = useMemo(() => {
    const dates = [NOW]
    ENTRIES.forEach((e) => dates.push(e.start, e.end ?? NOW))
    POINTS.forEach((p) => dates.push(p.at))
    const startYear = Math.floor(Math.min(...dates))
    const endYear = Math.floor(NOW)
    const active = {}
    for (let Y = startYear; Y <= endYear; Y++) {
      active[Y] =
        Y === endYear ||
        ENTRIES.some((e) => e.start < Y + 1 && (e.end ?? NOW) > Y) ||
        POINTS.some((p) => p.at >= Y && p.at < Y + 1)
    }
    const height = {}
    const monthH = {}
    const monthOff = {}
    const breaks = []
    for (let Y = startYear; Y <= endYear; Y++) {
      if (active[Y]) {
        const hs = []
        const offs = []
        let a = 0
        for (let m = 0; m < 12; m++) {
          const mh = density
            ? Math.max(MIN_MONTH_PX, density[Y * 12 + m] || 0)
            : YEAR_PX / 12
          hs.push(mh)
          offs.push(a)
          a += mh
        }
        monthH[Y] = hs
        monthOff[Y] = offs
        height[Y] = a
        continue
      }
      let to = Y
      while (to + 1 <= endYear && !active[to + 1]) to++
      const run = to - Y + 1
      for (let i = 0; i < run; i++) height[Y + i] = BREAK_PX / run
      breaks.push({ from: Y, to })
      Y = to
    }
    const offset = {}
    let acc = PAD_TOP
    for (let Y = startYear; Y <= endYear; Y++) {
      offset[Y] = acc
      acc += height[Y]
    }
    offset[endYear + 1] = acc
    const y = (d) => {
      const Y = Math.floor(d)
      if (Y < startYear) return PAD_TOP
      if (Y > endYear) return offset[endYear + 1] + (d - endYear - 1) * YEAR_PX
      if (!monthH[Y]) return offset[Y] + (d - Y) * height[Y]
      const f = (d - Y) * 12
      const mi = clamp(Math.floor(f), 0, 11)
      // within a month, time advances at the floor slope only — a month's
      // extra height belongs to the boxes starting in it, below their date
      const slope = Math.min(monthH[Y][mi], MIN_MONTH_PX)
      return offset[Y] + monthOff[Y][mi] + (f - mi) * slope
    }
    const invY = (px) => {
      let Y = startYear
      while (Y < endYear + 1 && offset[Y + 1] <= px) Y++
      if (Y > endYear) return endYear + (px - offset[endYear + 1]) / YEAR_PX + 1
      const rel = Math.max(0, px - offset[Y])
      if (!monthH[Y]) return Y + rel / height[Y]
      let mi = 0
      while (mi < 11 && monthOff[Y][mi + 1] <= rel) mi++
      const slope = Math.min(monthH[Y][mi], MIN_MONTH_PX)
      return Y + (mi + clamp((rel - monthOff[Y][mi]) / slope, 0, 1)) / 12
    }
    const years = []
    for (let Y = startYear; Y <= endYear; Y++) if (active[Y]) years.push(Y)
    return { startYear, y, invY, years, breaks }
  }, [NOW, density])
  const { y, invY } = scale

  const H = Math.round(y(NOW + 0.12) + 130)
  const trunkX = width / 2
  const GAP = 118 // trunk -> card edge
  // lane spacing shrinks when many branches run concurrently, so the
  // outermost lane always stays inside the trunk-to-card gap
  const maxLane = Math.max(1, ...BRANCHES.map((b) => Math.abs(b.lane)))
  const LANE_W = Math.min(28, Math.round((GAP - 14) / maxLane))
  const laneX = (lane) => trunkX + lane * LANE_W
  // HEAD is the tip of the graph, so it sits under the last card rather than
  // on today's date — an entry that started this month would otherwise land
  // its node right on the HEAD dot, and its card would hang below "now".
  const headY = Math.max(y(NOW), contentBottom + HEAD_GAP)
  // an open branch runs all the way down to HEAD; a closed one stops at its
  // own end date (the same rule the mobile graph uses)
  const endY = (b) => (b.end === null ? headY : Math.min(y(b.end), headY))

  /* ---- container width ---- */
  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setWidth(el.clientWidth)
      setTops(null)
    })
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  /* ---- collision pass: measure cards, push overlapping ones down ---- */
  useLayoutEffect(() => {
    if (width === 0 || tops !== null) return
    const cardH = {}
    for (const e of ENTRIES) {
      const el = cardRefs.current[e.id]
      cardH[e.id] = el ? el.offsetHeight : 140
    }
    // size each month by the boxes that start in it: per side, the stacked
    // card heights (plus room for tags); empty months drop to the floor
    const monthKey = (d) => {
      const Y = Math.floor(d)
      return Y * 12 + clamp(Math.floor((d - Y) * 12), 0, 11)
    }
    const need = {}
    for (const e of ENTRIES) {
      const k = monthKey(e.start)
      need[k] = need[k] || { L: 0, R: 0, tags: 0 }
      need[k][e.lane < 0 ? 'L' : 'R'] += cardH[e.id] + 24
    }
    for (const p of POINTS) {
      const k = monthKey(p.at)
      need[k] = need[k] || { L: 0, R: 0, tags: 0 }
      need[k].tags++
    }
    const nextDensity = {}
    for (const k of Object.keys(need)) {
      const n = need[k]
      nextDensity[k] = Math.max(n.L, n.R) + n.tags * 36
    }
    if (JSON.stringify(nextDensity) !== JSON.stringify(density)) {
      // rebuild the scale first; this effect re-runs with tops still null
      setDensity(nextDensity)
      return
    }
    const groups = { left: [], right: [] }
    for (const e of ENTRIES) {
      groups[e.lane < 0 ? 'left' : 'right'].push(e)
    }
    const next = {}
    let maxBottom = 0
    for (const side of ['left', 'right']) {
      const list = groups[side].slice().sort((a, b) => a.start - b.start)
      let prevBottom = -Infinity
      for (const e of list) {
        const top = Math.max(y(e.start) - 14, prevBottom + 22)
        next[e.id] = top
        prevBottom = top + cardH[e.id]
        maxBottom = Math.max(maxBottom, prevBottom)
      }
    }
    setTops(next)
    setContentBottom(maxBottom)
    setExtra(Math.max(0, Math.max(y(NOW), maxBottom + HEAD_GAP) + 56 - H))
  }, [width, tops, density]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- scroll: trunk progress + sticky year ---- */
  useEffect(() => {
    const onScroll = () => {
      const el = wrapRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const midY = window.innerHeight / 2
      if (progressRef.current && !reduced) {
        const fill = clamp(midY - r.top - 30, 0, headY - 30)
        progressRef.current.style.height = fill + 'px'
      }
      const yEl = yearRef.current
      if (yEl) {
        const inView = r.top < midY && r.bottom > midY * 0.5
        yEl.classList.toggle('visible', inView)
        if (inView) {
          const yr = invY(midY - r.top)
          yEl.textContent =
            yr >= NOW - 0.08
              ? 'now'
              : String(Math.floor(clamp(yr, scale.startYear, NOW)))
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [headY, reduced, scale]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (reduced && progressRef.current)
      progressRef.current.style.height = headY - 30 + 'px'
  }, [reduced, headY])

  /* ---- reveal-once ---- */
  useEffect(() => {
    if (reduced || tops === null) return
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((x) => {
          if (x.isIntersecting) {
            const id = x.target.closest('[data-id]').dataset.id
            setRevealed((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))
            io.unobserve(x.target)
          }
        }),
      { rootMargin: '0px 0px -6% 0px' }
    )
    // A tl-entry <li> is position:static with every part absolutely
    // positioned, so the <li> is a zero-height box sitting at the top of the
    // timeline, nowhere near its card. Watching it means an entry only
    // reveals when the TOP of the timeline scrolls into view — reload halfway
    // down and the cards never appear. Watch the card, which is where the
    // entry actually is. Tags carry their own box, so they are watched directly.
    wrapRef.current
      ?.querySelectorAll(
        '.tl-point:not(.revealed), .tl-entry:not(.revealed) .tl-card'
      )
      .forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [tops, reduced])

  const branchPath = (b) => {
    const sx = trunkX
    const lx = laneX(b.lane)
    const sy = y(b.start)
    const ey = endY(b)
    const cv = Math.min(CV, Math.max(6, (ey - sy) / 2)) // short arcs stay sane
    let d = `M ${sx} ${sy} C ${sx} ${sy + cv * 0.6} ${lx} ${sy + cv * 0.4} ${lx} ${sy + cv}`
    d += ` L ${lx} ${ey - cv}`
    d += ` C ${lx} ${ey - cv * 0.4} ${sx} ${ey - cv * 0.6} ${sx} ${ey}`
    return d
  }

  const items = [
    ...ENTRIES.map((e) => ({ kind: 'entry', at: e.start, e })),
    ...POINTS.map((p) => ({ kind: 'point', at: p.at, p })),
  ].sort((a, b) => a.at - b.at)

  const years = scale.years

  const dimmed = (track) => filter !== null && filter !== track
  const shown = (id) => (reduced || revealed.has(id) ? 'revealed' : '')

  return (
    <>
      <div className="tl-wrap" ref={wrapRef} style={{ height: H + extra }}>
        {width > 0 && (
          <>
            {/* trunk (main) + scroll-progress fill */}
            <div
              className="trunk"
              style={{ left: trunkX, top: 30, height: headY - 30 }}
              aria-hidden="true"
            />
            <div
              className="trunk-fill"
              ref={progressRef}
              style={{ left: trunkX, top: 30 }}
              aria-hidden="true"
            />

            {/* branches */}
            <svg
              className="branches"
              width={width}
              height={H}
              viewBox={`0 0 ${width} ${H}`}
              aria-hidden="true"
            >
              {BRANCHES.map((b) => (
                <path
                  key={b.id}
                  className={`branch ${b.track} ${
                    b.end !== null && b.end <= NOW ? 'done' : 'ongoing'
                  } ${dimmed(b.track) ? 'dim' : ''}`}
                  style={trackVar(b.track)}
                  d={branchPath(b)}
                />
              ))}
            </svg>

            {/* year markers on the trunk (nudged up when a tag sits close
                below — compressed months can put them almost on top of it) */}
            {years.map((yr) => {
              let py = y(yr)
              for (const p of POINTS) {
                const ty = y(p.at)
                if (Math.abs(ty - py) < 42) py = Math.min(py, ty - 42)
              }
              return (
                <span
                  key={yr}
                  className="year-mark"
                  style={{ left: trunkX, top: py }}
                  aria-hidden="true"
                >
                  {yr}
                </span>
              )
            })}

            {/* compressed runs of empty years */}
            {scale.breaks.map((b) => (
              <span
                key={b.from}
                className="year-break"
                style={{ left: trunkX, top: (y(b.from) + y(b.to + 1)) / 2 }}
                title={`${b.from} – ${b.to}`}
                aria-hidden="true"
              />
            ))}

            {/* HEAD */}
            <div className="head-node" style={{ left: trunkX, top: headY }}>
              <span className="dot" aria-hidden="true" />
              <span className="lbl">HEAD → now</span>
            </div>

            {/* entries + tagged commits, chronological for screen readers */}
            <ol className="tl-list">
              {items.map((it) => {
                if (it.kind === 'point') {
                  const p = it.p
                  return (
                    <li
                      key={p.id}
                      data-id={p.id}
                      className={`tl-item tl-point ${shown(p.id)}`}
                      style={{ left: trunkX, top: y(p.at) }}
                    >
                      <span className="diamond" aria-hidden="true" />
                      <span className="plabel">
                        <IconTag width={11} height={11} /> {Math.floor(p.at)} ·{' '}
                        {p.label}
                      </span>
                    </li>
                  )
                }
                const e = it.e
                const ended = e.end !== null && e.end <= NOW
                const side = e.lane < 0 ? 'left' : 'right'
                const br = BRANCH_OF[e.id]
                const top = tops ? tops[e.id] : y(e.start) - 14
                const lx = laneX(br.lane)
                const sy = y(br.start)
                const ey = endY(br)
                const cv = Math.min(CV, Math.max(6, (ey - sy) / 2))
                const cy = clamp(top + 24, sy + cv, ey - cv)
                const cardStyle =
                  side === 'left'
                    ? {
                        top,
                        right: width - trunkX + GAP,
                        width: Math.min(420, trunkX - GAP - 8),
                      }
                    : {
                        top,
                        left: trunkX + GAP,
                        width: Math.min(420, width - trunkX - GAP - 8),
                      }
                const connStyle =
                  side === 'left'
                    ? {
                        top: cy,
                        left: trunkX - GAP,
                        width: GAP - (trunkX - lx),
                      }
                    : { top: cy, left: lx, width: trunkX + GAP - lx }
                return (
                  <li
                    key={e.id}
                    data-id={e.id}
                    className={`tl-item tl-entry ${dimmed(e.track) ? 'dim' : ''} ${shown(e.id)}`}
                  >
                    <span
                      className="tl-conn"
                      style={connStyle}
                      aria-hidden="true"
                    />
                    <span
                      className={`tl-node ${e.track} ${ended ? '' : 'ongoing'}`}
                      style={{ left: lx, top: cy, ...trackVar(e.track) }}
                      aria-hidden="true"
                    />
                    <Card
                      e={e}
                      ended={ended}
                      cardRef={(n) => (cardRefs.current[e.id] = n)}
                      style={cardStyle}
                    />
                  </li>
                )
              })}
            </ol>
          </>
        )}
      </div>

      <div className="sticky-year" ref={yearRef} aria-hidden="true">
        2022
      </div>
    </>
  )
}
