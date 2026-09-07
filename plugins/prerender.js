// Gives every route a real html file with its own head.
//
// The app is one bundle that renders both routes, so without this the build
// emits a single index.html and every post shares the site's title, the site's
// description and the site's canonical url until scripts run. Crawlers and
// link unfurlers frequently do not get that far.
//
// So: the seo block in index.html is written from site.config.js rather than
// kept in step by hand, and after the build each post gets a copy of that html
// with the block swapped for its own. Same bundle, same assets, one small file
// per post — and a url that answers 200 with the right <title> before a line
// of javascript has run.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { isOpenGraph, jsonLd, tagsFor } from '../src/seo/meta.js'
import { BASE, absolute, feedPath, postPath } from '../src/paths.js'
import { readPosts } from './posts.js'

// The placeholder in index.html, and the fence the post pages cut along.
const MARKER = '<!--seo-->'
const START = '<!--seo:start-->'
const END = '<!--seo:end-->'
const BLOCK = new RegExp(`${START}[\\s\\S]*?${END}`)

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** The whole head block for one route, fenced so it can be replaced later. */
function head(post, indent = '    ') {
  const rows = tagsFor(post)
    .filter(([, , value]) => value)
    .map(([kind, key, value]) => {
      if (kind === 'title') return `<title>${esc(value)}</title>`
      if (kind === 'link') return `<link rel="${key}" href="${esc(value)}" />`
      const attr = isOpenGraph(key) ? 'property' : 'name'
      return `<meta ${attr}="${key}" content="${esc(value)}" />`
    })

  // Feed autodiscovery: what a reader looks for when someone pastes the site
  // url into it. The same on every route, so it is written here rather than
  // kept in step by the runtime.
  const feed = absolute(feedPath())
  if (feed) {
    rows.push(
      `<link rel="alternate" type="application/rss+xml" href="${esc(feed)}" />`
    )
  }

  const ld = jsonLd(post)
  if (ld) {
    // A literal "</script>" inside the json would close the tag early.
    const json = JSON.stringify(ld).replace(/</g, '\\u003c')
    rows.push(`<script type="application/ld+json">${json}</script>`)
  }

  return [START, ...rows, END].join(`\n${indent}`)
}

export default function prerender({ blogDir = 'content/blog' } = {}) {
  let outDir = 'dist'

  return {
    name: 'landing-graph:prerender',

    configResolved(resolved) {
      outDir = resolved.build.outDir
    },

    // Dev and build both get the generated block, so what you see locally is
    // what ships.
    transformIndexHtml(html) {
      return html.includes(MARKER) ? html.replace(MARKER, head(null)) : html
    },

    // After Vite has written index.html, so the copies carry the real hashed
    // asset urls rather than a guess at them.
    writeBundle() {
      const index = join(outDir, 'index.html')
      const html = readFileSync(index, 'utf8')

      if (!BLOCK.test(html)) {
        this.warn(
          `index.html has no ${MARKER} placeholder — post pages will share the site's head`
        )
      }

      for (const post of readPosts(blogDir)) {
        // postPath is base-prefixed ('/landing-graph/blog/x/'); on disk the
        // base IS the output directory, so only what follows it is a path.
        const file = join(
          outDir,
          postPath(post.slug).slice(BASE.length),
          'index.html'
        )
        mkdirSync(dirname(file), { recursive: true })
        writeFileSync(file, html.replace(BLOCK, head(post)))
      }

      // GitHub Pages serves this for anything that is not a file. Every real
      // route above is, so it is reached only by urls that genuinely are not
      // here — and the app falls back to the README.
      writeFileSync(join(outDir, '404.html'), html)
    },
  }
}
