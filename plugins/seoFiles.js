import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// Emits robots.txt and sitemap.xml at build time from site.config.js and the
// files in content/blog. Both are static facts about the site, so generating
// them beats keeping two hand-written files in step with the posts.

const escape = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Enough frontmatter parsing to find the date and skip drafts. src/blog.js
// cannot be imported here: it runs import.meta.glob, which only exists once
// Vite has transformed it.
function posts(dir) {
  let files = []
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.md'))
  } catch {
    return []
  }
  return files
    .map((file) => {
      const raw = readFileSync(join(dir, file), 'utf8')
      const fm = raw.match(/^---\s*\n([\s\S]*?)\n---/)
      const meta = {}
      if (fm) {
        for (const line of fm[1].split('\n')) {
          const kv = line.match(/^([A-Za-z]+)\s*:\s*(.*?)\s*$/)
          if (kv) meta[kv[1].toLowerCase()] = kv[2]
        }
      }
      return {
        slug: file.replace(/\.md$/, ''),
        date: meta.date || '',
        draft: (meta.draft || '').toLowerCase() === 'true',
      }
    })
    .filter((p) => !p.draft)
}

export default function seoFiles({ config, blogDir = 'content/blog' }) {
  const origin = (config.seo?.url || '').replace(/\/+$/, '')

  return {
    name: 'landing-graph:seo-files',
    apply: 'build',
    generateBundle() {
      // With no site url there is nothing absolute to point at, and a
      // sitemap of relative urls is worse than none.
      if (!origin) {
        this.warn(
          'site.config.js has no seo.url — skipping sitemap.xml and robots.txt'
        )
        return
      }

      const urls = [
        { loc: `${origin}/`, priority: '1.0' },
        ...posts(blogDir).map((p) => ({
          loc: `${origin}/#/blog/${p.slug}`,
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
        source: `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`,
      })
    },
  }
}
