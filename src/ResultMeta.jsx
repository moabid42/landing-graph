import { LANGUAGES, updatedDate } from './searchQuery.js'
import { tagLabel } from './taxonomy.js'

const absoluteDate = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})
const relativeDate = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

function relative(value) {
  const now = new Date()
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  )
  const days = Math.round((new Date(`${value}T00:00:00Z`) - today) / 86400000)
  if (Math.abs(days) < 30) return relativeDate.format(days, 'day')
  if (Math.abs(days) < 365)
    return relativeDate.format(Math.trunc(days / 30), 'month')
  return relativeDate.format(Math.trunc(days / 365), 'year')
}

export default function ResultMeta({ item, children }) {
  const language = item.languages?.find((id) => Object.hasOwn(LANGUAGES, id))
  const date = updatedDate(item)
  if (!language && !date && !children) return null
  return (
    <div className="result-meta">
      {language && (
        <span className="result-language">
          <span
            className="language-dot"
            style={{ backgroundColor: LANGUAGES[language] }}
            aria-hidden="true"
          />
          {tagLabel('languages', language)}
        </span>
      )}
      {children}
      {date && (
        <span className="result-updated">
          <time
            dateTime={date}
            title={absoluteDate.format(new Date(`${date}T00:00:00Z`))}
          >
            {item.updated ? 'Updated' : 'Published'} {relative(date)}
          </time>
        </span>
      )}
    </div>
  )
}
