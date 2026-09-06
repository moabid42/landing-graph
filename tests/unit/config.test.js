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
