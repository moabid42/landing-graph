import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import config from '../site.config.js'
import { PAGES } from '../src/pages.js'
import { absolute, postPath } from '../src/paths.js'
import { absoluteImages } from './posts.js'
import { taxonomyLines } from '../src/taxonomy.js'
import { parseResearch } from '../src/research/parse.js'

function timelineFile(timelineDir, key) {
  try {
    return readFileSync(join(timelineDir, `${key}.md`), 'utf8')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/^# .*\n/, '')
      .trim()
  } catch {
    return ''
  }
}

/** A dedicated page's actual content, for crawlers and markdown readers. */
export function pageMarkdown(page, posts, timelineDir) {
  const info = PAGES[page]
  const lines = [`# ${info.title}`, '', info.description, '']
  if (page === 'soul') {
    lines.push(
      absoluteImages(readFileSync(join(timelineDir, '..', 'soul.md'), 'utf8'))
        .replace(/<!--[\s\S]*?-->/g, '')
        .trim()
    )
  } else if (page === 'writing') {
    for (const post of posts) {
      lines.push(
        `## [${post.title}](${absolute(postPath(post.slug))})`,
        '',
        [post.date, `${post.readingMinutes} min read`]
          .filter(Boolean)
          .join(' · '),
        ...taxonomyLines(post),
        '',
        post.summary || '',
        ''
      )
    }
  } else if (page === 'research') {
    const research = parseResearch(
      readFileSync(join(timelineDir, '..', 'research.md'), 'utf8')
    )
    for (const paper of research)
      lines.push(
        `## [${paper.title}](${paper.href})`,
        '',
        paper.tldr,
        '',
        ...taxonomyLines(paper),
        ''
      )
  } else if (page === 'work') {
    lines.push(
      readFileSync(join(timelineDir, '..', 'projects.md'), 'utf8')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/^# .*\n/, '')
        .trim()
    )
  } else if (page === 'timeline') {
    for (const track of config.tracks)
      lines.push(
        `## ${track.label}`,
        '',
        timelineFile(timelineDir, track.key),
        ''
      )
    try {
      lines.push(
        '## Milestones',
        '',
        readFileSync(join(timelineDir, '..', 'tags.md'), 'utf8').replace(
          /<!--[\s\S]*?-->/g,
          ''
        )
      )
    } catch {
      /* Milestones are optional. */
    }
  } else if (page === 'more') {
    for (const remote of config.links)
      lines.push(`- [${remote.name}](${remote.url})`)
    if (config.identity.location) lines.push('', config.identity.location)
    if (config.spokenLanguages.length) {
      lines.push('', '## Languages I speak', '')
      for (const language of config.spokenLanguages)
        lines.push(`- ${language.name}: ${language.level}`)
    }
  }
  return lines.join('\n') + '\n'
}
