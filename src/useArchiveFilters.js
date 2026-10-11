import { useCallback, useEffect, useState } from 'react'
import { pageFromPath } from './paths.js'

function readFilters(enabled, paginated) {
  if (!enabled) return { query: '', topic: '', currentPage: 1 }
  const params = new URLSearchParams(window.location.search)
  const requestedPage = paginated ? Number(params.get('page')) : 1
  return {
    query: params.get('q') || '',
    topic: params.get('topic') || '',
    currentPage:
      Number.isSafeInteger(requestedPage) && requestedPage > 0
        ? requestedPage
        : 1,
  }
}

// Keep filters in the URL so reloads, shared links and returning from a post
// restore the same collection. Typing replaces this entry in browser history.
export default function useArchiveFilters(page, enabled, paginated = false) {
  const [filters, setFilters] = useState(() => readFilters(enabled, paginated))

  useEffect(() => {
    if (!enabled) return
    const restore = () => setFilters(readFilters(enabled, paginated))
    window.addEventListener('popstate', restore)
    return () => window.removeEventListener('popstate', restore)
  }, [enabled, paginated])

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
    if (paginated) {
      if (filters.currentPage > 1)
        url.searchParams.set('page', filters.currentPage)
      else url.searchParams.delete('page')
    }
    window.history.replaceState(window.history.state, '', url)
  }, [enabled, page, paginated, filters])

  const setCurrentPage = useCallback(
    (currentPage) => setFilters((current) => ({ ...current, currentPage })),
    []
  )

  return {
    ...filters,
    setQuery: (query) =>
      setFilters((current) => ({ ...current, query, currentPage: 1 })),
    setTopic: (topic) =>
      setFilters((current) => ({ ...current, topic, currentPage: 1 })),
    setCurrentPage,
  }
}
