// What the app sees: a list of posts, and a way to fetch one body.
//
// Two globs over the same files, on purpose. The `?meta` one is eager and
// tiny — it is the index that renders the Writing list. The `?raw` one is
// lazy, so Vite emits each post body as its own chunk and none of them are
// in the entry payload. See plugins/blogMeta.js.
import { parsePost } from './parse.js'

const metaFiles = import.meta.glob('../../content/blog/*.md', {
  query: '?meta',
  import: 'default',
  eager: true,
})

const bodyLoaders = import.meta.glob('../../content/blog/*.md', {
  query: '?raw',
  import: 'default',
})

const slugOf = (path) => path.split('/').pop().replace(/\.md$/, '')

// Newest first; drafts never ship.
export const POSTS = Object.values(metaFiles)
  .filter((p) => !p.draft)
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

const bodyBySlug = Object.fromEntries(
  Object.entries(bodyLoaders).map(([path, load]) => [slugOf(path), load])
)

/** The markdown body of one post. Rejects if the slug is not a post. */
export async function loadBody(slug) {
  const load = bodyBySlug[slug]
  if (!load) throw new Error(`No post named "${slug}"`)
  return parsePost(`${slug}.md`, await load()).body
}
