import { lazy, Suspense } from 'react'
import config from '../site.config.js'
import { PAGES } from './pages.js'
import { homePath, pagePath } from './paths.js'
import { link } from './router.js'
import { ENTRIES, POINTS } from './content.js'
import { PROJECTS } from './projects.js'
import { POSTS } from './blog/index.js'
import { IconBook, IconFingerprint } from './icons.jsx'
import { Pinned, Research, Contact } from './ProfileSections.jsx'
import Timeline from './timeline/index.jsx'
import Writing from './Writing.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'

// Keep the personal document out of the landing page's first download.
const Soul = lazy(() => import('./Soul.jsx'))

const facts = {
  work: [`${PROJECTS.length} projects`, 'public & internal'],
  timeline: [
    `${ENTRIES.length} entries`,
    `${POINTS.length} milestones`,
    `${config.tracks.length} tracks`,
  ],
  writing: [`${POSTS.length} posts`, 'newest first'],
  research: [
    `${config.research.length} publications`,
    'full texts linked below',
  ],
  more: [`${config.links.length} remotes`, config.identity.location],
}

export default function SectionPage({ page }) {
  const info = PAGES[page]
  const Icon = page === 'soul' ? IconFingerprint : IconBook
  return (
    <div className="section-page">
      <section className="page-intro" aria-label={`${info.title} introduction`}>
        <p className="post-back">
          <a {...link(homePath())}>← README</a>
        </p>
        <div className="readme">
          <div className="readme-head">
            <Icon width={14} height={14} />
            <span>{info.file}</span>
          </div>
          <div className="readme-body">
            <h1>{info.title}</h1>
            <p className="hero-sub">{info.description}</p>
            {facts[page] && (
              <p className="page-facts">
                {facts[page].filter(Boolean).map((fact) => (
                  <span key={fact}>{fact}</span>
                ))}
              </p>
            )}
            {page === 'soul' && (
              <div className="soul-content">
                <ErrorBoundary label="This page">
                  <Suspense
                    fallback={
                      <p className="post-status loading" aria-live="polite">
                        Loading…
                      </p>
                    }
                  >
                    <Soul />
                  </Suspense>
                </ErrorBoundary>
              </div>
            )}
          </div>
        </div>
      </section>
      {page === 'work' && <Pinned full />}
      {page === 'timeline' && (
        <section id="timeline" aria-label="Timeline">
          <ErrorBoundary label="The timeline">
            <Timeline full />
          </ErrorBoundary>
        </section>
      )}
      {page === 'writing' && (
        <Writing
          full
          mediumUrl={config.links.find((l) => l.name === 'medium')?.url}
        />
      )}
      {page === 'research' && <Research full />}
      {page === 'more' && <Contact full />}
      <nav className="page-explore" aria-label="Explore more pages">
        <span>Keep exploring</span>
        {Object.entries(PAGES)
          .filter(([key]) => key !== page)
          .map(([key, value]) => (
            <a key={key} {...link(pagePath(key))}>
              {value.title} <span aria-hidden="true">→</span>
            </a>
          ))}
      </nav>
    </div>
  )
}
