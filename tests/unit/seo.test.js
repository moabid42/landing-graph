import { describe, it, expect } from 'vitest'
import config from '../../site.config.js'
import { canonical, metaFor, shareImage } from '../../src/seo/meta.js'

const origin = (config.seo.url || '').replace(/\/+$/, '')
const post = {
  slug: 'a-post',
  title: 'A Post',
  summary: 'One line about the post.',
  date: '2024-05-01',
}

describe('canonical', () => {
  it('points the home route at the site root', () => {
    expect(canonical()).toBe(`${origin}/`)
  })

  it('points a post at its hash route', () => {
    expect(canonical('a-post')).toBe(`${origin}/#/blog/a-post`)
  })

  it('never doubles the slash after the origin', () => {
    expect(canonical()).not.toMatch(/[^:]\/\//)
  })
})

describe('shareImage', () => {
  it('makes a public/ path absolute', () => {
    const img = shareImage()
    if (config.seo.image) expect(img).toMatch(/^https?:\/\//)
  })
})

describe('metaFor', () => {
  it('titles the home route with the crumb', () => {
    expect(metaFor(null).title).toBe(
      `${config.identity.handle} / ${config.identity.repo}`
    )
  })

  it('titles a post with its own name', () => {
    expect(metaFor(post).title).toBe(`A Post · ${config.identity.repo}`)
  })

  it('describes the home route from the config', () => {
    expect(metaFor(null).description).toBe(config.seo.description)
  })

  it("describes a post with the post's own summary", () => {
    // The whole point: a shared post link must not read as the site blurb.
    expect(metaFor(post).description).toBe('One line about the post.')
    expect(metaFor(post).description).not.toBe(config.seo.description)
  })

  it('falls back to the title when a post has no summary', () => {
    expect(metaFor({ ...post, summary: '' }).description).toBe('A Post')
  })

  it('marks a post as an article and dates it', () => {
    expect(metaFor(post).type).toBe('article')
    expect(metaFor(post).publishedTime).toBe('2024-05-01')
  })

  it('marks the home route as a website with no date', () => {
    expect(metaFor(null).type).toBe('website')
    expect(metaFor(null).publishedTime).toBeNull()
  })

  it('gives every route a canonical url and a title', () => {
    for (const p of [null, post]) {
      expect(metaFor(p).canonical).toBeTruthy()
      expect(metaFor(p).title.trim()).not.toBe('')
      expect(metaFor(p).description.trim()).not.toBe('')
    }
  })
})
