// The only file that knows this is a Vite project with markdown on disk.
//
// Everything downstream (src/content.js and the timeline itself) sees plain
// strings, which is what keeps the engine portable. Track files are globbed,
// not listed: the `key` of each track in site.config.js is the filename it
// reads from content/timeline/.
const trackFiles = import.meta.glob('../content/timeline/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

// { work: '# Work — timeline entries\n…', education: '…', … }
export const TRACK_SOURCES = Object.fromEntries(
  Object.entries(trackFiles).map(([path, raw]) => [
    path.split('/').pop().replace(/\.md$/, ''),
    raw,
  ])
)

// Path back to the file, for warning messages that a human has to act on.
export const trackFile = (key) => `content/timeline/${key}.md`

export { default as TAGS_SOURCE } from '../content/tags.md?raw'
export const TAGS_FILE = 'content/tags.md'
