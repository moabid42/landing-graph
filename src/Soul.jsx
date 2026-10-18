import { useRef } from 'react'
import config from '../site.config.js'
import { IconFingerprint } from './icons.jsx'
import Markdown from './markdown.jsx'
import Contents from './blog/Contents.jsx'
import { readingMinutes } from './readingTime.js'
import body from '../content/soul.md?raw'

const text = body.replace(/<!--[\s\S]*?-->/g, '')
const minutes = readingMinutes(text)
const updated = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
}).format(new Date(`${config.soul.updated}T00:00:00Z`))

export default function Soul({ info }) {
  const articleRef = useRef(null)
  return (
    <div className="post-layout">
      <article className="readme post-article">
        <div className="readme-head">
          <IconFingerprint width={14} height={14} />
          <span>{info.file}</span>
        </div>
        <div className="readme-body">
          <div className="md-body post-heading">
            <h1>{info.title}</h1>
            <p className="hero-sub">{info.description}</p>
            <p className="article-meta">
              <time dateTime={config.soul.updated}>Updated {updated}</time>
              <span>{minutes} min read</span>
            </p>
          </div>
          <div className="soul-content post-body" ref={articleRef}>
            <Markdown src={text} />
          </div>
        </div>
      </article>
      <Contents articleRef={articleRef} body={text} />
    </div>
  )
}
