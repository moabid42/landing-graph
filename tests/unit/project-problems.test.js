import { beforeEach, describe, expect, it, vi } from 'vitest'
import { parseProjects } from '../../src/projects/parse.js'
import { PROBLEMS } from '../../src/contentParsing.js'

describe('project problems', () => {
  beforeEach(() => {
    PROBLEMS.length = 0
  })

  it('skips a backwards range and preserves the other projects', () => {
    const projects = parseProjects(`## Broken
- start: 2026-10
- end: 2025-01
- pinned: true

## Valid
- start: 2025-01
- end: 2026-10

## Undated
A project without dates.
`)
    expect(projects.map((project) => project.title)).toEqual([
      'Valid',
      'Undated',
    ])
    expect(projects[0].single).toBe(false)
    expect(PROBLEMS).toEqual([
      {
        file: 'content/projects.md',
        title: 'Broken',
        msg: '"end" is before "start" — entry skipped',
      },
    ])
  })

  it('keeps project and timeline warnings in their corresponding collections', async () => {
    vi.resetModules()
    vi.doMock('../../src/loadContent.js', () => ({
      PROJECTS_SOURCE: '## Broken project\n- start: 2026-10\n- end: 2025-01\n',
      PROJECTS_FILE: 'content/projects.md',
      TRACK_SOURCES: {},
      TAGS_SOURCE: '## Broken tag\n- date: yesterday\n',
      TAGS_FILE: 'content/tags.md',
      trackFile: (key) => `content/timeline/${key}.md`,
    }))
    try {
      const { PROJECT_PROBLEMS, PROJECTS, PINNED_PROJECTS } =
        await import('../../src/projects.js')
      const { TIMELINE_PROBLEMS } = await import('../../src/content.js')
      expect(PROJECTS).toEqual([])
      expect(PINNED_PROJECTS).toEqual([])
      expect(PROJECT_PROBLEMS).toHaveLength(1)
      expect(PROJECT_PROBLEMS[0].file).toBe('content/projects.md')
      expect(TIMELINE_PROBLEMS.length).toBeGreaterThan(0)
      expect(
        TIMELINE_PROBLEMS.every((p) => p.file !== 'content/projects.md')
      ).toBe(true)
      expect(TIMELINE_PROBLEMS.some((p) => p.file === 'content/tags.md')).toBe(
        true
      )
    } finally {
      vi.doUnmock('../../src/loadContent.js')
      vi.resetModules()
    }
  })
})
