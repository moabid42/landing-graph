import { Fragment, useEffect, useLayoutEffect, useState } from 'react'
import Timeline from './timeline/index.jsx'
import SectionNav from './SectionNav.jsx'
import Writing from './Writing.jsx'
import { Pinned, Research, Stack, Contact } from './ProfileSections.jsx'
import SectionPage from './SectionPage.jsx'
import Markdown from './markdown.jsx'
import { POSTS, loadBody } from './blog/index.js'
import ErrorBoundary from './ErrorBoundary.jsx'
import { applyMeta } from './seo/apply.js'
import { homePath, pagePath } from './paths.js'
import { link, useRoute } from './router.js'
import config from '../site.config.js'
import {
  IconBranch,
  IconFork,
  IconLinkedIn,
  IconBook,
  IconPencil,
  IconInfo,
  IconSun,
  IconMoon,
} from './icons.jsx'

const { identity, links, footer, note } = config

// Look a remote up by name. A name that is not in site.config.js returns
// null, and whatever renders it hides itself — deleting a link is enough.
const linkTo = (name) => links.find((l) => l.name === name)?.url ?? null

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

const MEDIUM_URL = linkTo('medium')
const GITHUB_URL = linkTo('github')
const LINKEDIN_URL = linkTo('linkedin')
const NOTE_URL = note ? linkTo(note.link) : null

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
        <a {...link(pagePath('writing'))}>← all writing</a>
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
              <p className="post-status loading" aria-live="polite">
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

export default function App() {
  const [theme, setTheme] = useTheme()
  const route = useRoute()
  const { slug, page, pathname, hash, scroll } = route
  const post = slug ? POSTS.find((p) => p.slug === slug) : null

  // The README tab and the crumb go to the bare site root, the way a logo
  // does: no fragment left in the address bar afterwards.
  const home = () => link(homePath(), () => window.scrollTo(0, 0))

  // Title, description, canonical and the share card, per route. index.html
  // carries the same values statically for crawlers that never run scripts.
  useEffect(() => {
    applyMeta(post, page)
  }, [post, page])

  useLayoutEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1))
      target?.scrollIntoView({ behavior: 'instant' })
    } else {
      window.scrollTo({
        left: scroll?.[0] ?? 0,
        top: scroll?.[1] ?? 0,
        behavior: 'instant',
      })
    }
  }, [pathname, hash, scroll])

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
            <a {...home()} className="repo-name">
              {identity.repo}
            </a>
            <span className="vis-badge">Public</span>
          </div>
          <div className="gh-actions">
            {identity.source && (
              <a
                className="gh-btn header-fork"
                href={identity.source}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Fork this site on GitHub"
                title="Fork this site on GitHub"
              >
                <IconFork width={14} height={14} />
                <span className="header-action-label">Fork</span>
              </a>
            )}
            <button
              className="gh-btn header-theme"
              aria-label={
                theme === 'dark'
                  ? 'Switch to light theme'
                  : 'Switch to dark theme'
              }
              title={
                theme === 'dark'
                  ? 'Switch to light theme'
                  : 'Switch to dark theme'
              }
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <IconSun width={14} height={14} />
              ) : (
                <IconMoon width={14} height={14} />
              )}
              <span className="header-action-label">
                {theme === 'dark' ? 'Light' : 'Dark'}
              </span>
            </button>
            {LINKEDIN_URL && (
              <a
                className="gh-btn primary header-connect"
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit LinkedIn profile"
                title="LinkedIn"
              >
                <IconLinkedIn className="header-action-icon" />
                <span className="header-action-label">
                  LinkedIn <span aria-hidden="true">↗</span>
                </span>
              </a>
            )}
          </div>
        </div>
        <SectionNav current={post ? 'writing' : page} />
      </header>

      <main id="top" tabIndex={-1}>
        {post ? (
          <PostPage post={post} />
        ) : page ? (
          <SectionPage key={page} page={page} />
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
                    <a
                      className="gh-btn primary"
                      {...link(pagePath('writing'))}
                    >
                      <IconPencil width={14} height={14} /> Read my writing
                    </a>
                    <a className="gh-btn" {...link(pagePath('timeline'))}>
                      <IconBranch width={14} height={14} /> Follow the graph
                    </a>
                  </div>
                  {NOTE_URL && (
                    <aside className="gh-note">
                      <p className="note-head">
                        <IconInfo width={16} height={16} /> Note
                      </p>
                      <p className="note-body">{note.text}</p>
                      <a
                        className="note-link"
                        href={NOTE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {note.label} <span aria-hidden="true">↗</span>
                      </a>
                    </aside>
                  )}
                </div>
              </div>
            </section>

            <Pinned />

            {/* ---------- timeline ---------- */}
            <section id="timeline" aria-label="Timeline">
              <ErrorBoundary label="The timeline">
                <Timeline />
              </ErrorBoundary>
            </section>

            {/* ---------- writing ---------- */}
            <Writing mediumUrl={MEDIUM_URL} />

            <Research />

            <Stack />

            <Contact />
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
