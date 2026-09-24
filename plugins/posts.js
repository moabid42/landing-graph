// The post list, read from disk in Node. src/blog/index.js cannot be imported
// here — it runs import.meta.glob, which only exists once Vite has transformed
// it — but src/blog/parse.js is deliberately pure, so the build and the
// browser agree on what a post is and which ones are drafts.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parsePost, postMeta } from '../src/blog/parse.js'

/**
 * Every publishable post in a directory, newest first. The bodies stay behind
 * unless asked for — most callers only need the index.
 */
export function readPosts(dir, { body = false } = {}) {
  const read = body ? parsePost : postMeta
  let files = []
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.md'))
  } catch {
    // No content/blog at all is a site without a Writing section, not an error.
    return []
  }
  return files
    .map((f) => read(f, readFileSync(join(dir, f), 'utf8')))
    .filter((p) => !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}
