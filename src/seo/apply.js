// Writes the tags meta.js computed onto the live document. Kept apart from
// meta.js so the decisions stay testable without a DOM; this half is covered
// by the end-to-end suite, which reads the tags back out of a real browser.
import { isOpenGraph, jsonLd, tagsFor } from './meta.js'

function setMeta(key, value) {
  const attr = isOpenGraph(key) ? 'property' : 'name'
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!value) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
}

function setLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!href) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

// The build already put this route's schema in the html it served. Replacing
// it in place keeps one block on the page after the router moves, rather than
// a growing pile of stale ones.
function setJsonLd(data) {
  let el = document.head.querySelector('script[type="application/ld+json"]')
  if (!data) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('script')
    el.setAttribute('type', 'application/ld+json')
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

/** Point the document at one route. Called on every navigation. */
export function applyMeta(post) {
  for (const [kind, key, value] of tagsFor(post)) {
    if (kind === 'title') document.title = value
    else if (kind === 'link') setLink(key, value)
    else setMeta(key, value)
  }
  setJsonLd(jsonLd(post))
}
