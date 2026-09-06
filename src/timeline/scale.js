// The vertical scale of the desktop graph: decimal year -> pixel offset.
//
// It is not linear time. The range starts at the earliest dated thing; runs
// of years with nothing in them collapse to a short "..." break on the
// trunk; and inside an active year each month is as tall as the cards that
// start in it need. So the graph is paced by density, not by elapsed time,
// and a decade of nothing costs 56px instead of 3000.
//
// Pure on purpose: everything it needs arrives as an argument, so the
// hardest arithmetic in the project can be tested without a browser.
import { clamp } from './format.js'

export const YEAR_PX = 300
export const MIN_MONTH_PX = 10 // floor for months where nothing starts
export const PAD_TOP = 80
export const BREAK_PX = 56 // total height a run of empty years collapses to

/**
 * @param now      decimal year for "today"
 * @param entries  [{ start, end }] — end null means still open
 * @param points   [{ at }] tagged moments
 * @param density  { yearIndex*12+month: px } measured card heights, or null
 *                 on the first pass, before anything has been measured
 * @returns { startYear, y, invY, years, breaks }
 */
export function buildScale({
  now: NOW,
  entries: ENTRIES,
  points: POINTS,
  density = null,
}) {
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
}
