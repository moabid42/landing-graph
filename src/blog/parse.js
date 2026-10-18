// Blog posts are content/blog/*.md files. Drop a file in, it shows up in
// Writing; delete it, it's gone. The filename is the URL slug
// (/blog/<filename>/). Each post starts with a small frontmatter header:
//
//   ---
//   title: Human-readable title
//   date: YYYY-MM-DD
//   domains: cloud-security, offensive-security
//   languages: python
//   topics: comma, separated
//   summary: one line for search results and share cards
//   updated: YYYY-MM-DD    (optional — the last real edit, for search engines)
//   draft: true            (optional — keeps the post off the site)
//   ---
//
//   Markdown body… (```mermaid fences render as live diagrams)
//
// Pure on purpose: no Vite, no import.meta. plugins/blogMeta.js runs this in
// Node at build time to produce the post index, and the browser runs the same
// function on the raw file to get the body. One parser, so an index can never
// disagree with the post it points at.

import { parseTags } from '../taxonomy.js'
import { readingMinutes } from '../readingTime.js'

function calendarDate(value, field, path) {
  if (!value) return ''
  const date = new Date(`${value}T00:00:00Z`)
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new Error(
      `${path}: invalid ${field} "${value}" — expected a calendar date in YYYY-MM-DD format`
    )
  }
  return value
}

// One file in, one post out.
export function parsePost(path, raw) {
  const slug = path.split('/').pop().replace(/\.md$/, '')
  let meta = {}
  let body = raw
  const fm = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/)
  if (fm) {
    body = raw.slice(fm[0].length)
    for (const line of fm[1].split('\n')) {
      const kv = line.match(/^([A-Za-z]+)\s*:\s*(.*?)\s*$/)
      if (kv) meta[kv[1].toLowerCase()] = kv[2]
    }
  }
  // authoring notes in leading HTML comments never render
  body = body.replace(/^\s*(<!--[\s\S]*?-->\s*)+/, '')
  // The first picture in the body, as written ("./blog/<slug>/01.webp").
  // Search engines show it beside the post; the share card stays og.png.
  const image = body.match(/!\[[^\]\n]*\]\(([^)\s]+)\)/)?.[1] || null
  return {
    slug,
    title: meta.title || slug,
    date: calendarDate(meta.date, 'date', path),
    updated: calendarDate(meta.updated, 'updated', path),
    summary: meta.summary || '',
    readingMinutes: readingMinutes(body),
    draft: (meta.draft || '').toLowerCase() === 'true',
    domains: parseTags(meta.domains),
    languages: parseTags(meta.languages),
    topics: parseTags(meta.topics),
    image,
    body,
  }
}

// The post without its body — everything the Writing list needs to render a
// row and the router needs to resolve a slug.
export function postMeta(path, raw) {
  const post = parsePost(path, raw)
  delete post.body
  return post
}
