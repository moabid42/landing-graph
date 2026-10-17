import { useCallback, useEffect, useState } from 'react'
import { pageFromPath } from './paths.js'
import { readFilters } from './archive.js'
import { FACETS } from './taxonomy.js'
import { parseQuery, toggleQualifier, removeQualifier } from './searchQuery.js'

// Keep filters in the URL so reloads, shared links and returning from a post
// restore the same collection. Typing replaces this entry in browser history.
export default function useArchiveFilters(
  page,
  enabled,
  available,
  paginated = false
) {
  const [filters, setFilters] = useState(() =>
    readFilters(enabled ? window.location.search : '', available, paginated)
  )

  useEffect(() => {
    if (!enabled) return
    const restore = () =>
      setFilters(readFilters(window.location.search, available, paginated))
    window.addEventListener('popstate', restore)
    return () => window.removeEventListener('popstate', restore)
  }, [enabled, available, paginated])

  useEffect(() => {
    if (!enabled || pageFromPath(window.location.pathname) !== page) return
    const url = new URL(window.location.href)
    for (const [key, value] of [
      ['q', filters.query],
      ...FACETS.map(({ param }) => [param, '']),
      ['sort', filters.sort === 'updated' ? 'updated' : ''],
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
    ...parseQuery(filters.query),
    setQuery: (query) =>
      setFilters((current) => ({ ...current, query, currentPage: 1 })),
    setFacet: (param, value) =>
      setFilters((current) => ({
        ...current,
        query: toggleQualifier(current.query, param, value),
        currentPage: 1,
      })),
    removeQualifier: (qualifier) =>
      setFilters((current) => ({
        ...current,
        query: removeQualifier(current.query, qualifier),
        currentPage: 1,
      })),
    isSelected: (param, value) =>
      parseQuery(filters.query).qualifiers.some(
        (q) => q.key === param && q.value === value && !q.negative
      ),
    setSort: (sort) =>
      setFilters((current) => ({ ...current, sort, currentPage: 1 })),
    clear: () => setFilters(readFilters('', available, paginated)),
    setCurrentPage,
  }
}
