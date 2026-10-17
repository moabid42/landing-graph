import { POSTS } from './blog/index.js'
import { IconPencil } from './icons.jsx'
import { postPath, feedPath } from './paths.js'
import { link } from './router.js'
import { sha } from './timeline/format.js'
import { SectionLink } from './ProfileSections.jsx'
import ArchiveControls from './ArchiveControls.jsx'
import useArchiveFilters from './useArchiveFilters.js'
import { facetOptions, filterContent, sortContent } from './archive.js'
import { tagLabel } from './taxonomy.js'
import ContentTags from './ContentTags.jsx'
import ResultMeta from './ResultMeta.jsx'

const monthYear = new Intl.DateTimeFormat('en', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})
const WRITING_FACETS = facetOptions(POSTS)

export default function Writing({ mediumUrl, full = false }) {
  const filters = useArchiveFilters('writing', full, WRITING_FACETS)
  const posts = full
    ? sortContent(filterContent(POSTS, filters), filters.sort)
    : POSTS.slice(0, 3)
  const groups = []
  for (const post of posts) {
    const year =
      full && filters.sort !== 'updated'
        ? post.date?.slice(0, 4) || 'Undated'
        : 'latest'
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
          <ArchiveControls
            enabled={full}
            defaultSort="Newest published"
            label="writing"
            filters={filters}
            items={POSTS}
            count={posts.length}
            matches={posts.length}
            total={POSTS.length}
          >
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
                {full && group.year !== 'latest' && (
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
                        {!full && post.domains[0] && (
                          <span>{tagLabel('domains', post.domains[0])}</span>
                        )}
                        {post.date && !full && (
                          <time dateTime={post.date}>
                            {monthYear.format(
                              new Date(`${post.date}T00:00:00Z`)
                            )}
                          </time>
                        )}
                      </p>
                      {full && <ContentTags item={post} filters={filters} />}
                      {full && <ResultMeta item={post} />}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </ArchiveControls>
        </>
      )}
    </section>
  )
}
