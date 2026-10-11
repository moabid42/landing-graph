import { describe, expect, it } from 'vitest'
import { paginate } from '../../src/archive.js'

describe('archive pagination', () => {
  const items = Array.from({ length: 23 }, (_, i) => `project-${i + 1}`)

  it('divides a collection into ten-item pages without losing or repeating entries', () => {
    const pages = [1, 2, 3].map((page) => paginate(items, page))
    expect(pages.map((page) => page.items.length)).toEqual([10, 10, 3])
    expect(pages.flatMap((page) => page.items)).toEqual(items)
    expect(pages.map(({ start, end }) => [start, end])).toEqual([
      [1, 10],
      [11, 20],
      [21, 23],
    ])
    expect(pages.every((page) => page.pageCount === 3)).toBe(true)
  })

  it.each([9, 10, 11, 20])(
    'handles the page boundary at %i entries',
    (count) => {
      const result = paginate(items.slice(0, count))
      expect(result.items).toEqual(items.slice(0, Math.min(count, 10)))
      expect(result.pageCount).toBe(Math.ceil(count / 10))
    }
  )

  it('clamps a bookmarked page after filtering reduces the collection', () => {
    expect(paginate(items.slice(0, 12), 3)).toMatchObject({
      items: ['project-11', 'project-12'],
      page: 2,
      pageCount: 2,
      start: 11,
      end: 12,
    })
    expect(paginate(items.slice(0, 3), 3)).toMatchObject({
      page: 1,
      items: ['project-1', 'project-2', 'project-3'],
    })
  })

  it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    'uses the first page for an invalid page (%s)',
    (page) => {
      expect(paginate(items, page).items).toEqual(items.slice(0, 10))
    }
  )

  it('keeps empty results on one empty page with a zero range', () => {
    expect(paginate([], 999)).toEqual({
      items: [],
      page: 1,
      pageCount: 1,
      start: 0,
      end: 0,
    })
  })
})
