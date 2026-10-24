import { useEffect } from 'react'
import config from '../site.config.js'
import { IconRepo, IconFlask, IconTag, IconBook, IconMail } from './icons.jsx'
import { pagePath } from './paths.js'
import { link } from './router.js'
import ArchiveControls from './ArchiveControls.jsx'
import {
  PROJECTS,
  PINNED_PROJECTS,
  PROJECT_FACETS,
  PROJECT_PROBLEMS,
} from './projects.js'
import {
  RESEARCH,
  PINNED_RESEARCH,
  RESEARCH_FACETS,
  RESEARCH_PROBLEMS,
} from './research.js'
import ContentWarnings from './ContentWarnings.jsx'
import { fmtDate } from './timeline/format.js'
import useArchiveFilters from './useArchiveFilters.js'
import { paginate, filterContent, sortContent } from './archive.js'
import ContentTags from './ContentTags.jsx'
import ResultMeta from './ResultMeta.jsx'

const { identity, links, spokenLanguages: SPOKEN_LANGUAGES } = config
const MAILTO = `mailto:${identity.email}`
const RESEARCHGATE_URL = links.find((l) => l.name === 'researchgate')?.url
const remoteNotes = {
  origin: 'Questions, ideas and conversations.',
  github: 'Public projects and source code.',
  linkedin: 'Professional background and updates.',
  medium: 'Articles and technical writing.',
  researchgate: 'Publications and full texts.',
}

export function SectionLink({ page, children }) {
  return (
    <a className="sec-note section-link" {...link(pagePath(page))}>
      {children} <span aria-hidden="true">→</span>
    </a>
  )
}

const linkLabel = (url) =>
  url.replace(/^https?:\/\/(www\.)?/, '').replace(/^mailto:/, '')

const paperMeta = (href) => {
  let host = null
  try {
    host = new URL(href).hostname.replace(/^www\./, '')
  } catch {
    /* a malformed url still renders, just without its footer */
  }
  return { host, id: href.match(/\/publication\/(\d+)/)?.[1] ?? null }
}

export function Pinned({ full = false }) {
  const filters = useArchiveFilters('work', full, PROJECT_FACETS, true)
  const { currentPage, setCurrentPage } = filters
  const projects = sortContent(filterContent(PROJECTS, filters), filters.sort)
  const pagination = paginate(projects, currentPage)

  useEffect(() => {
    if (full && currentPage !== pagination.page) setCurrentPage(pagination.page)
  }, [full, currentPage, pagination.page, setCurrentPage])

  const changePage = (page) => {
    setCurrentPage(page)
    document.getElementById('project-history-heading')?.scrollIntoView({
      behavior: 'instant',
      block: 'start',
    })
  }

  if (!full && PINNED_PROJECTS.length === 0) return null

  return (
    <section id="work" aria-label="Projects">
      {full && <ContentWarnings problems={PROJECT_PROBLEMS} />}
      {PINNED_PROJECTS.length > 0 && (
        <>
          <div className="sec-head">
            <h2>
              <IconRepo width={16} height={16} /> Pinned
            </h2>
            {!full && <SectionLink page="work">View all projects</SectionLink>}
            {full && (
              <span className="sec-note">{PINNED_PROJECTS.length} pinned</span>
            )}
          </div>
          <div className="pin-grid">
            {(full ? PINNED_PROJECTS : PINNED_PROJECTS.slice(0, 2)).map((w) => (
              <article key={w.id} className="pin-card">
                <h3>
                  <IconRepo width={14} height={14} />
                  {w.link ? (
                    <a href={w.link} target="_blank" rel="noopener noreferrer">
                      {w.title}
                    </a>
                  ) : (
                    <span className="no-link">{w.title}</span>
                  )}
                  <span className="vis-badge">{w.visibility}</span>
                </h3>
                <p className="pin-desc">{w.text}</p>
                <ContentTags item={w} />
              </article>
            ))}
          </div>
        </>
      )}
      {full && PROJECTS.length > 0 && (
        <div className="project-history">
          <div className="sec-head">
            <h2 id="project-history-heading">
              <IconRepo width={16} height={16} /> All projects
            </h2>
            <span className="sec-note">{PROJECTS.length} projects</span>
          </div>
          <ArchiveControls
            label="projects"
            filters={filters}
            items={PROJECTS}
            count={pagination.items.length}
            start={pagination.start}
            matches={projects.length}
            total={PROJECTS.length}
          >
            {projects.length === 0 && (
              <div className="blankslate">
                <IconRepo width={22} height={22} />
                <p className="bs-title">No projects match these filters</p>
                <p className="bs-text">
                  Try another search or clear the filters above.
                </p>
              </div>
            )}
            <ul className="project-list" id="project-history-list">
              {pagination.items.map((project) => (
                <li key={project.id} className="pin-card">
                  {project.start !== null && (
                    <p className="project-date">
                      {fmtDate(project.start)}
                      {!project.single &&
                        ` — ${project.end ? fmtDate(project.end) : 'now'}`}
                    </p>
                  )}
                  <h3 className="project-result-title">
                    <IconRepo width={16} height={16} />
                    {project.link ? (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {project.title}
                      </a>
                    ) : (
                      project.title
                    )}
                  </h3>
                  {project.org && <p className="project-org">{project.org}</p>}
                  <p className="pin-desc">{project.text}</p>
                  <ContentTags item={project} filters={filters} />
                  <ResultMeta item={project} />
                </li>
              ))}
            </ul>
            {pagination.pageCount > 1 && (
              <nav
                className="archive-pagination"
                aria-label="Projects pagination"
              >
                <button
                  type="button"
                  className="gh-btn"
                  aria-label="Previous project page"
                  aria-controls="project-history-list"
                  disabled={pagination.page === 1}
                  onClick={() => changePage(pagination.page - 1)}
                >
                  ← Previous
                </button>
                <span role="status">
                  Page {pagination.page} of {pagination.pageCount}
                </span>
                <button
                  type="button"
                  className="gh-btn"
                  aria-label="Next project page"
                  aria-controls="project-history-list"
                  disabled={pagination.page === pagination.pageCount}
                  onClick={() => changePage(pagination.page + 1)}
                >
                  Next →
                </button>
              </nav>
            )}
          </ArchiveControls>
        </div>
      )}
    </section>
  )
}

export function Research({ full = false }) {
  const filters = useArchiveFilters('research', full, RESEARCH_FACETS)
  const papers = full
    ? sortContent(filterContent(RESEARCH, filters), filters.sort)
    : PINNED_RESEARCH
  if (!full && papers.length === 0) return null

  return (
    <section id="research" aria-label="Research">
      {full && <ContentWarnings problems={RESEARCH_PROBLEMS} />}
      <div className="sec-head">
        <h2>
          <IconFlask width={16} height={16} /> Research
        </h2>
        {!full && <SectionLink page="research">View all research</SectionLink>}
        {full && RESEARCHGATE_URL && (
          <a
            className="sec-note"
            href={RESEARCHGATE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            researchgate <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
      <ArchiveControls
        enabled={full && RESEARCH.length > 0}
        label="research"
        filters={filters}
        items={RESEARCH}
        count={papers.length}
        matches={papers.length}
        total={RESEARCH.length}
      >
        {RESEARCH.length > 0 && papers.length === 0 && (
          <div className="blankslate">
            <IconFlask width={22} height={22} />
            <p className="bs-title">No papers match these filters</p>
            <p className="bs-text">
              Try another search or clear the filters above.
            </p>
          </div>
        )}
        {RESEARCH.length === 0 ? (
          <div className="blankslate">
            <IconFlask width={22} height={22} />
            <p className="bs-title">Papers are being indexed</p>
            <p className="bs-text">
              Titles and a short tl;dr will be listed here, each opening the
              full text on ResearchGate.
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
          <ul className="research-releases" aria-label="Research publications">
            {papers.map((paper) => {
              const { host, id } = paperMeta(paper.href)
              return (
                <li key={paper.title} className="research-release">
                  <div className="release-meta">
                    <span className="release-label">Publication</span>
                    {id && (
                      <span className="release-tag" title="Publication ID">
                        <IconTag width={14} height={14} /> #{id}
                      </span>
                    )}
                    {host && <span className="release-host">{host}</span>}
                  </div>
                  <article className="release-card">
                    <div className="release-body">
                      <h3>
                        <a
                          href={paper.href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {paper.title}
                        </a>
                      </h3>
                      <p className="release-summary">{paper.tldr}</p>
                      <ContentTags
                        item={paper}
                        filters={full ? filters : undefined}
                        className="release-topics"
                      />
                      {full && <ResultMeta item={paper} />}
                    </div>
                    <div className="release-footer">
                      <a
                        href={paper.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <IconBook width={16} height={16} />
                        Read paper
                        <span className="release-arrow" aria-hidden="true">
                          ↗
                        </span>
                      </a>
                    </div>
                  </article>
                </li>
              )
            })}
          </ul>
        )}
      </ArchiveControls>
    </section>
  )
}

export function Contact({ full = false }) {
  return (
    <section id="contact" aria-label="Contact">
      <div className="sec-head">
        <h2>
          <IconMail width={16} height={16} /> {full ? 'Remotes' : 'Contact'}
        </h2>
        {!full && (
          <SectionLink page="more">All profiles &amp; contact</SectionLink>
        )}
        {full && <span className="sec-note">remotes</span>}
      </div>
      <div className="remote-block">
        <div className="remote-head">
          <code>$ git remote -v</code>
        </div>
        <table className="remotes">
          <tbody>
            {(full
              ? links
              : links.filter((l) => ['origin', 'github'].includes(l.name))
            ).map((l) => (
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
                  {full && remoteNotes[l.name] && (
                    <p className="remote-description">{remoteNotes[l.name]}</p>
                  )}
                </td>
                <td className="kind">({l.kind})</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {SPOKEN_LANGUAGES.length > 0 && (
        <div className="spoken-languages">
          {/* <h3>Languages I speak</h3> */}
          <div className="spoken-language-bar" aria-hidden="true">
            {SPOKEN_LANGUAGES.map((language) => (
              <span
                key={language.name}
                style={{ background: language.color }}
              />
            ))}
          </div>
          <ul className="spoken-language-list">
            {SPOKEN_LANGUAGES.map((language) => (
              <li key={language.name}>
                <span
                  className="language-dot"
                  style={{ background: language.color }}
                  aria-hidden="true"
                />
                <span>
                  {language.name}{' '}
                  <span className="spoken-language-level">
                    {language.level}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <a className="gh-btn primary big-cta" href={MAILTO}>
        <IconMail width={14} height={14} /> Email me
      </a>
    </section>
  )
}
