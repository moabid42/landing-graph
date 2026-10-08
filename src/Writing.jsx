import { useEffect, useState } from 'react'
import { POSTS } from './blog/index.js'
import { IconPencil } from './icons.jsx'
import { postPath } from './paths.js'
import { link } from './router.js'
import { sha } from './timeline/format.js'

const monthYear = new Intl.DateTimeFormat('en', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

export default function Writing({ mediumUrl }) {
  const [showAll, setShowAll] = useState(
    () => window.location.hash === '#all-writing'
  )

  useEffect(() => {
    const update = () => setShowAll(window.location.hash === '#all-writing')
    window.addEventListener('hashchange', update)
    window.addEventListener('popstate', update)
    return () => {
      window.removeEventListener('hashchange', update)
      window.removeEventListener('popstate', update)
    }
  }, [])

  return (
    <section id="blog" aria-label="Writing">
      <div className="sec-head">
        <h2 id="all-writing">
          <IconPencil width={16} height={16} /> Writing
        </h2>
        {mediumUrl && (
          <a
            className="sec-note"
            href={mediumUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            also on medium <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
      {POSTS.length === 0 ? (
        <div className="blankslate">
          <IconPencil width={22} height={22} />
          <p className="bs-title">No posts published here yet</p>
          <p className="bs-text">
            New writing lands on this page and on Medium at the same time.
          </p>
          {mediumUrl && (
            <a
              className="gh-btn"
              href={mediumUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read on Medium <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      ) : (
        <>
          <ul className="post-list">
            {(showAll ? POSTS : POSTS.slice(0, 3)).map((post) => (
              <li key={post.slug} className="post-row">
                <span className="post-sha" aria-hidden="true">
                  {sha(post.slug)}
                </span>
                <a className="post-title" {...link(postPath(post.slug))}>
                  {post.title}
                </a>
                {post.summary && <p className="post-summary">{post.summary}</p>}
                <p className="post-meta">
                  <span>{post.readingMinutes} min read</span>
                  {post.topics[0] && <span>{post.topics[0]}</span>}
                  {post.date && (
                    <time dateTime={post.date}>
                      {monthYear.format(new Date(`${post.date}T00:00:00Z`))}
                    </time>
                  )}
                </p>
              </li>
            ))}
          </ul>
          <a className="writing-more" href={showAll ? '#blog' : '#all-writing'}>
            {showAll ? '← Latest writing' : 'View all writing →'}
          </a>
        </>
      )}
    </section>
  )
}
