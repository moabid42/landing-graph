import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { IconPencil } from '../icons.jsx'
import { feedPath, pagePath, postPath } from '../paths.js'
import { link } from '../router.js'
import ErrorBoundary from '../ErrorBoundary.jsx'
import Markdown from '../markdown.jsx'
import { POSTS, loadBody } from './index.js'
import { relatedPosts } from './related.js'
import Contents from './Contents.jsx'
import ContentTags from '../ContentTags.jsx'

export default function PostPage({ post }) {
  const [body, setBody] = useState(null)
  const [failed, setFailed] = useState(false)
  const articleRef = useRef(null)
  const related = relatedPosts(post, POSTS)

  useEffect(() => {
    let current = true
    loadBody(post.slug).then(
      (text) => current && setBody(text),
      () => current && setFailed(true)
    )
    return () => {
      current = false
    }
  }, [post.slug])

  // A bookmarked chapter is unavailable until the lazy body arrives.
  useLayoutEffect(() => {
    if (body === null) return
    const hash = window.location.hash.slice(1)
    if (hash) {
      let id = hash
      try {
        id = decodeURIComponent(hash)
      } catch {
        /* A malformed fragment still gets a literal lookup. */
      }
      document.getElementById(id)?.scrollIntoView({ behavior: 'instant' })
    } else if (window.history.state?.scroll) {
      window.scrollTo({
        left: window.history.state.scroll[0],
        top: window.history.state.scroll[1],
        behavior: 'instant',
      })
    }
  }, [body])

  return (
    <section className="post-page" aria-label="Blog post">
      <p className="post-back">
        <a {...link(pagePath('writing'))}>← all writing</a>
      </p>
      <div className="post-layout">
        <article className="readme post-article">
          <div className="readme-head">
            <IconPencil width={14} height={14} />
            <span>blog/{post.slug}.md</span>
          </div>
          <div className="readme-body">
            <div className="md-body post-heading">
              <h1>{post.title}</h1>
              <p className="article-meta">
                {post.date && <time dateTime={post.date}>{post.date}</time>}
                <span>{post.readingMinutes} min read</span>
              </p>
              <ContentTags item={post} className="post-tags" />
            </div>
            <div className="post-body" ref={articleRef}>
              <ErrorBoundary label="This post">
                {failed ? (
                  <p className="post-status" role="alert">
                    This post failed to load. Reloading the page usually fixes
                    it.
                  </p>
                ) : body === null ? (
                  <p className="post-status loading" aria-live="polite">
                    Loading…
                  </p>
                ) : (
                  <Markdown src={body} />
                )}
              </ErrorBoundary>
            </div>
          </div>
        </article>
        <Contents articleRef={articleRef} body={body} />
      </div>
      {body !== null && (
        <div className="post-after">
          {related.length > 0 && (
            <section className="related-posts" aria-labelledby="related-title">
              <h2 id="related-title">Keep reading</h2>
              <ul>
                {related.map((candidate) => (
                  <li key={candidate.slug}>
                    <a {...link(postPath(candidate.slug))}>{candidate.title}</a>
                    <p>{candidate.summary}</p>
                    <span className="related-meta">
                      {candidate.readingMinutes} min read
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <div className="post-subscribe">
            <div>
              <p>Follow new writing</p>
              <span>Get new posts in your feed reader.</span>
            </div>
            <a className="gh-btn" href={feedPath()}>
              Subscribe via RSS <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      )}
    </section>
  )
}
