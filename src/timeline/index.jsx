import { useEffect, useState } from 'react'
import { BRANCHES, ENTRIES, POINTS, PROBLEMS, TRACKS } from '../content.js'
import { TRACK_CSS, trackVar } from './tracks.js'
import DesktopTimeline from './DesktopTimeline.jsx'
import MobileTimeline from './MobileTimeline.jsx'
import { selectTimeline } from './views.js'
import { IconBranch } from '../icons.jsx'

const history = { entries: ENTRIES, branches: BRANCHES, points: POINTS }
const VIEWS = {
  highlights: selectTimeline(history, true),
  everything: history,
}

export default function Timeline() {
  const [view, setView] = useState('highlights')
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

  const data = VIEWS[view]
  const counts = data.entries.reduce((m, e) => {
    m[e.track] = (m[e.track] || 0) + 1
    return m
  }, {})

  return (
    <>
      <style>{TRACK_CSS}</style>
      <div className="sec-head tl-sec-head">
        <h2>
          <IconBranch width={16} height={16} /> Timeline
        </h2>
        <div className="tl-views" role="group" aria-label="Timeline view">
          {Object.entries(VIEWS).map(([key, value]) => (
            <button
              key={key}
              type="button"
              aria-pressed={view === key}
              aria-controls="timeline-graph"
              onClick={() => {
                setView(key)
                setFilter(null)
              }}
            >
              {key === 'highlights' ? 'Highlights' : 'Everything'}
              <span className="counter">{value.entries.length}</span>
            </button>
          ))}
        </div>
      </div>
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
      <div className="tl-controls">
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
        <p className="tl-view-note" role="status">
          {data.entries.length} entries · {data.points.length} milestones
        </p>
      </div>
      <div id="timeline-graph">
        {mobile ? (
          <MobileTimeline key={view} filter={filter} {...data} />
        ) : (
          <DesktopTimeline key={view} filter={filter} {...data} />
        )}
      </div>
    </>
  )
}
