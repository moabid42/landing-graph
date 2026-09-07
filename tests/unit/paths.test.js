import { describe, it, expect } from 'vitest'
import config from '../../site.config.js'
import {
  BASE,
  ORIGIN,
  absolute,
  homePath,
  postPath,
  slugFromPath,
} from '../../src/paths.js'

describe('BASE', () => {
  it('is the path seo.url is served from', () => {
    expect(BASE).toBe(new URL(config.seo.url).pathname.replace(/\/*$/, '/'))
  })

  it('starts and ends with a slash, so paths can be joined by hand', () => {
    expect(BASE.startsWith('/')).toBe(true)
    expect(BASE.endsWith('/')).toBe(true)
  })
})

describe('routes', () => {
  it('hangs every route off the base', () => {
    expect(homePath()).toBe(BASE)
    expect(postPath('a-post').startsWith(BASE)).toBe(true)
  })

  it('reads a slug back out of the path it built', () => {
    expect(slugFromPath(postPath('a-post'))).toBe('a-post')
  })

  it('reads a slug with no trailing slash, the way a host redirects it', () => {
    expect(slugFromPath(postPath('a-post').replace(/\/$/, ''))).toBe('a-post')
  })

  it('calls everything that is not a post the README', () => {
    for (const p of [homePath(), `${BASE}blog/`, `${BASE}nope`, '/'])
      expect(slugFromPath(p), p).toBeNull()
  })
})

describe('absolute', () => {
  it('keeps the base when it makes a route absolute', () => {
    expect(absolute(homePath())).toBe(`${ORIGIN}/`)
    expect(absolute(postPath('a-post'))).toBe(`${ORIGIN}/blog/a-post/`)
  })
})
