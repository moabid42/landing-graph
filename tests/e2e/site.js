// Where the site under test is served from. seo.url decides it — see
// src/paths.js — so pointing the config at a custom domain moves the suite
// with it instead of leaving every path in here wrong.
import { BASE, absolute, postPath } from '../../src/paths.js'

/** A path on the site under test. */
export const url = (path = '/') => BASE + String(path).replace(/^\/+/, '')

/** The Writing list's links to posts. */
export const POST_LINK = `#blog a[href^="${BASE}blog/"]`

/** The slug a post link points at. */
export const slugOf = (href) =>
  href.replace(`${BASE}blog/`, '').replace(/\/$/, '')

export { absolute, postPath }
