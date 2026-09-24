import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import config from '../site.config.js'
import { ORIGIN, absolute, postPath } from '../src/paths.js'
import { postMarkdown, readPosts } from './posts.js'

// Emits llms.txt and llms-full.txt at build time (https://llmstxt.org).
//
// Most AI crawlers do not run scripts, and this site is one bundle that draws
// everything with them. These two files are the same site as plain markdown:
// llms.txt is the map — who this is, what they wrote, where else they are —
// and llms-full.txt is everything, every post and the whole timeline, in one
// fetch. Both are built from the files the page itself renders, so they
// cannot drift from it.

const { identity, seo, links, research = [], work = [], stack = [] } = config

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

function header(posts) {
  const lines = [
    `# ${identity.name}`,
    '',
    `> ${seo.description}`,
    '',
    identity.tagline,
  ]
  if (identity.status) lines.push('', `Currently: ${identity.status}.`)
  if (identity.location) lines.push(`Based in: ${identity.location}.`)

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
  if (work.length) {
    lines.push('', '## Projects', '')
    for (const w of work) {
      const name = w.href ? `[${w.title}](${w.href})` : w.title
      lines.push(`- ${name}: ${w.text}`)
    }
  }
  if (stack.length) {
    lines.push('', '## Skills', '')
    for (const s of stack) lines.push(`- ${s.cat}: ${s.items}`)
  }
  lines.push('', '## Profiles', '')
  for (const l of links) lines.push(`- [${l.name}](${l.url})`)
  return lines.join('\n') + '\n'
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
        header(posts) +
        '\n## Optional\n\n' +
        `- [Everything above, plus the full career timeline and every post in full](${ORIGIN}/llms-full.txt)\n`

      const career = config.tracks
        .map((t) => track(timelineDir, t))
        .filter(Boolean)
        .join('\n')

      const full =
        header(posts) +
        (career ? `\n# Career\n\n${career}` : '') +
        posts
          .map(
            (p) => `
---

${postMarkdown(p)}`
          )
          .join('')

      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: index })
      this.emitFile({ type: 'asset', fileName: 'llms-full.txt', source: full })
    },
  }
}
