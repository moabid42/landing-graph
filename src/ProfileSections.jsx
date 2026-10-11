import config from '../site.config.js'
import { IconRepo, IconFlask, IconTag, IconBook, IconMail } from './icons.jsx'
import { pagePath } from './paths.js'
import { link } from './router.js'
import ArchiveControls from './ArchiveControls.jsx'
import { ENTRIES } from './content.js'
import { fmtDate } from './timeline/format.js'
import useArchiveFilters from './useArchiveFilters.js'

const {
  identity,
  links,
  work: WORK,
  research: RESEARCH,
  stack: STACK,
  languages: LANGUAGES,
} = config
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
  const projects = ENTRIES.filter((entry) => entry.track === 'projects').sort(
    (a, b) => b.start - a.start
  )
  return (
    <section id="work" aria-label="Selected work">
      <div className="sec-head">
        <h2>
          <IconRepo width={16} height={16} /> Pinned
        </h2>
        {!full && <SectionLink page="work">View all work</SectionLink>}
        {full && <span className="sec-note">{WORK.length} projects</span>}
      </div>
      <div className="pin-grid">
        {(full ? WORK : WORK.slice(0, 2)).map((w) => (
          <article key={w.title} className="pin-card">
            <h3>
              <IconRepo width={14} height={14} />
              {w.href ? (
                <a href={w.href} target="_blank" rel="noopener noreferrer">
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
      {full && projects.length > 0 && (
        <div className="project-history">
          <div className="sec-head">
            <h2>
              <IconRepo width={16} height={16} /> Project history
            </h2>
            <span className="sec-note">from the graph</span>
          </div>
          <ul className="project-list">
            {projects.map((project) => (
              <li key={project.id} className="pin-card">
                <p className="project-date">
                  {fmtDate(project.start)}
                  {!project.single &&
                    ` — ${project.end ? fmtDate(project.end) : 'now'}`}
                </p>
                <h3>{project.title}</h3>
                {project.org && <p className="project-org">{project.org}</p>}
                <p className="pin-desc">{project.text}</p>
                {project.meta && (
                  <div className="pin-topics">
                    {project.meta.split(' · ').map((value) => (
                      <span key={value} className="topic">
                        {value}
                      </span>
                    ))}
                  </div>
                )}
                {project.link && (
                  <a
                    className="project-link"
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Learn more <span aria-hidden="true">↗</span>
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

export function Research({ full = false }) {
  const { query, setQuery, topic, setTopic } = useArchiveFilters(
    'research',
    full
  )
  const search = query.trim().toLowerCase()
  const topics = [
    ...new Set(RESEARCH.flatMap((paper) => paper.topics || [])),
  ].sort()
  const papers = full
    ? RESEARCH.filter(
        (paper) =>
          (!topic || paper.topics?.includes(topic)) &&
          (!search ||
            [paper.title, paper.tldr, ...(paper.topics || [])]
              .join(' ')
              .toLowerCase()
              .includes(search))
      )
    : RESEARCH.slice(0, 1)
  return (
    <section id="research" aria-label="Research">
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
      {full && RESEARCH.length > 0 && (
        <ArchiveControls
          label="research"
          query={query}
          setQuery={setQuery}
          topic={topic}
          setTopic={setTopic}
          topics={topics}
          count={papers.length}
          total={RESEARCH.length}
        />
      )}
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
            Titles and a short tl;dr will be listed here, each opening the full
            text on ResearchGate.
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
                    {paper.topics?.length > 0 && (
                      <div className="release-topics">
                        {paper.topics.map((topic, i) => (
                          <span key={`${topic}-${i}`} className="topic">
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
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
    </section>
  )
}

export function Stack({ full = false }) {
  return (
    <section id="stack" aria-label="Stack">
      <div className="sec-head">
        <h2>
          <IconTag width={16} height={16} />{' '}
          {full ? 'Languages & tools' : 'Stack'}
        </h2>
        {!full && <SectionLink page="stack">Explore the stack</SectionLink>}
        {full && <span className="sec-note">languages &amp; tools</span>}
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
        {(full ? STACK : STACK.slice(0, 1)).map((s) => (
          <div key={s.cat} className="stack-row">
            <dt>{s.cat}</dt>
            <dd>
              {full ? (
                <div className="stack-items">
                  {s.items.split(' · ').map((item) => (
                    <span key={item} className="topic">
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                s.items
              )}
            </dd>
          </div>
        ))}
      </dl>
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
      <a className="gh-btn primary big-cta" href={MAILTO}>
        <IconMail width={14} height={14} /> Email me
      </a>
    </section>
  )
}
