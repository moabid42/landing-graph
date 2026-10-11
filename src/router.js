// Real paths for the README, section pages and individual posts.
import { useEffect, useState } from 'react'
import { pageFromPath, pagePath, postPath, slugFromPath } from './paths.js'

const currentRoute = () => ({
  slug: slugFromPath(window.location.pathname),
  page: pageFromPath(window.location.pathname),
  pathname: window.location.pathname,
  hash: window.location.hash,
  scroll: window.history.state?.scroll ?? null,
})

// The site used to route on '#/blog/<slug>'. Links published with one are out
// there for good, so they get rewritten to the path route on arrival instead
// of landing on the README.
export function upgradeLegacyUrl() {
  const slug = window.location.hash.match(/^#\/blog\/([A-Za-z0-9._-]+)/)?.[1]
  if (slug) window.history.replaceState(null, '', postPath(slug))
  else if (window.location.hash === '#all-writing')
    window.history.replaceState(null, '', pagePath('writing'))
}

/** Move to a route without a reload, and tell the app it happened. */
export function go(path) {
  // Clicking the tab you are already on should not pile up history entries.
  if (
    path ===
    window.location.pathname + window.location.search + window.location.hash
  )
    return
  window.history.replaceState(
    { ...window.history.state, scroll: [window.scrollX, window.scrollY] },
    ''
  )
  window.history.pushState({ scroll: [0, 0] }, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

// A real href is what makes the link work for middle click, cmd-click, "copy
// link address" and every crawler; the handler is only there to skip the
// reload on an ordinary left click.
/**
 * Props for an in-site link. Spread onto an <a>. `after` runs once the click
 * is handled, whether or not the route actually moved — a link back to a page
 * you are already on still has somewhere to put you.
 */
export function link(path, after) {
  return {
    href: path,
    onClick: (e) => {
      if (e.defaultPrevented || e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      e.preventDefault()
      go(path)
      after?.()
    },
  }
}

/** Route identity and scroll position for browser history navigation. */
export function useRoute() {
  const [route, setRoute] = useState(currentRoute)
  useEffect(() => {
    const restoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    const on = () => {
      // A legacy link followed from an already-open page changes the hash
      // without reloading, so main.jsx never sees it.
      upgradeLegacyUrl()
      setRoute(currentRoute())
    }
    window.addEventListener('popstate', on)
    window.addEventListener('hashchange', on)
    return () => {
      window.removeEventListener('popstate', on)
      window.removeEventListener('hashchange', on)
      window.history.scrollRestoration = restoration
    }
  }, [])
  return route
}
