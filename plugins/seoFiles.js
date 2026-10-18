import config from '../site.config.js'
import { allTags } from '../src/taxonomy.js'
import {
  ORIGIN,
  absolute,
  feedPath,
  homePath,
  postPath,
  pagePath,
} from '../src/paths.js'
import { PAGES } from '../src/pages.js'
import { postImage } from '../src/seo/meta.js'
import { readPosts } from './posts.js'

// Emits robots.txt, sitemap.xml and feed.xml at build time from
// site.config.js and the files in content/blog. All three are static facts
// about the site, so generating them beats keeping hand-written files in step
// with the posts. The feed is also served on demand during development.

// AI crawlers, named one by one. `User-agent: *` already lets them in, but
// several hosts and CDNs block these by default unless a site says otherwise,
// and an explicit group is how a site says it. Being quoted in an assistant's
// answer needs the assistant to have read the page first.
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
]

const robots = () =>
  'User-agent: *\nAllow: /\n\n' +
  AI_CRAWLERS.map((bot) => `User-agent: ${bot}\n`).join('') +
  'Allow: /\n\n' +
  `Sitemap: ${ORIGIN}/sitemap.xml\n`

const escape = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// RSS dates are RFC 822; a post's frontmatter is a plain YYYY-MM-DD.
const rfc822 = (date) => {
  const d = new Date(`${date}T00:00:00Z`)
  return Number.isNaN(d.valueOf()) ? null : d.toUTCString()
}

function feed(posts) {
  const self = absolute(feedPath())
  const items = posts.map((p) => {
    const link = absolute(postPath(p.slug))
    const date = rfc822(p.date)
    return (
      '    <item>\n' +
      `      <title>${escape(p.title)}</title>\n` +
      `      <link>${escape(link)}</link>\n` +
      `      <guid isPermaLink="true">${escape(link)}</guid>\n` +
      (date ? `      <pubDate>${date}</pubDate>\n` : '') +
      (p.summary
        ? `      <description>${escape(p.summary)}</description>\n`
        : '') +
      allTags(p)
        .map((t) => `      <category>${escape(t)}</category>\n`)
        .join('') +
      '    </item>'
    )
  })

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n' +
    '  <channel>\n' +
    `    <title>${escape(config.seo.title || config.identity.name)}</title>\n` +
    `    <link>${escape(absolute(homePath()))}</link>\n` +
    `    <description>${escape(config.seo.description)}</description>\n` +
    '    <language>en</language>\n' +
    `    <atom:link href="${escape(self)}" rel="self" type="application/rss+xml" />\n` +
    items.join('\n') +
    '\n  </channel>\n</rss>\n'
  )
}

export default function seoFiles({ blogDir = 'content/blog' } = {}) {
  return {
    name: 'landing-graph:seo-files',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (
          !ORIGIN ||
          !['GET', 'HEAD'].includes(req.method) ||
          req.url?.split('?')[0] !== feedPath()
        )
          return next()

        try {
          // Read on each request so edits, new posts and drafts stay in sync
          // without a rebuild. Handle this before Vite's HTML fallback.
          const xml = feed(readPosts(blogDir))
          res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8')
          res.setHeader('Cache-Control', 'no-cache')
          res.end(req.method === 'HEAD' ? undefined : xml)
        } catch (error) {
          next(error)
        }
      })
    },
    generateBundle() {
      // With no site url there is nothing absolute to point at, and a
      // sitemap of relative urls is worse than none.
      if (!ORIGIN) {
        this.warn(
          'site.config.js has no seo.url — skipping sitemap.xml and robots.txt'
        )
        return
      }

      const posts = readPosts(blogDir)

      const urls = [
        // The README changes whenever a post does; the newest date says so.
        {
          loc: absolute(homePath()),
          lastmod:
            posts
              .map((p) => p.updated || p.date)
              .sort()
              .pop() || null,
          priority: '1.0',
        },
        ...Object.keys(PAGES).map((page) => ({
          loc: absolute(pagePath(page)),
          lastmod:
            page === 'writing'
              ? posts
                  .map((post) => post.updated || post.date)
                  .sort()
                  .pop() || null
              : null,
          priority: '0.8',
        })),
        ...posts.map((p) => ({
          loc: absolute(postPath(p.slug)),
          lastmod: p.updated || p.date || null,
          priority: '0.7',
          // Lets image search find a post by its picture.
          image: postImage(p),
        })),
      ]

      const sitemap =
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' +
        ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
        urls
          .map(
            (u) =>
              '  <url>\n' +
              `    <loc>${escape(u.loc)}</loc>\n` +
              (u.lastmod
                ? `    <lastmod>${escape(u.lastmod)}</lastmod>\n`
                : '') +
              `    <priority>${u.priority}</priority>\n` +
              (u.image
                ? '    <image:image>\n' +
                  `      <image:loc>${escape(u.image)}</image:loc>\n` +
                  '    </image:image>\n'
                : '') +
              '  </url>'
          )
          .join('\n') +
        '\n</urlset>\n'

      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap })
      this.emitFile({
        type: 'asset',
        fileName: 'feed.xml',
        source: feed(posts),
      })
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: robots(),
      })
    },
  }
}
