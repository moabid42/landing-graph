// Importing a post with `?meta` yields its frontmatter and nothing else.
//
// The Writing list needs nine titles, dates and summaries. It does not need
// nine blog posts. Globbing content/blog/*.md as `?raw` put every word of
// every post in the entry chunk — 40 kB gzipped of prose downloaded before
// first paint, by every visitor, growing with each new post. `?meta` is the
// index; the bodies stay behind a dynamic import() and load when a post is
// actually opened.
import { readFileSync } from 'node:fs'
import { postMeta } from '../src/blog/parse.js'

// `?meta`, whether Vite hands it to us alone or alongside its own params.
const IS_META = /\.md\?(?:.*&)?meta(?:&|$)/

export default function blogMeta() {
  return {
    name: 'blog-meta',
    // Ahead of Vite's own `?raw` handling, which would otherwise claim the id.
    enforce: 'pre',

    load(id) {
      if (!IS_META.test(id)) return null
      const file = id.split('?')[0]
      // Editing a post in dev should refresh the list, not just the body.
      this.addWatchFile(file)
      return `export default ${JSON.stringify(
        postMeta(file, readFileSync(file, 'utf8'))
      )}`
    },
  }
}
