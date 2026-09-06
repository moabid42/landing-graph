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
//
// Pure on purpose: no Vite, no import.meta. plugins/blogMeta.js runs this in
// Node at build time to produce the post index, and the browser runs the same
// function on the raw file to get the body. One parser, so an index can never
// disagree with the post it points at.

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
}

// The post without its body — everything the Writing list needs to render a
// row and the router needs to resolve a slug.
export function postMeta(path, raw) {
  const post = parsePost(path, raw)
  delete post.body
  return post
}
