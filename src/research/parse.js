import { parseBlocks, problem } from '../contentParsing.js'
import { parseTags } from '../taxonomy.js'
import { dateValue } from '../searchQuery.js'

export function parseResearch(md, file = 'content/research.md') {
  return parseBlocks(md)
    .map(({ title, fields, body }) => {
      if (!fields.link || !/^https?:\/\//.test(fields.link)) {
        problem(file, title, 'missing or invalid http(s) link — entry skipped')
        return null
      }
      if (fields.pinned && !['true', 'false'].includes(fields.pinned))
        problem(
          file,
          title,
          `unknown pinned "${fields.pinned}" — use true or false`
        )
      if (fields.updated && !dateValue(fields.updated))
        problem(
          file,
          title,
          `invalid updated "${fields.updated}" — use YYYY-MM-DD`
        )

      return {
        title,
        tldr: body,
        href: fields.link,
        pinned: fields.pinned === 'true',
        updated: dateValue(fields.updated),
        domains: parseTags(fields.domains),
        languages: parseTags(fields.languages),
        topics: parseTags(fields.topics),
      }
    })
    .filter(Boolean)
}
