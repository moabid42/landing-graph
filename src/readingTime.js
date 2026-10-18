// Match the reading estimate across articles: 200 words per minute, without
// counting image URLs, link destinations or authoring notes.
export function readingMinutes(body) {
  const words =
    body
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .match(/\S+/g)?.length || 0
  return Math.max(1, Math.ceil(words / 200))
}
