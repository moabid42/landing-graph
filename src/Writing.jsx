import { POSTS } from './blog/index.js'
import { IconPencil } from './icons.jsx'
import { postPath, feedPath } from './paths.js'
import { link } from './router.js'
import { sha } from './timeline/format.js'
import { SectionLink } from './ProfileSections.jsx'
import ArchiveControls from './ArchiveControls.jsx'
import useArchiveFilters from './useArchiveFilters.js'

const monthYear = new Intl.DateTimeFormat('en', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

export default function Writing({ mediumUrl, full = false }) {
  const { query, setQuery, topic, setTopic } = useArchiveFilters(
    'writing',
    full
  )
  const search = query.trim().toLowerCase()
  const topics = [...new Set(POSTS.flatMap((post) => post.topics))].sort()
  const posts = full
    ? POSTS.filter(
        (post) =>
          (!topic || post.topics.includes(topic)) &&
          (!search ||
            [post.title, post.summary, ...post.topics]
              .join(' ')
              .toLowerCase()
              .includes(search))
      )
    : POSTS.slice(0, 3)
  const groups = []
  for (const post of posts) {
    const year = full ? post.date?.slice(0, 4) || 'Undated' : 'latest'
    if (groups.at(-1)?.year !== year) groups.push({ year, posts: [] })
    groups.at(-1).posts.push(post)
  }

  return (
    <section id="blog" aria-label="Writing">
      <div className="sec-head">
        <h2 id="all-writing">
          <IconPencil width={16} height={16} />{' '}
          {full ? 'All writing' : 'Writing'}
        </h2>
        {full ? (
          <div className="section-links">
            <a className="sec-note" href={feedPath()}>
              RSS feed <span aria-hidden="true">↗</span>
            </a>
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
        ) : (
          <SectionLink page="writing">View all writing</SectionLink>
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
          {full && (
            <ArchiveControls
              label="writing"
              query={query}
              setQuery={setQuery}
              topic={topic}
              setTopic={setTopic}
              topics={topics}
              count={posts.length}
              total={POSTS.length}
            />
          )}
          {posts.length === 0 && (
            <div className="blankslate">
              <IconPencil width={22} height={22} />
              <p className="bs-title">No posts match these filters</p>
              <p className="bs-text">
                Try another search or clear the filters above.
              </p>
            </div>
          )}
          {groups.map((group) => (
            <div className="writing-year" key={group.year}>
              {full && (
                <h3 className="archive-year">
                  {group.year}
                  <span className="counter">{group.posts.length}</span>
                </h3>
              )}
              <ul className="post-list">
                {group.posts.map((post) => (
                  <li key={post.slug} className="post-row">
                    <span className="post-sha" aria-hidden="true">
                      {sha(post.slug)}
                    </span>
                    <a className="post-title" {...link(postPath(post.slug))}>
                      {post.title}
                    </a>
                    {post.summary && (
                      <p className="post-summary">{post.summary}</p>
                    )}
                    <p className="post-meta">
                      <span>{post.readingMinutes} min read</span>
                      {!full && post.topics[0] && <span>{post.topics[0]}</span>}
                      {post.date && (
                        <time dateTime={post.date}>
                          {monthYear.format(new Date(`${post.date}T00:00:00Z`))}
                        </time>
                      )}
                    </p>
                    {full && post.topics.length > 0 && (
                      <div className="archive-topics">
                        {post.topics.map((value) => (
                          <button
                            key={value}
                            type="button"
                            className="topic"
                            aria-pressed={topic === value}
                            onClick={() =>
                              setTopic(topic === value ? '' : value)
                            }
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}
    </section>
  )
}
