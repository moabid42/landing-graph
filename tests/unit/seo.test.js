import { describe, it, expect } from 'vitest'
import config from '../../site.config.js'
import {
  canonical,
  isOpenGraph,
  jsonLd,
  metaFor,
  shareImage,
  tagsFor,
} from '../../src/seo/meta.js'

const origin = (config.seo.url || '').replace(/\/+$/, '')
const post = {
  slug: 'a-post',
  title: 'A Post',
  summary: 'One line about the post.',
  date: '2024-05-01',
  topics: ['one', 'two'],
}

// [kind, key, value] rows -> { key: value }, dropping what the route leaves out
const tags = (p) =>
  Object.fromEntries(
    tagsFor(p)
      .filter(([, , value]) => value)
      .map(([, key, value]) => [key, value])
  )

describe('canonical', () => {
  it('points the home route at the site root', () => {
    expect(canonical()).toBe(`${origin}/`)
  })

  it('points a post at its own path', () => {
    expect(canonical('a-post')).toBe(`${origin}/blog/a-post/`)
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
  it('titles the home route with the searchable name, not the crumb', () => {
    expect(metaFor(null).title).toBe(config.seo.title)
    expect(metaFor(null).title).not.toBe(
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

describe('tagsFor', () => {
  it('says the same thing metaFor decided', () => {
    for (const p of [null, post]) {
      const m = metaFor(p)
      const t = tags(p)
      expect(t.title).toBe(m.title)
      expect(t.description).toBe(m.description)
      expect(t.canonical).toBe(m.canonical)
      expect(t['og:url']).toBe(m.canonical)
      expect(t['og:type']).toBe(m.type)
    }
  })

  it('mirrors the description into both share cards', () => {
    const t = tags(post)
    expect(t['og:description']).toBe(t.description)
    expect(t['twitter:description']).toBe(t.description)
  })

  it('dates a post and leaves the README undated', () => {
    expect(tags(post)['article:published_time']).toBe(post.date)
    expect(tags(null)['article:published_time']).toBeUndefined()
  })

  it('emits no empty tag, whatever the route', () => {
    for (const p of [null, post])
      for (const [, key, value] of tagsFor(p))
        if (value) expect(typeof value, key).toBe('string')
  })

  it('addresses og and article keys by property, the rest by name', () => {
    expect(isOpenGraph('og:title')).toBe(true)
    expect(isOpenGraph('article:published_time')).toBe(true)
    expect(isOpenGraph('twitter:card')).toBe(false)
    expect(isOpenGraph('description')).toBe(false)
  })
})

describe('jsonLd', () => {
  it('describes the README as a person, with every remote as the same one', () => {
    const ld = jsonLd(null)
    expect(ld['@type']).toBe('ProfilePage')
    expect(ld.mainEntity['@type']).toBe('Person')
    expect(ld.mainEntity.name).toBe(config.identity.name)
    // mailto: and other non-http remotes are not profiles
    for (const url of ld.mainEntity.sameAs) expect(url).toMatch(/^https?:/)
  })

  it('describes a post as an article, pointed back at its own url', () => {
    const ld = jsonLd(post)
    expect(ld['@type']).toBe('BlogPosting')
    expect(ld.headline).toBe(post.title)
    expect(ld.description).toBe(post.summary)
    expect(ld.datePublished).toBe(post.date)
    expect(ld.keywords).toBe('one, two')
    expect(ld.mainEntityOfPage).toBe(canonical(post.slug))
    expect(ld.author.name).toBe(config.identity.name)
  })

  it('survives a post with no date and no topics', () => {
    const ld = jsonLd({ ...post, date: '', topics: [] })
    expect(ld.datePublished).toBeUndefined()
    expect(ld.keywords).toBeUndefined()
  })
})
