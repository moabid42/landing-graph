// Everything that decides how a link to this site looks when it is shared or
// crawled. One list of tags per route, built here and written out twice: into
// the DOM as the router moves (src/seo/apply.js) and into the static html of
// every page the build emits (plugins/prerender.js). Two writers, one source,
// so a crawler that never runs scripts and a visitor who does are told the
// same thing.
import config from '../../site.config.js'
import { ORIGIN, absolute, homePath, postPath } from '../paths.js'

const { identity, seo, links } = config

/** Absolute url for a route, or null when no site url is configured. */
export function canonical(slug) {
  return absolute(slug ? postPath(slug) : homePath())
}

/** Absolute url for the share image, or null when none is configured. */
export function shareImage() {
  if (!seo.image) return null
  if (/^https?:\/\//.test(seo.image)) return seo.image
  return ORIGIN ? ORIGIN + seo.image : null
}

/** The <title>, description and share card for one route. */
export function metaFor(post) {
  const title = post
    ? `${post.title} · ${identity.repo}`
    : seo.title || `${identity.handle} / ${identity.repo}`
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
export const isOpenGraph = (key) =>
  key.startsWith('og:') || key.startsWith('article:')

/**
 * Every head tag for one route, as [kind, key, value] rows. A null value
 * means the tag does not belong on this route at all — article:published_time
 * on the README, og:image with no share image configured — and both writers
 * leave it out rather than emitting it empty.
 */
export function tagsFor(post) {
  const m = metaFor(post)
  return [
    ['title', 'title', m.title],
    ['meta', 'description', m.description],
    ['meta', 'theme-color', seo.themeColor],
    ['link', 'canonical', m.canonical],
    ['meta', 'og:site_name', identity.repo],
    ['meta', 'og:type', m.type],
    ['meta', 'og:title', m.title],
    ['meta', 'og:description', m.description],
    ['meta', 'og:url', m.canonical],
    ['meta', 'og:image', m.image],
    ['meta', 'article:published_time', m.publishedTime],
    // Without a card type X and LinkedIn fall back to a bare link.
    ['meta', 'twitter:card', m.image ? 'summary_large_image' : 'summary'],
    ['meta', 'twitter:title', m.title],
    ['meta', 'twitter:description', m.description],
    ['meta', 'twitter:image', m.image],
  ]
}

// Google reads the share card for a preview and this for everything else:
// who the author is, when a post was published, which profiles are the same
// person. The og:* tags cannot say any of that.
/** The schema.org description of one route, or null with no site url. */
export function jsonLd(post) {
  if (!ORIGIN) return null
  const author = {
    '@type': 'Person',
    name: identity.name,
    url: `${ORIGIN}/`,
  }
  if (post) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.summary || post.title,
      datePublished: post.date || undefined,
      keywords: post.topics?.length ? post.topics.join(', ') : undefined,
      image: shareImage() || undefined,
      author,
      mainEntityOfPage: canonical(post.slug),
    }
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: `${ORIGIN}/`,
    mainEntity: {
      ...author,
      description: seo.description,
      email: identity.email ? `mailto:${identity.email}` : undefined,
      image: shareImage() || undefined,
      sameAs: links.filter((l) => /^https?:/.test(l.url)).map((l) => l.url),
    },
  }
}
