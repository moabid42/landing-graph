import config from '../site.config.js'
import { ORIGIN, absolute, feedPath, homePath, postPath } from '../src/paths.js'
import { readPosts } from './posts.js'

// Emits robots.txt, sitemap.xml and feed.xml at build time from
// site.config.js and the files in content/blog. All three are static facts
// about the site, so generating them beats keeping hand-written files in step
// with the posts.

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
      p.topics
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
    apply: 'build',
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
          lastmod: posts[0]?.date || null,
          priority: '1.0',
        },
        ...posts.map((p) => ({
          loc: absolute(postPath(p.slug)),
          lastmod: p.date || null,
          priority: '0.7',
        })),
      ]

      const sitemap =
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        urls
          .map(
            (u) =>
              '  <url>\n' +
              `    <loc>${escape(u.loc)}</loc>\n` +
              (u.lastmod
                ? `    <lastmod>${escape(u.lastmod)}</lastmod>\n`
                : '') +
              `    <priority>${u.priority}</priority>\n` +
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
        source: `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`,
      })
    },
  }
}
