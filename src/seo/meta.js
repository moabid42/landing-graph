// Everything that decides how a link to this site looks when it is shared or
// crawled. index.html carries the same values as a static fallback for
// crawlers that never run scripts; this module keeps them in step as the
// hash router moves between the README and a post.
import config from '../../site.config.js'

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
