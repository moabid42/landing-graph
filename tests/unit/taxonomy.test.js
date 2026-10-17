import { describe, expect, it } from 'vitest'
import config from '../../site.config.js'
import { PROJECTS } from '../../src/projects.js'
import { POSTS } from '../../src/blog/index.js'
import { parsePost } from '../../src/blog/parse.js'
import { parseProjects } from '../../src/projects/parse.js'
import {
  FACETS,
  TAXONOMY,
  canonicalTag,
  parseTags,
  tagLabel,
} from '../../src/taxonomy.js'
import { facetOptions, filterContent, readFilters } from '../../src/archive.js'

describe('shared content taxonomy', () => {
  it('gives every published item a domain and specific topics from one vocabulary', () => {
    for (const item of [...PROJECTS, ...POSTS, ...config.research]) {
      expect(item.domains.length, item.title).toBeGreaterThan(0)
      expect(item.topics.length, item.title).toBeGreaterThan(0)
      for (const { key } of FACETS) {
        expect(Array.isArray(item[key]), `${item.title}: ${key}`).toBe(true)
        expect(new Set(item[key]).size, item.title).toBe(item[key].length)
        for (const tag of item[key]) {
          expect(
            Object.hasOwn(TAXONOMY[key], tag),
            `${item.title}: ${tag}`
          ).toBe(true)
          expect(canonicalTag(tag)).toBe(tag)
        }
      }
    }
  })

  it('normalizes spelling, aliases and duplicates without losing C++', () => {
    expect(parseTags(' C++, CPP, Python, python, , ')).toEqual([
      'cpp',
      'python',
    ])
    expect(parseTags('red team, red-team, pentesting')).toEqual([
      'red-teaming',
      'penetration-testing',
    ])
    expect(tagLabel('languages', 'cpp')).toBe('C++')
    expect(tagLabel('languages', 'python')).toBe('Python')
  })

  it('uses the same category parsing in project and article metadata', () => {
    const fields =
      'domains: Cloud Security\nlanguages: C++, Python, python\ntopics: IAM'
    const project = parseProjects(
      `## Tool\n${fields.replace(/^/gm, '- ')}\nDescription.`
    )[0]
    const post = parsePost('article.md', `---\n${fields}\n---\nBody.`)
    for (const { key } of FACETS) expect(project[key]).toEqual(post[key])
  })
})

describe('faceted archive filtering', () => {
  const items = [
    {
      title: 'IAM lab',
      domains: ['cloud-security'],
      languages: ['python'],
      topics: ['iam'],
    },
    {
      title: 'Bucket scanner',
      domains: ['cloud-security'],
      languages: ['javascript'],
      topics: ['detection-engineering'],
    },
    {
      title: 'Tree implementation',
      domains: ['systems-programming'],
      languages: ['cpp'],
      topics: ['data-structures'],
    },
  ]
  const available = facetOptions(items)

  it('intersects domain, language, topic and text rather than matching any tag', () => {
    const filters = {
      domain: 'cloud-security',
      language: 'python',
      topic: 'iam',
    }
    expect(filterContent(items, filters)).toEqual([items[0]])
    expect(filterContent(items, { ...filters, query: 'LAB' })).toEqual([
      items[0],
    ])
    expect(filterContent(items, { ...filters, query: 'scanner' })).toEqual([])
    expect(
      filterContent(items, { ...filters, language: 'javascript' })
    ).toEqual([])
  })

  it('searches display labels and permits counts that exclude only the current facet', () => {
    expect(filterContent(items, { query: 'C++' })).toEqual([items[2]])
    expect(filterContent(items, { query: 'Cloud Security' })).toHaveLength(2)
    expect(
      filterContent(
        items,
        { domain: 'cloud-security', language: 'python' },
        'language'
      )
    ).toEqual(items.slice(0, 2))
    expect(available.domains).toEqual(['cloud-security', 'systems-programming'])
    expect(available.topics).not.toContain('gcp')
  })

  it('restores all filters and pagination from a shared URL', () => {
    expect(
      readFilters(
        '?q=lab&domain=cloud-security&language=Python&topic=iam&page=2',
        available,
        true
      )
    ).toEqual({
      query: 'lab domain:cloud-security topic:iam language:Python',
      currentPage: 2,
      sort: 'default',
    })
  })

  it('migrates old language and domain topic links and clears unsupported values', () => {
    expect(readFilters('?topic=cloud-security', available).query).toBe(
      'domain:cloud-security'
    )
    expect(readFilters('?topic=C%2B%2B', available).query).toBe('language:C++')
    expect(
      readFilters(
        '?q=lab&domain=unknown&language=unknown&topic=unknown&page=999',
        available
      )
    ).toEqual({
      query: 'lab',
      currentPage: 1,
      sort: 'default',
    })
    expect(readFilters('?technology=aws&topic=gcp', available).query).toBe('')
  })
})
