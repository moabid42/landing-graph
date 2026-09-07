import { ORIGIN, absolute, homePath, postPath } from '../src/paths.js'
import { readPosts } from './posts.js'

// Emits robots.txt and sitemap.xml at build time from site.config.js and the
// files in content/blog. Both are static facts about the site, so generating
// them beats keeping two hand-written files in step with the posts.

const escape = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

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
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`,
      })
    },
  }
}
