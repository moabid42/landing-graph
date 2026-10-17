import { describe, expect, it } from 'vitest'
import {
  parseQuery,
  toggleQualifier,
  removeQualifier,
  dateValue,
} from '../../src/searchQuery.js'
import { filterContent, sortContent } from '../../src/archive.js'

const items = [
  {
    title: 'Cloud IAM lab',
    domains: ['cloud-security'],
    languages: ['python'],
    topics: ['iam'],
    updated: '2026-10-01',
  },
  {
    title: 'Cloud scanner',
    domains: ['cloud-security'],
    languages: ['javascript'],
    topics: ['detection-engineering'],
    updated: '2026-08-12',
  },
  {
    title: 'Tree implementation',
    domains: ['systems-programming'],
    languages: ['cpp'],
    topics: ['data-structures'],
  },
  {
    title: 'Memory guide',
    domains: ['systems-programming'],
    languages: ['c'],
    topics: ['memory-management'],
    date: '2023-04-03',
  },
]
const matches = (query) =>
  filterContent(items, { query }).map((item) => item.title)

describe('qualified search', () => {
  it('combines text and case-insensitive language, domain and topic qualifiers', () => {
    expect(
      matches('cloud language:PYTHON domain:Cloud-Security topic:IAM')
    ).toEqual(['Cloud IAM lab'])
    expect(matches('language:JavaScript')).toEqual(['Cloud scanner'])
    expect(matches('language:C++')).toEqual(['Tree implementation'])
    expect(matches('language:C')).toEqual(['Memory guide'])
    expect(matches('language:GCP')).toEqual([])
  })

  it('supports quoted phrases and category aliases', () => {
    expect(matches('"cloud IAM" domain:"Cloud Security" lang:Python')).toEqual([
      'Cloud IAM lab',
    ])
    expect(matches('lang:"C++"')).toEqual(['Tree implementation'])
    expect(matches('memory guide')).toEqual(['Memory guide'])
    expect(matches('https://example.com')).toEqual([])
  })

  it('uses OR within one category, AND across categories, and exclusion for minus qualifiers', () => {
    expect(
      matches('language:Python language:JavaScript domain:cloud-security')
    ).toEqual(['Cloud IAM lab', 'Cloud scanner'])
    expect(matches('domain:cloud-security -language:Python')).toEqual([
      'Cloud scanner',
    ])
    expect(matches('-topic:iam -language:C++')).toEqual([
      'Cloud scanner',
      'Memory guide',
    ])
  })

  it('filters exact dates, comparisons and ranges without treating undated items as recent', () => {
    expect(matches('updated:>=2026-09-01')).toEqual(['Cloud IAM lab'])
    expect(matches('updated:2026-08-12')).toEqual(['Cloud scanner'])
    expect(matches('updated:2026-01-01..2026-12-31')).toEqual([
      'Cloud IAM lab',
      'Cloud scanner',
    ])
    expect(matches('updated:<2024-01-01')).toEqual(['Memory guide'])
    expect(matches('updated:>2026-08-01 updated:<2026-09-01')).toEqual([
      'Cloud scanner',
    ])
    expect(matches('-updated:>=2026-09-01')).toEqual([
      'Cloud scanner',
      'Tree implementation',
      'Memory guide',
    ])
  })

  it('reports incomplete and invalid dates rather than broadening the search', () => {
    expect(parseQuery('language:').errors).toHaveLength(1)
    expect(parseQuery('updated:2026-02-30').errors).toHaveLength(1)
    expect(parseQuery('updated:2026-12-31..2026-01-01').errors).toHaveLength(1)
    expect(matches('updated:tomorrow')).toEqual([])
    expect(dateValue('2026-02-30')).toBe('')
  })

  it('synchronizes sidebar toggles without removing words or unrelated qualifiers', () => {
    const query = toggleQualifier(
      'cloud domain:cloud-security',
      'language',
      'cpp'
    )
    expect(query).toBe('cloud domain:cloud-security language:C++')
    expect(toggleQualifier(query, 'language', 'cpp')).toBe(
      'cloud domain:cloud-security'
    )
    expect(
      toggleQualifier('cloud -language:Python', 'language', 'python')
    ).toBe('cloud language:Python')
    expect(toggleQualifier('language:Python', 'language', 'javascript')).toBe(
      'language:Python language:JavaScript'
    )
    const parsed = parseQuery(query)
    expect(removeQualifier(query, parsed.qualifiers[0])).toBe(
      'cloud language:C++'
    )
  })

  it('ignores only the counted category, so all alternative language counts remain useful', () => {
    expect(
      filterContent(
        items,
        { query: 'domain:cloud-security language:Python' },
        'language'
      )
    ).toEqual(items.slice(0, 2))
  })

  it('sorts by known activity dates and leaves the curated source order intact', () => {
    const sorted = sortContent(items, 'updated')
    expect(sorted.map((item) => item.title)).toEqual([
      'Cloud IAM lab',
      'Cloud scanner',
      'Memory guide',
      'Tree implementation',
    ])
    expect(items[2].title).toBe('Tree implementation')
    expect(sortContent(items, 'default')).toBe(items)
  })
})
