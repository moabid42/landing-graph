import { canonicalTag, tagLabel } from './taxonomy.js'

export const LANGUAGES = {
  assembly: '#6e4c13',
  c: '#555555',
  cpp: '#f34b7d',
  go: '#00add8',
  javascript: '#f1e05a',
  python: '#3572a5',
  solidity: '#aa6746',
}

export const SEARCH_FACETS = [
  { param: 'domain', key: 'domains', title: 'Domain', heading: 'Domains' },
  { param: 'topic', key: 'topics', title: 'Topic', heading: 'Topics' },
  {
    param: 'language',
    key: 'languages',
    title: 'Language',
    heading: 'Languages',
  },
]

const KEYS = {
  domain: 'domain',
  language: 'language',
  lang: 'language',
  topic: 'topic',
  updated: 'updated',
}
const unquote = (value) => value.replace(/^(["'])([\s\S]*)\1$/, '$2')

export function parseQuery(query = '') {
  const tokens = query.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || []
  const terms = []
  const qualifiers = []
  const errors = []
  for (const raw of tokens) {
    const match = raw.match(/^(-?)([a-z]+):(.*)$/i)
    const name = match?.[2].toLowerCase()
    const key = name && Object.hasOwn(KEYS, name) ? KEYS[name] : null
    if (!key) {
      terms.push(unquote(raw).toLowerCase())
      continue
    }
    const value = unquote(match[3])
    if (!value) errors.push(`Add a value after ${key}:`)
    else if (key === 'updated' && !dateCondition(value))
      errors.push(
        'Use updated:YYYY-MM-DD, updated:>=YYYY-MM-DD or updated:YYYY-MM-DD..YYYY-MM-DD.'
      )
    qualifiers.push({
      key,
      value: key === 'updated' ? value : canonicalTag(value),
      negative: Boolean(match[1]),
      raw,
    })
  }
  return { tokens, terms, qualifiers, errors }
}

export function dateValue(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return ''
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
    ? value
    : ''
}

function dateCondition(value) {
  const range = value.split('..')
  if (range.length === 2 && range.every(dateValue) && range[0] <= range[1])
    return (date) => date >= range[0] && date <= range[1]
  const match = value.match(/^(>=|<=|>|<)?(\d{4}-\d{2}-\d{2})$/)
  if (!match || !dateValue(match[2])) return null
  const [, operator, target] = match
  return (date) =>
    operator === '>='
      ? date >= target
      : operator === '<='
        ? date <= target
        : operator === '>'
          ? date > target
          : operator === '<'
            ? date < target
            : date === target
}

export const updatedDate = (item) =>
  dateValue(item.updated) || dateValue(item.date)

export function qualifierMatches(item, qualifier) {
  const { key, value } = qualifier
  if (key === 'updated') {
    const date = updatedDate(item)
    return Boolean(date && dateCondition(value)?.(date))
  }
  const facet = SEARCH_FACETS.find((facet) => facet.param === key)
  if (key === 'language' && !Object.hasOwn(LANGUAGES, value)) return false
  return Boolean(facet && item[facet.key]?.includes(value))
}

export function qualifierToken(key, value, negative = false) {
  const label = key === 'language' ? tagLabel('languages', value) : value
  return `${negative ? '-' : ''}${key}:${/\s/.test(label) ? JSON.stringify(label) : label}`
}

export function toggleQualifier(query, key, value) {
  const { tokens, qualifiers } = parseQuery(query)
  const found = qualifiers.find(
    (q) => q.key === key && q.value === value && !q.negative
  )
  return found
    ? tokens
        .filter(
          (token) =>
            !qualifiers.some(
              (q) =>
                q.raw === token &&
                q.key === key &&
                q.value === value &&
                !q.negative
            )
        )
        .join(' ')
    : [
        ...tokens.filter(
          (token) =>
            !qualifiers.some(
              (q) =>
                q.raw === token &&
                q.key === key &&
                q.value === value &&
                q.negative
            )
        ),
        qualifierToken(key, value),
      ].join(' ')
}

export function removeQualifier(query, qualifier) {
  return parseQuery(query)
    .tokens.filter((token) => token !== qualifier.raw)
    .join(' ')
}
