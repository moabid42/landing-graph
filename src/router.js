// Two routes and no router library: the README at the site root, one post at
// /blog/<slug>/. Real paths rather than a #/ fragment, so every post is a url
// a crawler can index, a card can preview and a visitor can open in a new tab.
import { useEffect, useState } from 'react'
import { postPath, slugFromPath } from './paths.js'

const currentSlug = () => slugFromPath(window.location.pathname)

// The site used to route on '#/blog/<slug>'. Links published with one are out
// there for good, so they get rewritten to the path route on arrival instead
// of landing on the README.
export function upgradeLegacyUrl() {
  const slug = window.location.hash.match(/^#\/blog\/([A-Za-z0-9._-]+)/)?.[1]
  if (slug) window.history.replaceState(null, '', postPath(slug))
}

/** Move to a route without a reload, and tell the app it happened. */
export function go(path) {
  window.history.pushState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

// A real href is what makes the link work for middle click, cmd-click, "copy
// link address" and every crawler; the handler is only there to skip the
// reload on an ordinary left click.
/** Props for an in-site link. Spread onto an <a>. */
export function link(path) {
  return {
    href: path,
    onClick: (e) => {
      if (e.defaultPrevented || e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      e.preventDefault()
      go(path)
    },
  }
}

/** The slug of the current route, or null on the README. */
export function useRoute() {
  const [slug, setSlug] = useState(currentSlug)
  useEffect(() => {
    const on = () => {
      // A legacy link followed from an already-open page changes the hash
      // without reloading, so main.jsx never sees it.
      upgradeLegacyUrl()
      setSlug(currentSlug())
    }
    window.addEventListener('popstate', on)
    window.addEventListener('hashchange', on)
    return () => {
      window.removeEventListener('popstate', on)
      window.removeEventListener('hashchange', on)
    }
  }, [])
  return slug
}
