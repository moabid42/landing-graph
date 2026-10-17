import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import config from '../site.config.js'
import { ORIGIN, absolute, postPath, pagePath } from '../src/paths.js'
import { PAGES } from '../src/pages.js'
import { postMarkdown, readPosts } from './posts.js'
import { pageMarkdown } from './pageSnapshot.js'
import { parseProjects } from '../src/projects/parse.js'

// Emits llms.txt and llms-full.txt at build time (https://llmstxt.org).
//
// Most AI crawlers do not run scripts, and this site is one bundle that draws
// everything with them. These two files are the same site as plain markdown:
// llms.txt is the map — who this is, what they wrote, where else they are —
// and llms-full.txt is everything, every post and the whole timeline, in one
// fetch. Both are built from the files the page itself renders, so they
// cannot drift from it.

const { identity, seo, links, research = [], spokenLanguages = [] } = config

// A timeline file is already readable markdown once its editing notes and
// its "# Work — timeline entries" heading are gone.
function track(dir, { key, label }) {
  let md
  try {
    md = readFileSync(join(dir, `${key}.md`), 'utf8')
  } catch {
    return ''
  }
  const entries = md
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^# .*\n/, '')
    .replace(/^## /gm, '### ')
    .trim()
  return entries ? `## ${label ?? key}\n\n${entries}\n` : ''
}

export function header(posts, timelineDir = 'content/timeline') {
  const projects = parseProjects(
    readFileSync(join(timelineDir, '..', 'projects.md'), 'utf8')
  )
  const lines = [
    `# ${identity.name}`,
    '',
    `> ${seo.description}`,
    '',
    identity.tagline,
  ]
  if (identity.status) lines.push('', `Currently: ${identity.status}.`)
  if (identity.location) lines.push(`Based in: ${identity.location}.`)

  lines.push('', '## Pages', '')
  for (const [page, info] of Object.entries(PAGES))
    lines.push(
      `- [${info.title}](${absolute(pagePath(page))}): ${info.description}`
    )

  if (posts.length) {
    lines.push('', '## Posts', '')
    for (const p of posts) {
      const url = absolute(postPath(p.slug))
      lines.push(`- [${p.title}](${url})${p.summary ? `: ${p.summary}` : ''}`)
    }
  }
  if (research.length) {
    lines.push('', '## Research', '')
    for (const r of research) lines.push(`- [${r.title}](${r.href}): ${r.tldr}`)
  }
  if (projects.length) {
    lines.push('', '## Projects', '')
    for (const project of projects) {
      const name = project.link
        ? `[${project.title}](${project.link})`
        : project.title
      lines.push(`- ${name}: ${project.text}`)
    }
  }
  if (spokenLanguages.length) {
    lines.push('', '## Languages I speak', '')
    for (const language of spokenLanguages)
      lines.push(`- ${language.name}: ${language.level}`)
  }
  lines.push('', '## Profiles', '')
  for (const l of links) lines.push(`- [${l.name}](${l.url})`)
  return lines.join('\n') + '\n'
}

/** Who this is, what they wrote and the whole timeline, as markdown. */
export function profile(posts, timelineDir) {
  const career = config.tracks
    .map((t) => track(timelineDir, t))
    .filter(Boolean)
    .join('\n')
  return (
    header(posts, timelineDir) +
    `\n${pageMarkdown('work', posts, timelineDir)}` +
    `\n${pageMarkdown('soul', posts, timelineDir)}` +
    (career ? `\n# Career\n\n${career}` : '')
  )
}

export default function llmsFiles({
  blogDir = 'content/blog',
  timelineDir = 'content/timeline',
} = {}) {
  return {
    name: 'landing-graph:llms-files',
    apply: 'build',
    generateBundle() {
      // Every link in these files is absolute; without a site url there is
      // nothing to point them at.
      if (!ORIGIN) return

      const posts = readPosts(blogDir, { body: true })

      const index =
        header(posts, timelineDir) +
        '\n## Optional\n\n' +
        `- [Everything above, plus the full career timeline and every post in full](${ORIGIN}/llms-full.txt)\n`

      const full =
        profile(posts, timelineDir) +
        posts.map((p) => `\n---\n\n${postMarkdown(p)}`).join('')

      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: index })
      this.emitFile({ type: 'asset', fileName: 'llms-full.txt', source: full })
    },
  }
}
