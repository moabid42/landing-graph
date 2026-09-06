// Writes the computed meta onto the document. Kept apart from meta.js so
// the decisions stay testable without a DOM; this half is covered by the
// end-to-end suite, which reads the tags back out of a real browser.
import config from '../../site.config.js'
import { metaFor } from './meta.js'

const { identity, seo } = config

// Open Graph keys (og:*, article:*) are addressed by `property`; everything
// else, including the twitter:* card tags, by `name`.
const isOpenGraph = (key) => key.startsWith('og:') || key.startsWith('article:')

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

/** Point the document at one route. Called on every navigation. */
export function applyMeta(post) {
  const m = metaFor(post)

  document.title = m.title
  setMeta('description', m.description)
  setMeta('theme-color', seo.themeColor)
  setLink('canonical', m.canonical)

  setMeta('og:site_name', identity.repo)
  setMeta('og:type', m.type)
  setMeta('og:title', m.title)
  setMeta('og:description', m.description)
  setMeta('og:url', m.canonical)
  setMeta('og:image', m.image)
  setMeta('article:published_time', m.publishedTime)

  // Without a card type X and LinkedIn fall back to a bare link.
  setMeta('twitter:card', m.image ? 'summary_large_image' : 'summary')
  setMeta('twitter:title', m.title)
  setMeta('twitter:description', m.description)
  setMeta('twitter:image', m.image)
}
