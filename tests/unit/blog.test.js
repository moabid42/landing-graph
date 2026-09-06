import { describe, it, expect } from 'vitest'
import { parsePost, postMeta } from '../../src/blog/parse.js'
import { POSTS, loadBody } from '../../src/blog/index.js'

const withFm = (fm, body = 'Body text.\n') => `---\n${fm}\n---\n${body}`

describe('parsePost', () => {
  it('takes the slug from the filename, not the frontmatter', () => {
    const p = parsePost('../content/blog/my-post.md', withFm('title: Whatever'))
    expect(p.slug).toBe('my-post')
  })

  it('reads the frontmatter fields', () => {
    const p = parsePost(
      'x/a.md',
      withFm(
        'title: Hello\ndate: 2024-05-01\nsummary: A line\ntopics: one, two'
      )
    )
    expect(p.title).toBe('Hello')
    expect(p.date).toBe('2024-05-01')
    expect(p.summary).toBe('A line')
    expect(p.topics).toEqual(['one', 'two'])
  })

  it('lowercases field names and trims values', () => {
    const p = parsePost(
      'x/a.md',
      withFm('Title:   Spaced   \nDATE: 2024-01-01')
    )
    expect(p.title).toBe('Spaced')
    expect(p.date).toBe('2024-01-01')
  })

  it('strips the frontmatter from the body', () => {
    const p = parsePost('x/a.md', withFm('title: T', '# Heading\n\nProse.\n'))
    expect(p.body).toBe('# Heading\n\nProse.\n')
    expect(p.body).not.toContain('title:')
  })

  it('drops leading authoring comments from the body', () => {
    const p = parsePost(
      'x/a.md',
      withFm('title: T', '<!-- note to self -->\n\nReal text.\n')
    )
    expect(p.body.trimStart()).toBe('Real text.\n')
  })

  it('falls back to the slug when there is no title', () => {
    expect(parsePost('x/untitled-post.md', 'Just a body.').title).toBe(
      'untitled-post'
    )
  })

  it('survives a file with no frontmatter at all', () => {
    const p = parsePost('x/a.md', 'Just a body.\n')
    expect(p.body).toBe('Just a body.\n')
    expect(p.date).toBe('')
    expect(p.topics).toEqual([])
    expect(p.draft).toBe(false)
  })

  it('reads draft: true in any case', () => {
    expect(parsePost('x/a.md', withFm('draft: true')).draft).toBe(true)
    expect(parsePost('x/a.md', withFm('draft: TRUE')).draft).toBe(true)
    expect(parsePost('x/a.md', withFm('draft: false')).draft).toBe(false)
    expect(parsePost('x/a.md', withFm('title: T')).draft).toBe(false)
  })

  it('ignores empty topics and stray separators', () => {
    expect(parsePost('x/a.md', withFm('topics: a, , b,')).topics).toEqual([
      'a',
      'b',
    ])
  })
})

describe('shipped posts', () => {
  it('has at least one', () => {
    expect(POSTS.length).toBeGreaterThan(0)
  })

  it('never ships a draft', () => {
    for (const p of POSTS) expect(p.draft, p.slug).toBe(false)
  })

  it('has unique slugs, since the slug is the url', () => {
    const slugs = POSTS.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('is sorted newest first', () => {
    const dates = POSTS.map((p) => p.date)
    expect(dates).toEqual([...dates].sort().reverse())
  })

  it('gives every post a title and a date', () => {
    for (const p of POSTS) {
      expect(p.title, p.slug).toBeTruthy()
      expect(p.date, p.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  // The index is built by plugins/blogMeta.js and the bodies are fetched
  // separately, so "the list has an entry" and "the post has words in it"
  // are now two different claims. Check both.
  it('keeps the bodies out of the index', () => {
    for (const p of POSTS) expect(p, p.slug).not.toHaveProperty('body')
  })

  it('can load a body for every post in the index', async () => {
    for (const p of POSTS) {
      const body = await loadBody(p.slug)
      expect(body.trim(), p.slug).not.toBe('')
      expect(body, p.slug).not.toContain('title:')
    }
  })

  it('rejects for a slug that is not a post', async () => {
    await expect(loadBody('no-such-post')).rejects.toThrow(/no-such-post/)
  })
})

describe('postMeta', () => {
  it('is parsePost without the body', () => {
    const raw = withFm('title: T\ndate: 2024-01-01', '# Heading\n')
    const full = parsePost('x/a.md', raw)
    const meta = postMeta('x/a.md', raw)
    expect(meta).not.toHaveProperty('body')
    expect(meta).toEqual(
      Object.fromEntries(Object.entries(full).filter(([k]) => k !== 'body'))
    )
    expect(meta.title).toBe('T')
    expect(meta.date).toBe('2024-01-01')
  })
})
