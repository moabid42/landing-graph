// Everything that decides how a link to this site looks when it is shared or
// crawled. One list of tags per route, built here and written out twice: into
// the DOM as the router moves (src/seo/apply.js) and into the static html of
// every page the build emits (plugins/prerender.js). Two writers, one source,
// so a crawler that never runs scripts and a visitor who does are told the
// same thing.
import config from '../../site.config.js'
import {
  BASE,
  ORIGIN,
  absolute,
  homePath,
  postMarkdownPath,
  postPath,
} from '../paths.js'

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

// A post names its first picture the way it sits under public/ —
// "./blog/<slug>/01.webp" — the same rule src/markdown.jsx resolves it by.
/** Absolute url for a post's own picture, or null when it has none. */
export function postImage(post) {
  const src = post?.image
  if (!src) return null
  if (/^https?:\/\//.test(src)) return src
  if (src.startsWith('/')) return absolute(src)
  if (/^[a-z][a-z0-9+.-]*:|^#/i.test(src)) return null
  return absolute(BASE + src.replace(/^\.\//, ''))
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
    modifiedTime: post?.updated || null,
    topics: post?.topics || [],
  }
}

// Open Graph keys (og:*, article:*) are addressed by `property`; everything
// else, including the twitter:* card tags, by `name`.
export const isOpenGraph = (key) =>
  key.startsWith('og:') || key.startsWith('article:')

/** Keys that may appear more than once in one head. */
export const REPEATED = new Set(['article:tag'])

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
    // The same post as plain markdown, for readers that do not run scripts.
    [
      'alternate',
      'text/markdown',
      post && absolute(postMarkdownPath(post.slug)),
    ],
    ['meta', 'og:site_name', identity.repo],
    ['meta', 'og:type', m.type],
    ['meta', 'og:title', m.title],
    ['meta', 'og:description', m.description],
    ['meta', 'og:url', m.canonical],
    ['meta', 'og:image', m.image],
    ['meta', 'og:image:alt', m.image && (seo.imageAlt || seo.title)],
    ['meta', 'og:locale', 'en_US'],
    ['meta', 'article:published_time', m.publishedTime],
    ['meta', 'article:modified_time', m.modifiedTime],
    ['meta', 'article:author', post && ORIGIN ? `${ORIGIN}/` : null],
    // One tag per topic: Open Graph repeats the key rather than joining them.
    ...m.topics.map((t) => ['meta', 'article:tag', t]),
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
  const home = `${ORIGIN}/`
  // One person and one site, named once in full on the README and pointed at
  // by @id from every post, so a crawler joins them into the same entity.
  const person = {
    '@type': 'Person',
    '@id': `${home}#person`,
    name: identity.name,
    url: home,
    jobTitle: identity.jobTitle || undefined,
    sameAs: links.filter((l) => /^https?:/.test(l.url)).map((l) => l.url),
  }
  const website = {
    '@type': 'WebSite',
    '@id': `${home}#website`,
    name: identity.repo,
    url: home,
    inLanguage: 'en',
    publisher: { '@id': person['@id'] },
  }
  if (post) {
    const images = [postImage(post), shareImage()].filter(Boolean)
    return {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.summary || post.title,
      url: canonical(post.slug),
      datePublished: post.date || undefined,
      dateModified: post.updated || post.date || undefined,
      keywords: post.topics?.length ? post.topics.join(', ') : undefined,
      inLanguage: 'en',
      // Search results show the post's own picture; the share card, which
      // needs a fixed 1200x630, stays the site's.
      image: images.length ? images : undefined,
      author: person,
      publisher: { '@id': person['@id'] },
      isPartOf: website,
      mainEntityOfPage: canonical(post.slug),
    }
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: home,
    inLanguage: 'en',
    isPartOf: website,
    mainEntity: {
      ...person,
      description: seo.description,
      email: identity.email ? `mailto:${identity.email}` : undefined,
      image: shareImage() || undefined,
    },
  }
}
