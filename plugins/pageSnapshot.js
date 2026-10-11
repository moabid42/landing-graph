import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import config from '../site.config.js'
import { PAGES } from '../src/pages.js'
import { absolute, postPath } from '../src/paths.js'
import { absoluteImages } from './posts.js'

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
        [post.date, `${post.readingMinutes} min read`, ...(post.topics || [])]
          .filter(Boolean)
          .join(' · '),
        '',
        post.summary || '',
        ''
      )
    }
  } else if (page === 'research') {
    for (const paper of config.research)
      lines.push(
        `## [${paper.title}](${paper.href})`,
        '',
        paper.tldr,
        '',
        ...(paper.topics || []),
        ''
      )
  } else if (page === 'work') {
    for (const project of config.work)
      lines.push(
        `## ${project.href ? `[${project.title}](${project.href})` : project.title}`,
        '',
        project.text,
        '',
        project.topics.join(' · '),
        ''
      )
    lines.push('## Project history', '', timelineFile(timelineDir, 'projects'))
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
  } else if (page === 'stack') {
    lines.push(
      '## Languages',
      '',
      config.languages.map((language) => language.name).join(' · '),
      ''
    )
    for (const category of config.stack)
      lines.push(`## ${category.cat}`, '', category.items, '')
  } else if (page === 'more') {
    for (const remote of config.links)
      lines.push(`- [${remote.name}](${remote.url})`)
    if (config.identity.location) lines.push('', config.identity.location)
  }
  return lines.join('\n') + '\n'
}
