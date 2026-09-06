import { describe, it, expect } from 'vitest'
import config from '../../site.config.js'
import { TRACK_SOURCES } from '../../src/loadContent.js'

// site.config.js is the one file a fork is meant to edit. These tests turn a
// typo there into a failed build with a readable message, instead of a blank
// section or a colourless branch in the browser.

const HEX = /^#[0-9a-f]{3,8}$/i

describe('identity', () => {
  const required = ['handle', 'repo', 'avatar', 'name', 'tagline', 'email']

  it.each(required)('has a non-empty %s', (field) => {
    expect(typeof config.identity[field]).toBe('string')
    expect(config.identity[field].trim()).not.toBe('')
  })

  it('uses a single character for the avatar', () => {
    expect([...config.identity.avatar]).toHaveLength(1)
  })

  it('has a plausible email', () => {
    expect(config.identity.email).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)
  })

  it('allows the optional fields to be omitted', () => {
    for (const field of ['blurb', 'status', 'location']) {
      const v = config.identity[field]
      expect(v === null || v === undefined || typeof v === 'string').toBe(true)
    }
  })
})

describe('links', () => {
  it('is a non-empty list', () => {
    expect(Array.isArray(config.links)).toBe(true)
    expect(config.links.length).toBeGreaterThan(0)
  })

  it('has unique names, since sections look remotes up by name', () => {
    const names = config.links.map((l) => l.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('only carries http(s) and mailto urls', () => {
    for (const l of config.links) {
      expect(l.url, l.name).toMatch(/^(https?:\/\/|mailto:)/)
    }
  })

  it('labels every remote with a kind', () => {
    for (const l of config.links) expect(l.kind, l.name).toBeTruthy()
  })

  it('points the email remote at the identity email', () => {
    const email = config.links.find((l) => l.url.startsWith('mailto:'))
    if (email) expect(email.url).toBe(`mailto:${config.identity.email}`)
  })
})

describe('tracks', () => {
  it('is a non-empty list', () => {
    expect(config.tracks.length).toBeGreaterThan(0)
  })

  it('has unique keys', () => {
    const keys = config.tracks.map((t) => t.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('uses keys that are safe as both a filename and a css class', () => {
    for (const t of config.tracks) expect(t.key).toMatch(/^[a-z][a-z0-9-]*$/)
  })

  it('gives every track a hex colour for both themes', () => {
    for (const t of config.tracks) {
      expect(t.color, t.key).toMatch(HEX)
      if (t.colorLight !== undefined) expect(t.colorLight, t.key).toMatch(HEX)
    }
  })

  it('has a markdown file behind every track', () => {
    for (const t of config.tracks) {
      expect(Object.keys(TRACK_SOURCES), t.key).toContain(t.key)
    }
  })

  it('has a track declared for every markdown file', () => {
    for (const key of Object.keys(TRACK_SOURCES)) {
      expect(
        config.tracks.map((t) => t.key),
        key
      ).toContain(key)
    }
  })
})

describe('work', () => {
  it('is a non-empty list', () => {
    expect(Array.isArray(config.work)).toBe(true)
    expect(config.work.length).toBeGreaterThan(0)
  })

  it('gives every card a title, a description and a visibility badge', () => {
    for (const w of config.work) {
      expect(w.title?.trim(), w.title).toBeTruthy()
      expect(w.text?.trim(), w.title).toBeTruthy()
      expect(w.visibility?.trim(), w.title).toBeTruthy()
    }
  })

  it('has unique titles, since they key the cards', () => {
    const titles = config.work.map((w) => w.title)
    expect(new Set(titles).size).toBe(titles.length)
  })

  it('gives every card topic pills', () => {
    for (const w of config.work) {
      expect(Array.isArray(w.topics), w.title).toBe(true)
      expect(w.topics.length, w.title).toBeGreaterThan(0)
    }
  })

  it('links out over http(s), or not at all', () => {
    for (const w of config.work) {
      if (w.href !== null && w.href !== undefined)
        expect(w.href, w.title).toMatch(/^https?:\/\//)
    }
  })
})

describe('stack', () => {
  it('gives every language a name and a hex colour', () => {
    expect(config.languages.length).toBeGreaterThan(0)
    for (const l of config.languages) {
      expect(l.name?.trim(), l.name).toBeTruthy()
      expect(l.color, l.name).toMatch(HEX)
    }
  })

  it('has unique language names, since they key the bar', () => {
    const names = config.languages.map((l) => l.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('gives every stack row a category and its items', () => {
    expect(config.stack.length).toBeGreaterThan(0)
    for (const s of config.stack) {
      expect(s.cat?.trim(), s.cat).toBeTruthy()
      expect(s.items?.trim(), s.cat).toBeTruthy()
    }
  })
})

describe('seo and footer', () => {
  it('has a description and a theme colour', () => {
    expect(config.seo.description.trim()).not.toBe('')
    expect(config.seo.themeColor).toMatch(HEX)
  })

  it('substitutes {year} in the footer', () => {
    const rendered = config.footer.text.replace(
      '{year}',
      new Date().getFullYear()
    )
    expect(rendered).not.toContain('{year}')
    expect(config.footer.note.trim()).not.toBe('')
  })
})
