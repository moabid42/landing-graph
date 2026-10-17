import { FACETS } from '../taxonomy.js'

// Give each shared topic more weight than a shared domain or language.
// The current article is excluded; recent writing fills remaining places.
export function relatedPosts(post, posts, limit = 3) {
  const overlap = (candidate) =>
    FACETS.reduce(
      (score, { key }) =>
        score +
        (candidate[key] || []).filter((value) => post[key]?.includes(value))
          .length *
          (key === 'topics' ? 3 : 1),
      0
    )
  return posts
    .filter((candidate) => candidate.slug !== post.slug && !candidate.draft)
    .sort(
      (a, b) =>
        overlap(b) - overlap(a) ||
        (b.date || '').localeCompare(a.date || '') ||
        a.slug.localeCompare(b.slug)
    )
    .slice(0, limit)
}
