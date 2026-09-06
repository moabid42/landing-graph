import { Fragment, useEffect, useState } from 'react'
import Timeline from './timeline/index.jsx'
import Markdown from './markdown.jsx'
import { POSTS, loadBody } from './blog/index.js'
import { STACK, LANGUAGES, RESEARCH } from './data.js'
import ErrorBoundary from './ErrorBoundary.jsx'
import { applyMeta } from './seo/apply.js'
import config from '../site.config.js'
import { ENTRIES } from './content.js'
import {
  IconRepo,
  IconBranch,
  IconBook,
  IconTag,
  IconMail,
  IconPencil,
  IconFlask,
} from './icons.jsx'

const { identity, links, footer, work: WORK } = config

// Look a remote up by name. A name that is not in site.config.js returns
// null, and whatever renders it hides itself — deleting a link is enough.
const linkTo = (name) => links.find((l) => l.name === name)?.url ?? null

// "https://www.example.com/x" -> "example.com/x"; "mailto:a@b" -> "a@b"
const linkLabel = (url) =>
  url.replace(/^https?:\/\/(www\.)?/, '').replace(/^mailto:/, '')

// Config strings may use `backticks` for inline code, the way markdown does,
// and a newline wherever the line should break.
const lines = (s, key) =>
  s.split('\n').map((line, i) => (
    <Fragment key={`${key}-${i}`}>
      {i > 0 && <br />}
      {line}
    </Fragment>
  ))

const ticks = (s) =>
  s
    .split(/`([^`]+)`/g)
    .map((part, i) => (i % 2 ? <code key={i}>{part}</code> : lines(part, i)))

const MAILTO = `mailto:${identity.email}`
const MEDIUM_URL = linkTo('medium')
const RESEARCHGATE_URL = linkTo('researchgate')
const GITHUB_URL = linkTo('github')

function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') === 'light' ? 'light' : 'dark'
    } catch {
      return 'dark'
    }
  })
  useEffect(() => {
    if (theme === 'light')
      document.documentElement.setAttribute('data-theme', 'light')
    else document.documentElement.removeAttribute('data-theme')
    try {
      localStorage.setItem('theme', theme)
    } catch {
      /* private mode */
    }
  }, [theme])
  return [theme, setTheme]
}

// tiny hash router: "#/blog/<slug>" opens a post, anything else is home
function useRoute() {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const on = () => setHash(window.location.hash)
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const m = hash.match(/^#\/blog\/([A-Za-z0-9._-]+)/)
  return m ? m[1] : null
}

// The body is a dynamic import (see src/blog/index.js), so it arrives a beat
// after the heading. Everything above the fold — title, date, topics — comes
// from the eager index and renders immediately.
function PostPage({ post }) {
  const [body, setBody] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let current = true
    setBody(null)
    setFailed(false)
    loadBody(post.slug).then(
      (text) => current && setBody(text),
      () => current && setFailed(true)
    )
    // A fast second navigation must not let the first body win the race.
    return () => {
      current = false
    }
  }, [post.slug])

  return (
    <section className="post-page" aria-label="Blog post">
      <p className="post-back">
        <a href="#blog">← all writing</a>
      </p>
      <article className="readme">
        <div className="readme-head">
          <IconPencil width={14} height={14} />
          <span>blog/{post.slug}.md</span>
          {post.date && <span className="head-date">{post.date}</span>}
        </div>
        <div className="readme-body">
          <div className="md-body">
            <h1>{post.title}</h1>
            {post.topics.length > 0 && (
              <p className="post-tags">
                {post.topics.map((t, i) => (
                  <span key={`${t}-${i}`} className="topic">
                    {t}
                  </span>
                ))}
              </p>
            )}
          </div>
          <ErrorBoundary label="This post">
            {failed ? (
              <p className="post-status" role="alert">
                This post failed to load. Reloading the page usually fixes it.
              </p>
            ) : body === null ? (
              <p className="post-status" aria-live="polite">
                Loading…
              </p>
            ) : (
              <Markdown src={body} />
            )}
          </ErrorBoundary>
        </div>
      </article>
    </section>
  )
}

const POSTS_PER_PAGE = 5

export default function App() {
  const [theme, setTheme] = useTheme()
  const [page, setPage] = useState(1)
  const slug = useRoute()
  const post = slug ? POSTS.find((p) => p.slug === slug) : null
  const pages = Math.ceil(POSTS.length / POSTS_PER_PAGE)
  const pagePosts = POSTS.slice(
    (page - 1) * POSTS_PER_PAGE,
    page * POSTS_PER_PAGE
  )

  // Title, description, canonical and the share card, per route. index.html
  // carries the same values statically for crawlers that never run scripts.
  useEffect(() => {
    applyMeta(post)
    if (post) window.scrollTo(0, 0)
    else if (window.location.hash === '#blog')
      document.getElementById('blog')?.scrollIntoView()
  }, [post])

  return (
    <>
      <a className="skip-link" href="#top">
        Skip to content
      </a>
      <header className="gh-header">
        <div className="gh-header-inner">
          <div className="crumb">
            <span className="avatar" aria-hidden="true">
              {identity.avatar}
            </span>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              {identity.handle}
            </a>
            <span className="slash">/</span>
            <a href="#top" className="repo-name">
              {identity.repo}
            </a>
            <span className="vis-badge">Public</span>
          </div>
          <div className="gh-actions">
            <a
              className="gh-btn"
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Follow <span aria-hidden="true">↗</span>
            </a>
            <button
              className="gh-btn"
              aria-label={
                theme === 'dark'
                  ? 'Switch to light theme'
                  : 'Switch to dark theme'
              }
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? 'light' : 'dark'}
            </button>
          </div>
        </div>
        <nav className="gh-tabs" aria-label="Sections">
          <a className={`tab ${post ? '' : 'active'}`} href="#top">
            <IconBook width={14} height={14} /> README
          </a>
          <a className="tab" href="#timeline">
            <IconBranch width={14} height={14} /> Timeline
            <span className="counter">{ENTRIES.length}</span>
          </a>
          <a className="tab" href="#work">
            <IconRepo width={14} height={14} /> Pinned
            <span className="counter">{WORK.length}</span>
          </a>
          <a className={`tab ${post ? 'active' : ''}`} href="#blog">
            <IconPencil width={14} height={14} /> Writing
            {POSTS.length > 0 && (
              <span className="counter">{POSTS.length}</span>
            )}
          </a>
          <a className="tab" href="#research">
            <IconFlask width={14} height={14} /> Research
            {RESEARCH.length > 0 && (
              <span className="counter">{RESEARCH.length}</span>
            )}
          </a>
          <a className="tab" href="#stack">
            <IconTag width={14} height={14} /> Stack
          </a>
          <a className="tab" href="#contact">
            <IconMail width={14} height={14} /> Contact
          </a>
        </nav>
      </header>

      <main id="top">
        {post ? (
          <PostPage post={post} />
        ) : (
          <>
            {/* ---------- README hero ---------- */}
            <section className="hero" aria-label="Intro">
              <div className="readme">
                <div className="readme-head">
                  <IconBook width={14} height={14} />
                  <span>README.md</span>
                </div>
                <div className="readme-body">
                  <h1>{identity.name}</h1>
                  <p className="hero-sub">{identity.tagline}</p>
                  {identity.blurb && (
                    <blockquote>{ticks(identity.blurb)}</blockquote>
                  )}
                  {identity.status && (
                    <p className="hero-status">
                      <span className="status">
                        <span className="dot" aria-hidden="true" />
                        {identity.status}
                      </span>
                      {identity.location && (
                        <span className="loc">{identity.location}</span>
                      )}
                    </p>
                  )}
                  <div className="hero-cta">
                    <a className="gh-btn primary" href={MAILTO}>
                      <IconMail width={14} height={14} /> Email me
                    </a>
                    <a className="gh-btn" href="#timeline">
                      <IconBranch width={14} height={14} /> Follow the graph
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* ---------- timeline ---------- */}
            <section id="timeline" aria-label="Timeline">
              <div className="sec-head">
                <h2>
                  <IconBranch width={16} height={16} /> Timeline
                </h2>
                <code className="cmd">$ git log --graph --all</code>
              </div>
              <ErrorBoundary label="The timeline">
                <Timeline />
              </ErrorBoundary>
            </section>

            {/* ---------- pinned work ---------- */}
            <section id="work" aria-label="Selected work">
              <div className="sec-head">
                <h2>
                  <IconRepo width={16} height={16} /> Pinned
                </h2>
                <span className="sec-note">selected work</span>
              </div>
              <div className="pin-grid">
                {WORK.map((w) => (
                  <article key={w.title} className="pin-card">
                    <h3>
                      <IconRepo width={14} height={14} />
                      {w.href ? (
                        <a
                          href={w.href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {w.title}
                        </a>
                      ) : (
                        <span className="no-link">{w.title}</span>
                      )}
                      <span className="vis-badge">{w.visibility}</span>
                    </h3>
                    <p className="pin-desc">{w.text}</p>
                    <div className="pin-topics">
                      {w.topics.map((t, i) => (
                        <span key={`${t}-${i}`} className="topic">
                          {t}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* ---------- writing ---------- */}
            <section id="blog" aria-label="Writing">
              <div className="sec-head">
                <h2>
                  <IconPencil width={16} height={16} /> Writing
                </h2>
                {MEDIUM_URL && (
                  <a
                    className="sec-note"
                    href={MEDIUM_URL}
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
                    New writing lands on this page and on Medium at the same
                    time.
                  </p>
                  {MEDIUM_URL && (
                    <a
                      className="gh-btn"
                      href={MEDIUM_URL}
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
                    {pagePosts.map((p) => (
                      <li key={p.slug} className="post-row">
                        <span className="post-date">{p.date}</span>
                        <div className="post-main">
                          <a href={`#/blog/${p.slug}`}>{p.title}</a>
                          {p.summary && (
                            <p className="post-summary">{p.summary}</p>
                          )}
                          {p.topics.length > 0 && (
                            <span className="post-topics">
                              {p.topics.map((t, i) => (
                                <span key={`${t}-${i}`} className="topic">
                                  {t}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  {pages > 1 && (
                    <nav className="pager" aria-label="Post pages">
                      <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                      >
                        ‹ Newer
                      </button>
                      {Array.from({ length: pages }, (_, i) => (
                        <button
                          key={i}
                          className={page === i + 1 ? 'active' : ''}
                          aria-current={page === i + 1 ? 'page' : undefined}
                          onClick={() => setPage(i + 1)}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        disabled={page === pages}
                        onClick={() => setPage(page + 1)}
                      >
                        Older ›
                      </button>
                    </nav>
                  )}
                </>
              )}
            </section>

            {/* ---------- research ---------- */}
            <section id="research" aria-label="Research">
              <div className="sec-head">
                <h2>
                  <IconFlask width={16} height={16} /> Research
                </h2>
                {RESEARCHGATE_URL && (
                  <a
                    className="sec-note"
                    href={RESEARCHGATE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    full profile on researchgate{' '}
                    <span aria-hidden="true">↗</span>
                  </a>
                )}
              </div>
              {RESEARCH.length === 0 ? (
                <div className="blankslate">
                  <IconFlask width={22} height={22} />
                  <p className="bs-title">Papers are being indexed</p>
                  <p className="bs-text">
                    Titles and abstracts will be listed here, each linking to
                    the full text on ResearchGate.
                  </p>
                  {RESEARCHGATE_URL && (
                    <a
                      className="gh-btn"
                      href={RESEARCHGATE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View on ResearchGate <span aria-hidden="true">↗</span>
                    </a>
                  )}
                </div>
              ) : (
                <div className="paper-list">
                  {RESEARCH.map((r) => (
                    <article key={r.title} className="paper">
                      <h3>
                        <a
                          href={r.href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {r.title}
                        </a>
                      </h3>
                      <p className="paper-abstract">{r.abstract}</p>
                      <a
                        className="paper-link"
                        href={r.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Read on ResearchGate <span aria-hidden="true">↗</span>
                      </a>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* ---------- stack ---------- */}
            <section id="stack" aria-label="Stack">
              <div className="sec-head">
                <h2>
                  <IconTag width={16} height={16} /> Stack
                </h2>
                <span className="sec-note">languages &amp; tools</span>
              </div>
              <div className="lang-bar" aria-hidden="true">
                {LANGUAGES.map((l) => (
                  <span
                    key={l.name}
                    className="lang-seg"
                    style={{ background: l.color }}
                    title={l.name}
                  />
                ))}
              </div>
              <ul className="lang-list">
                {LANGUAGES.map((l) => (
                  <li key={l.name}>
                    <span
                      className="lang-dot"
                      style={{ background: l.color }}
                      aria-hidden="true"
                    />
                    {l.name}
                  </li>
                ))}
              </ul>
              <dl className="stack-list">
                {STACK.map((s) => (
                  <div key={s.cat} className="stack-row">
                    <dt>{s.cat}</dt>
                    <dd>{s.items}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* ---------- contact ---------- */}
            <section id="contact" aria-label="Contact">
              <div className="sec-head">
                <h2>
                  <IconMail width={16} height={16} /> Contact
                </h2>
                <span className="sec-note">remotes</span>
              </div>
              <div className="remote-block">
                <div className="remote-head">
                  <code>$ git remote -v</code>
                </div>
                <table className="remotes">
                  <tbody>
                    {links.map((l) => (
                      <tr key={l.name}>
                        <td>{l.name}</td>
                        <td>
                          <a
                            href={l.url}
                            {...(l.url.startsWith('mailto:')
                              ? {}
                              : {
                                  target: '_blank',
                                  rel: 'noopener noreferrer',
                                })}
                          >
                            {linkLabel(l.url)}
                          </a>
                        </td>
                        <td className="kind">({l.kind})</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <a className="gh-btn primary big-cta" href={MAILTO}>
                <IconMail width={14} height={14} /> Email me
              </a>
            </section>
          </>
        )}
      </main>

      <footer>
        <span>{footer.text.replace('{year}', new Date().getFullYear())}</span>
        <span>{ticks(footer.note)}</span>
      </footer>
    </>
  )
}
