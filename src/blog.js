// Blog posts are content/blog/*.md files. Drop a file in, it shows up in
// Writing; delete it, it's gone. The filename is the URL slug
// (#/blog/<filename>). Each post starts with a small frontmatter header:
//
//   ---
//   title: Human-readable title
//   date: YYYY-MM-DD
//   topics: comma, separated
//   summary: one line shown in the post list
//   draft: true            (optional — keeps the post off the site)
//   ---
//
//   Markdown body… (```mermaid fences render as live diagrams)
const files = import.meta.glob('../content/blog/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

export const POSTS = Object.entries(files)
  .map(([path, raw]) => {
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
    return {
      slug,
      title: meta.title || slug,
      date: meta.date || '',
      summary: meta.summary || '',
      draft: (meta.draft || '').toLowerCase() === 'true',
      topics: (meta.topics || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      body,
    }
  })
  .filter((p) => !p.draft)
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
