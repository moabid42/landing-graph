import { FACETS, TAXONOMY, canonicalTag, tagLabel } from './taxonomy.js'
import {
  parseQuery,
  qualifierMatches,
  qualifierToken,
  updatedDate,
} from './searchQuery.js'

export function facetOptions(items) {
  return Object.fromEntries(
    FACETS.map(({ key }) => [
      key,
      [...new Set(items.flatMap((item) => item[key] || []))].sort((a, b) =>
        tagLabel(key, a).localeCompare(tagLabel(key, b))
      ),
    ])
  )
}

export function filterContent(items, filters, omit = '') {
  const { terms, qualifiers, errors } = parseQuery(filters.query)
  if (errors.length) return []
  const active = qualifiers.filter((q) => q.key !== omit)
  for (const { param } of FACETS)
    if (filters[param] && param !== omit)
      active.push({ key: param, value: filters[param], negative: false })
  return items.filter(
    (item) =>
      active
        .filter((q) => q.negative)
        .every((q) => !qualifierMatches(item, q)) &&
      [...new Set(active.filter((q) => !q.negative).map((q) => q.key))].every(
        (key) => {
          const values = active.filter((q) => !q.negative && q.key === key)
          return key === 'updated'
            ? values.every((q) => qualifierMatches(item, q))
            : values.some((q) => qualifierMatches(item, q))
        }
      ) &&
      terms.every((search) =>
        [
          item.title,
          item.org,
          item.text,
          item.summary,
          item.tldr,
          ...FACETS.flatMap(({ key }) =>
            (item[key] || []).flatMap((value) => [value, tagLabel(key, value)])
          ),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(search)
      )
  )
}

export function readFilters(search, available, paginated = false) {
  const params = new URLSearchParams(search)
  const requestedPage = paginated ? Number(params.get('page')) : 1
  const filters = {
    query: params.get('q') || '',
    domain: '',
    technology: '',
    topic: '',
    currentPage:
      Number.isSafeInteger(requestedPage) && requestedPage > 0
        ? requestedPage
        : 1,
  }
  for (const { key, param } of FACETS) {
    const value = canonicalTag(params.get(param) || '')
    if (available[key]?.includes(value)) filters[param] = value
  }
  // Old links put every kind of tag in ?topic=. Move recognized values to
  // their category, keeping any explicit domain/technology selection.
  const legacy = canonicalTag(params.get('topic') || '')
  if (legacy && !filters.topic) {
    const facet = FACETS.find(
      ({ key }) => TAXONOMY[key][legacy] && available[key]?.includes(legacy)
    )
    if (facet && !filters[facet.param]) filters[facet.param] = legacy
  }
  const parsed = parseQuery(filters.query)
  const additions = FACETS.filter(
    ({ param }) =>
      filters[param] && !parsed.qualifiers.some((q) => q.key === param)
  ).map(({ param }) => qualifierToken(param, filters[param]))
  return {
    query: [filters.query, ...additions].filter(Boolean).join(' '),
    currentPage: filters.currentPage,
    sort: params.get('sort') === 'updated' ? 'updated' : 'default',
  }
}

export function sortContent(items, sort) {
  return sort === 'updated'
    ? [...items].sort((a, b) => updatedDate(b).localeCompare(updatedDate(a)))
    : items
}

export function paginate(items, requestedPage = 1, pageSize = 10) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const page = Math.min(
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1,
    pageCount
  )
  const offset = (page - 1) * pageSize
  return {
    items: items.slice(offset, offset + pageSize),
    page,
    pageCount,
    start: items.length ? offset + 1 : 0,
    end: Math.min(offset + pageSize, items.length),
  }
}
