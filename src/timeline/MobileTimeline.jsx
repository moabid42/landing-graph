import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { BRANCHES, ENTRIES, POINTS } from '../content.js'
import { IconTag } from '../icons.jsx'
import { clamp, nowDecimal } from './format.js'
import { trackVar } from './tracks.js'
import useReducedMotion from './useReducedMotion.js'
import Card from './Card.jsx'

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

export default function MobileTimeline({ filter }) {
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
