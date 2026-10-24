import { beforeEach, describe, expect, it } from 'vitest'
import config from '../../site.config.js'
import {
  RESEARCH,
  PINNED_RESEARCH,
  RESEARCH_PROBLEMS,
} from '../../src/research.js'
import { RESEARCH_SOURCE } from '../../src/loadContent.js'
import { parseResearch } from '../../src/research/parse.js'
import { PROBLEMS } from '../../src/contentParsing.js'
import { filterContent, sortContent } from '../../src/archive.js'
import { pageMarkdown } from '../../plugins/pageSnapshot.js'
import { header, profile } from '../../plugins/llmsFiles.js'

describe('research authoring', () => {
  it('pins only explicit true flags and preserves file order', () => {
    const papers = parseResearch(`## Unpinned
- pinned: false
- link: https://example.com/unpinned
An unpinned paper.

## Pinned
-pinned: true
- link: https://example.com/pinned
A featured paper.

## Default
- link: https://example.com/default
A paper without a pin flag.

## Another pin
- pinned: true
- link: https://example.com/another
Another featured paper.
`)
    expect(papers).toHaveLength(4)
    expect(
      papers.filter((paper) => paper.pinned).map((paper) => paper.title)
    ).toEqual(['Pinned', 'Another pin'])
  })

  it('reads summaries, taxonomy and update dates like project metadata', () => {
    const [paper] = parseResearch(`## Paper
- link: https://example.com/paper
- domains: Cryptography
- languages: C++, cpp
- topics: entropy, entropy
- updated: 2026-10-01
- description: The finding.
  Its implications.
`)
    expect(paper).toEqual({
      title: 'Paper',
      href: 'https://example.com/paper',
      tldr: 'The finding. Its implications.',
      pinned: false,
      updated: '2026-10-01',
      domains: ['cryptography'],
      languages: ['cpp'],
      topics: ['entropy'],
    })
    expect(
      filterContent([paper], { query: 'implications language:C++' })
    ).toEqual([paper])
    expect(sortContent([{ title: 'Undated' }, paper], 'updated')[0]).toBe(paper)
  })

  it('accepts an empty collection', () => {
    expect(parseResearch('# Research\n<!-- Add papers here. -->')).toEqual([])
  })
})

describe('published research', () => {
  it('loads papers from content with valid summaries, links and unique titles', () => {
    expect(config).not.toHaveProperty('research')
    expect(RESEARCH_PROBLEMS).toEqual([])
    expect(RESEARCH).toEqual(parseResearch(RESEARCH_SOURCE))
    const titles = RESEARCH.map((paper) => paper.title)
    expect(new Set(titles).size).toBe(titles.length)
    for (const paper of RESEARCH) {
      expect(paper.title.trim()).toBeTruthy()
      expect(paper.tldr.trim(), paper.title).toBeTruthy()
      expect(paper.href, paper.title).toMatch(/^https?:\/\//)
      expect(paper.topics.length, paper.title).toBeGreaterThan(0)
    }
    expect(PINNED_RESEARCH).toEqual(RESEARCH.filter((paper) => paper.pinned))
  })

  it('keeps pinned and unpinned papers in page and crawler exports', () => {
    const page = pageMarkdown('research', [], 'content/timeline')
    const index = header([])
    const full = profile([], 'content/timeline')
    for (const paper of RESEARCH) {
      for (const output of [page, index, full]) {
        expect(output).toContain(`[${paper.title}](${paper.href})`)
        expect(output).toContain(paper.tldr)
      }
    }
    expect(page).not.toContain('Add a paper as')
    expect(page).not.toContain('pinned:')
  })
})

describe('research problems', () => {
  beforeEach(() => {
    PROBLEMS.length = 0
  })

  it('reports unusable publication links and preserves valid papers', () => {
    const papers = parseResearch(`## Missing link
Summary.

## Unsafe link
- link: javascript:alert(1)

## Valid
- link: https://example.com/paper
Summary.
`)
    expect(papers.map((paper) => paper.title)).toEqual(['Valid'])
    expect(PROBLEMS).toEqual(
      ['Missing link', 'Unsafe link'].map((title) => ({
        file: 'content/research.md',
        title,
        msg: 'missing or invalid http(s) link — entry skipped',
      }))
    )
  })

  it('warns about mistyped flags and dates without pinning the entry', () => {
    const [paper] = parseResearch(`## Typo
- link: https://example.com/paper
- pinned: yes
- updated: yesterday
Summary.
`)
    expect(paper).toMatchObject({ pinned: false, updated: '' })
    expect(PROBLEMS.map((p) => p.msg)).toEqual([
      'unknown pinned "yes" — use true or false',
      'invalid updated "yesterday" — use YYYY-MM-DD',
    ])
  })
})
