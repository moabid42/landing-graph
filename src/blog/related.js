// Prefer shared topics, then the newest posts. The current article is never
// recommended, and recent writing fills any remaining places.
export function relatedPosts(post, posts, limit = 3) {
  const topics = new Set(post.topics)
  const overlap = (candidate) =>
    candidate.topics.filter((topic) => topics.has(topic)).length
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
