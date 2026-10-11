export function paginate(items, requestedPage = 1, pageSize = 10) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const page = Math.min(
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1,
    pageCount
  )
  const offset = (page - 1) * pageSize
  return {
    items: items.slice(offset, offset + pageSize),
    page,
    pageCount,
    start: items.length ? offset + 1 : 0,
    end: Math.min(offset + pageSize, items.length),
  }
}
