import { useId, useState } from 'react'
import { tagLabel } from './taxonomy.js'
import { facetOptions, filterContent } from './archive.js'
import { LANGUAGES, SEARCH_FACETS } from './searchQuery.js'
import { IconGlobe, IconTag } from './icons.jsx'
import ArchiveSort from './ArchiveSort.jsx'

const FILTER_ICONS = {
  domain: IconGlobe,
  topic: IconTag,
}

function SidebarGroup({ facet, items, filters, available }) {
  const [expanded, setExpanded] = useState(false)
  const { param, key, title, heading } = facet
  const FacetIcon = FILTER_ICONS[param]
  const candidates = filterContent(items, filters, param)
  const counts = new Map()
  for (const item of candidates)
    for (const value of item[key] || [])
      counts.set(value, (counts.get(value) || 0) + 1)
  const values = available[key]
  const totals = new Map()
  for (const item of items)
    for (const value of item[key] || [])
      totals.set(value, (totals.get(value) || 0) + 1)
  const ranked = [...values].sort(
    (a, b) =>
      (totals.get(b) || 0) - (totals.get(a) || 0) ||
      tagLabel(key, a).localeCompare(tagLabel(key, b))
  )
  const visible = expanded
    ? ranked
    : ranked.filter(
        (value, index) => index < 6 || filters.isSelected(param, value)
      )
  if (!values.length) return null
  return (
    <section className="archive-filter-group" aria-label={`${heading} filters`}>
      <h3>{heading}</h3>
      <ul>
        {visible.map((value) => {
          const selected = filters.isSelected(param, value)
          return (
            <li key={value}>
              <button
                type="button"
                className="archive-filter-option"
                aria-label={`${title}: ${tagLabel(key, value)}`}
                aria-pressed={selected}
                disabled={!counts.has(value) && !selected}
                onClick={() => filters.setFacet(param, value)}
              >
                {param === 'language' ? (
                  <span
                    className="language-dot"
                    style={{ backgroundColor: LANGUAGES[value] }}
                    aria-hidden="true"
                  />
                ) : (
                  <FacetIcon className="filter-icon" />
                )}
                <span>{tagLabel(key, value)}</span>
                <span className="filter-count" aria-hidden="true">
                  {counts.get(value) || 0}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {ranked.length > 6 && (
        <button
          className="archive-filter-more"
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show less' : `More ${heading.toLowerCase()}…`}
        </button>
      )}
    </section>
  )
}

export default function ArchiveControls({
  label,
  filters,
  items,
  count,
  start = 1,
  total,
  matches = total,
  children,
  defaultSort = 'Recommended',
  enabled = true,
}) {
  const id = useId()
  const [mobileOpen, setMobileOpen] = useState(false)
  const available = facetOptions(items)
  const range = count > 0 ? `${start}–${start + count - 1}` : 0
  const hasFilters = Boolean(filters.query)
  if (!enabled) return children
  return (
    <div className="archive-browser">
      <div className="archive-query">
        <div className="archive-search-row">
          <label className="archive-search">
            <span className="sr-only">Search {label}</span>
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
              <path
                d="m11.5 11.5 3 3M12.5 7A5.5 5.5 0 1 1 1.5 7a5.5 5.5 0 0 1 11 0Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            <input
              type="search"
              placeholder={`Search ${label}…`}
              value={filters.query}
              onChange={(event) => filters.setQuery(event.target.value)}
              spellCheck="false"
              autoComplete="off"
            />
          </label>
          <button
            className="gh-btn archive-mobile-toggle"
            type="button"
            aria-expanded={mobileOpen}
            aria-controls={id}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            Filters
            {filters.qualifiers.length > 0 && ` (${filters.qualifiers.length})`}
          </button>
        </div>
        {filters.errors.length > 0 && (
          <p className="archive-search-error" role="alert">
            {filters.errors[0]}
          </p>
        )}
        {filters.qualifiers.length > 0 && (
          <div className="archive-active-filters" aria-label="Active filters">
            {filters.qualifiers.map((q, index) => (
              <button
                key={`${q.raw}-${index}`}
                type="button"
                aria-label={`Remove ${q.raw} filter`}
                onClick={() => filters.removeQualifier(q)}
              >
                {q.negative && '−'}
                {q.key}:{' '}
                {q.key === 'updated'
                  ? q.value
                  : tagLabel(
                      SEARCH_FACETS.find((f) => f.param === q.key)?.key,
                      q.value
                    )}{' '}
                <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <aside
        id={id}
        className={`archive-sidebar${mobileOpen ? ' is-open' : ''}`}
        aria-label={`${label} filters`}
      >
        {SEARCH_FACETS.map((facet) => (
          <SidebarGroup
            key={facet.param}
            facet={facet}
            items={items}
            filters={filters}
            available={available}
          />
        ))}
        <button
          className="gh-btn archive-mobile-done"
          type="button"
          onClick={() => setMobileOpen(false)}
        >
          Show {matches} {matches === 1 ? 'result' : 'results'}
        </button>
      </aside>
      <div className="archive-results">
        <div className="archive-result-toolbar">
          <div>
            <strong className="archive-result-total">
              {matches} {matches === 1 ? 'result' : 'results'}
            </strong>
            <p className="archive-count" role="status">
              Showing {range} of {matches}
              {matches !== total && ` matches (${total} total)`}
            </p>
          </div>
          <ArchiveSort
            label={label}
            value={filters.sort}
            onChange={filters.setSort}
            defaultSort={defaultSort}
          />
          {hasFilters && (
            <button
              type="button"
              className="archive-clear"
              onClick={filters.clear}
            >
              Clear filters
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
