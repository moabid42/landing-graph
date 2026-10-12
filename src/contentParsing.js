// Shared markdown fields and dates for timeline entries and projects.
export const PROBLEMS = []
export const problem = (file, title, msg) => {
  PROBLEMS.push({ file, title, msg })
  console.warn(`[content] ${file} · ${title}: ${msg}`)
}

// "YYYY-MM" -> decimal year (mid-month); "now" -> null (ongoing).
export function parseDate(s, ctx, field) {
  if (!s || s.trim().toLowerCase() === 'now') return null
  const m = s.trim().match(/^(\d{4})(?:-(\d{1,2}))?$/)
  if (!m) {
    if (ctx)
      problem(
        ctx.file,
        ctx.title,
        `unreadable ${field} "${s}" — use YYYY-MM or "now"`
      )
    return null
  }
  const mo = m[2] ? +m[2] : 6
  if (mo < 1 || mo > 12) {
    if (ctx) problem(ctx.file, ctx.title, `bad month in ${field} "${s}"`)
    return null
  }
  return +m[1] + (mo - 0.5) / 12
}

export const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

// Split "## Title" blocks into `- key: value` fields and a free-text body.
export function parseBlocks(md) {
  const src = md.replace(/<!--[\s\S]*?-->/g, '')
  return src
    .split(/\n(?=## )/)
    .filter((b) => b.trim().startsWith('## '))
    .map((b) => {
      const lines = b.trim().split('\n')
      const title = lines[0].replace(/^## /, '').trim()
      const fields = {}
      const body = []
      for (const ln of lines.slice(1)) {
        // Tolerate a forgotten colon or no space after the list marker.
        const m = ln.match(/^- *([a-z]+):? *(.+)$/)
        if (m) fields[m[1]] = m[2].trim()
        else if (ln.trim() && !ln.startsWith('#')) body.push(ln.trim())
      }
      return { title, fields, body: body.join(' ') }
    })
}
