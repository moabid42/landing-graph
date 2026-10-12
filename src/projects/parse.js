import { parseBlocks, parseDate, slug, problem } from '../contentParsing.js'

// Projects can be undated. Pinning is an explicit flag on the same entry
// that appears in the full archive; dates never create timeline branches.
export function parseProjects(md, file = 'content/projects.md') {
  return parseBlocks(md)
    .map(({ title, fields, body }) => {
      const ctx = { file, title }
      const start = parseDate(fields.start || fields.date, ctx, 'start')
      const end = parseDate(fields.end, ctx, 'end')
      const link = fields.link || null
      if (link && !/^https?:\/\//.test(link))
        problem(file, title, `link "${link}" is not an http(s) URL — ignored`)
      if (fields.pinned && !['true', 'false'].includes(fields.pinned))
        problem(
          file,
          title,
          `unknown pinned "${fields.pinned}" — use true or false`
        )
      if (end !== null && start !== null && end < start) {
        problem(file, title, '"end" is before "start" — entry skipped')
        return null
      }

      return {
        id: fields.id || slug(`projects-${title}`),
        title,
        text: body,
        org: fields.org || '',
        start,
        end,
        single:
          Boolean(fields.date && !fields.start) ||
          (start !== null && end !== null && end - start < 0.1),
        pinned: fields.pinned === 'true',
        link: link && /^https?:\/\//.test(link) ? link : null,
        visibility: fields.visibility || (link ? 'Public' : 'Internal'),
        topics: [
          ...new Set(
            (fields.topics || '')
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          ),
        ],
      }
    })
    .filter(Boolean)
}
