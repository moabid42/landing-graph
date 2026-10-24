import { version as reactVersion } from 'react'
import { IconMerge, IconIssueOpen, IconClosed } from '../icons.jsx'
import { fmtDate, sha } from './format.js'
import { trackVar } from './tracks.js'

// React 18 forwards inert as a string; React 19 treats it as a boolean.
const INERT_VALUE = Number(reactVersion.split('.')[0]) >= 19 ? true : ''

// One commit in the graph: the card that sits beside the branch line.
export default function Card({ e, ended, cardRef, style, dimmed = false }) {
  return (
    <article
      className="tl-card"
      ref={cardRef}
      style={style}
      inert={dimmed ? INERT_VALUE : undefined}
    >
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
      {e.description.map((block, i) =>
        block.type === 'list' ? (
          <ul className="txt" key={i}>
            {block.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="txt" key={i}>
            {block.text}
          </p>
        )
      )}
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
