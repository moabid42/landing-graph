// Shared markdown fields and dates for timeline entries, projects and research.
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

const FIELD_RE =
  /^- *(id|org|start|end|date|topics|time|link|highlight|pinned|domains|languages|visibility|updated)(?:: *| +)(.+)$/

// Keep paragraphs and bullet lists separate, joining wrapped lines within each.
function parseBody(lines) {
  const blocks = []
  let current = null
  for (const line of lines) {
    if (!line.trim()) {
      current = null
      continue
    }
    const item = line.match(/^\s*[-*+]\s+(.+)$/)
    if (item) {
      if (current?.type !== 'list') {
        current = { type: 'list', items: [] }
        blocks.push(current)
      }
      current.items.push(item[1].trim())
    } else if (current?.type === 'list') {
      const last = current.items.length - 1
      current.items[last] += ` ${line.trim()}`
    } else if (current?.type === 'paragraph') {
      current.text += ` ${line.trim()}`
    } else {
      current = { type: 'paragraph', text: line.trim() }
      blocks.push(current)
    }
  }
  return blocks
}

// Split "## Title" blocks into fields and a description. An explicit
// `- description:` owns its indented lines; unindented fields can follow it.
// Free-text bodies are still accepted for existing content.
export function parseBlocks(md) {
  const src = md.replace(/\r\n?/g, '\n').replace(/<!--[\s\S]*?-->/g, '')
  return src
    .split(/\n(?=## )/)
    .filter((b) => b.trim().startsWith('## '))
    .map((b) => {
      const lines = b.trim().split('\n')
      const title = lines[0].replace(/^## /, '').trim()
      const fields = {}
      const body = []
      let inBody = false
      for (let i = 1; i < lines.length; i++) {
        const ln = lines[i]
        const description = !inBody && ln.match(/^- *description: *(.*)$/)
        if (description) {
          body.push('', description[1])
          while (
            i + 1 < lines.length &&
            (!lines[i + 1].trim() || /^[ \t]/.test(lines[i + 1]))
          ) {
            body.push(lines[++i].replace(/^(?: {2}|\t)/, ''))
          }
          body.push('')
          continue
        }
        if (!ln.trim()) {
          body.push('')
          continue
        }
        // Tolerate a forgotten colon or no space after the list marker.
        const m = !inBody && ln.match(FIELD_RE)
        if (m) fields[m[1]] = m[2].trim()
        else if (!ln.startsWith('#')) {
          inBody = true
          body.push(ln)
        }
      }
      return {
        title,
        fields,
        body: body
          .map((line) => line.trim())
          .filter(Boolean)
          .join(' '),
        bodyBlocks: parseBody(body),
      }
    })
}
