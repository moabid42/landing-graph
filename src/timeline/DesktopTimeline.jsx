import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { BRANCHES, ENTRIES, POINTS } from '../content.js'
import { IconTag } from '../icons.jsx'
import { clamp, nowDecimal } from './format.js'
import { BRANCH_OF, trackVar } from './tracks.js'
import useReducedMotion from './useReducedMotion.js'
import Card from './Card.jsx'

const CV = 44 // curve length of a branch-out / merge-in join, px
const HEAD_GAP = 72 // clearance kept under the lowest card before HEAD
const BREAK_PX = 56 // total height a run of empty years collapses to

/* =====================================================================
   Desktop: full two-sided graph on a proportional time scale.
   ===================================================================== */

export default function DesktopTimeline({ filter }) {
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
