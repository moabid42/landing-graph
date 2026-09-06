// Everything that decides how a link to this site looks when it is shared or
// crawled. index.html carries the same values as a static fallback for
// crawlers that never run scripts; this module keeps them in step as the
// hash router moves between the README and a post.
import config from '../site.config.js'

const { identity, seo } = config

// Trailing slashes make canonical urls compare unequal for no reason.
const origin = (seo.url || '').replace(/\/+$/, '')

/** Absolute url for a route, or null when no site url is configured. */
export function canonical(slug) {
  if (!origin) return null
  return slug ? `${origin}/#/blog/${slug}` : `${origin}/`
}

/** Absolute url for the share image, or null when none is configured. */
export function shareImage() {
  if (!seo.image) return null
  if (/^https?:\/\//.test(seo.image)) return seo.image
  return origin ? origin + seo.image : null
}

/** The <title>, description and share card for one route. */
export function metaFor(post) {
  const title = post
    ? `${post.title} · ${identity.repo}`
    : `${identity.handle} / ${identity.repo}`
  const description = (post && (post.summary || post.title)) || seo.description
  return {
    title,
    description,
    canonical: canonical(post?.slug),
    image: shareImage(),
    type: post ? 'article' : 'website',
    publishedTime: post?.date || null,
  }
}

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
