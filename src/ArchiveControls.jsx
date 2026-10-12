export default function ArchiveControls({
  label,
  query,
  setQuery,
  topic,
  setTopic,
  topics,
  count,
  start = 1,
  total,
  matches = total,
}) {
  const range = count > 0 ? `${start}–${start + count - 1}` : 0
  return (
    <div className="archive-controls">
      <div className="archive-fields">
        <label className="archive-search">
          <span className="sr-only">Search {label}</span>
          <input
            type="search"
            placeholder={`Search ${label}…`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label>
          <span className="sr-only">Filter {label} by topic</span>
          <select
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
          >
            <option value="">All topics</option>
            {topics.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        {(query || topic) && (
          <button
            type="button"
            className="gh-btn"
            onClick={() => {
              setQuery('')
              setTopic('')
            }}
          >
            Clear filters
          </button>
        )}
      </div>
      <p className="archive-count" role="status">
        Showing {range} of {matches}
        {matches !== total && ` matches (${total} total)`}
      </p>
    </div>
  )
}
