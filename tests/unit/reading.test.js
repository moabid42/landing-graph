import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Markdown from '../../src/markdown.jsx'
import { relatedPosts } from '../../src/blog/related.js'
import { highlightCode } from '../../src/markdown/highlight.js'

describe('article anchors', () => {
  it('gives repeated and colliding headings distinct destinations', () => {
    const html = renderToStaticMarkup(
      createElement(Markdown, {
        src: '## Example\n\n## Example\n\n### Example-1\n\n> ## Example\n',
      })
    )
    const ids = [...html.matchAll(/<h[23] id="([^"]+)"/g)].map((m) => m[1])
    expect(ids).toEqual(['example', 'example-1', 'example-1-1', 'example-2'])
  })

  it('keeps apparent headings inside code out of the article outline', () => {
    const html = renderToStaticMarkup(
      createElement(Markdown, {
        src: '## Real heading\n\n```bash\n## This is a comment\n```\n',
      })
    )
    expect(html).toContain('id="real-heading"')
    expect(html).not.toContain('id="this-is-a-comment"')
  })
})

describe('related writing', () => {
  const current = {
    slug: 'current',
    topics: ['c', 'linux'],
    date: '2026-10-04',
  }
  const posts = [
    current,
    { slug: 'recent', topics: [], date: '2026-10-05' },
    { slug: 'c-only', topics: ['c'], date: '2025-03-01' },
    { slug: 'both', topics: ['linux', 'c'], date: '2023-01-01' },
    { slug: 'older', topics: [], date: '2022-01-01' },
    { slug: 'draft', topics: ['c', 'linux'], draft: true, date: '2026-10-06' },
  ]

  it('prioritizes shared topics and fills remaining places with recent writing', () => {
    expect(relatedPosts(current, posts).map((p) => p.slug)).toEqual([
      'both',
      'c-only',
      'recent',
    ])
    expect(posts[0]).toBe(current)
  })

  it('handles a small archive and an article without topics', () => {
    expect(relatedPosts(current, [current])).toEqual([])
    expect(
      relatedPosts({ slug: 'new', topics: [] }, posts, 1).map((p) => p.slug)
    ).toEqual(['recent'])
  })
})

describe('syntax highlighting', () => {
  it('preserves code text including markup and supports the languages in the posts', () => {
    const text = (nodes) =>
      nodes
        .map((n) => (n.type === 'text' ? n.value : text(n.children)))
        .join('')
    for (const [language, code] of [
      ['c', 'char *s = "<script>alert(1)</script>";'],
      ['bash', 'echo "$HOME"'],
      ['makefile', 'all:\n\t$(CC) main.c -o main'],
    ]) {
      const tree = highlightCode(code, language)
      expect(text(tree)).toBe(code)
      expect(tree.some((node) => node.type === 'element')).toBe(true)
    }
    expect(highlightCode('unmodified', 'unknown-language')).toBeNull()
  })
})
