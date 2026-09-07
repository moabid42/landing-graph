// Where the site lives, in one place.
//
// seo.url in site.config.js answers it completely: its origin builds the
// canonical urls, the sitemap and the share image, and its path is the prefix
// every in-site link and every built asset hangs off. A custom domain makes
// BASE '/', a GitHub project page makes it '/<repo>/', and nothing else in
// the tree has to know which one it is.
//
// Imported by the app, by the Vite plugins and by vite.config.js itself, so
// it stays free of anything that only exists in a browser or only in Node.
import config from '../site.config.js'

/** The configured site url, no trailing slash. '' when there is none. */
export const ORIGIN = (config.seo?.url || '').replace(/\/+$/, '')

/** The path every in-site url starts with. Always starts and ends with '/'. */
export const BASE = (() => {
  try {
    return new URL(ORIGIN).pathname.replace(/\/*$/, '/')
  } catch {
    // No seo.url configured: assume the site is served from the root.
    return '/'
  }
})()

/** The README route. */
export const homePath = () => BASE

// Trailing slash on purpose: the build writes blog/<slug>/index.html, and a
// static host answers the slashless form with a redirect to this one. Linking
// the destination directly saves every visitor that round trip.
/** One post's route. */
export const postPath = (slug) => `${BASE}blog/${slug}/`

/** The slug a pathname names, or null when it names anything else. */
export function slugFromPath(pathname) {
  const rest = pathname.startsWith(BASE)
    ? pathname.slice(BASE.length)
    : pathname.replace(/^\/+/, '')
  return rest.match(/^blog\/([A-Za-z0-9._-]+?)(?:\.html)?\/?$/)?.[1] ?? null
}

/** A route path made absolute against the site origin, or null without one. */
export const absolute = (path) => (ORIGIN ? new URL(path, ORIGIN).href : null)
