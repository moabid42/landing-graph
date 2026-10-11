import { useEffect, useState } from 'react'
import { pageFromPath } from './paths.js'

function readFilters(enabled) {
  if (!enabled) return { query: '', topic: '' }
  const params = new URLSearchParams(window.location.search)
  return { query: params.get('q') || '', topic: params.get('topic') || '' }
}

// Keep filters in the URL so reloads, shared links and returning from a post
// restore the same collection. Typing replaces this entry in browser history.
export default function useArchiveFilters(page, enabled) {
  const [filters, setFilters] = useState(() => readFilters(enabled))

  useEffect(() => {
    if (!enabled) return
    const restore = () => setFilters(readFilters(enabled))
    window.addEventListener('popstate', restore)
    return () => window.removeEventListener('popstate', restore)
  }, [enabled])

  useEffect(() => {
    if (!enabled || pageFromPath(window.location.pathname) !== page) return
    const url = new URL(window.location.href)
    for (const [key, value] of [
      ['q', filters.query],
      ['topic', filters.topic],
    ]) {
      if (value) url.searchParams.set(key, value)
      else url.searchParams.delete(key)
    }
    window.history.replaceState(window.history.state, '', url)
  }, [enabled, page, filters])

  return {
    ...filters,
    setQuery: (query) => setFilters((current) => ({ ...current, query })),
    setTopic: (topic) => setFilters((current) => ({ ...current, topic })),
  }
}
