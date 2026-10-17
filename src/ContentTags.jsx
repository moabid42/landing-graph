import { FACETS, tagLabel } from './taxonomy.js'

export default function ContentTags({ item, filters, className = '' }) {
  return (
    <div className={`content-tags ${className}`}>
      {FACETS.filter(({ key }) => !filters || key !== 'languages').flatMap(
        ({ key, param, label }) =>
          (item[key] || []).map((value) =>
            filters ? (
              <button
                key={`${key}-${value}`}
                type="button"
                className="topic"
                title={`${label}: ${tagLabel(key, value)}`}
                aria-pressed={filters.isSelected(param, value)}
                onClick={() => filters.setFacet(param, value)}
              >
                {tagLabel(key, value)}
              </button>
            ) : (
              <span
                key={`${key}-${value}`}
                className="topic"
                title={`${label}: ${tagLabel(key, value)}`}
              >
                {tagLabel(key, value)}
              </span>
            )
          )
      )}
    </div>
  )
}
