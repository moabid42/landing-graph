import { useEffect, useState } from 'react'
import { ENTRIES, PROBLEMS, TRACKS } from '../content.js'
import { TRACK_CSS, trackVar } from './tracks.js'
import DesktopTimeline from './DesktopTimeline.jsx'
import MobileTimeline from './MobileTimeline.jsx'

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
