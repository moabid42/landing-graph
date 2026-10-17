import { describe, it, expect } from 'vitest'
import { PROJECTS, PINNED_PROJECTS } from '../../src/projects.js'
import { parseProjects } from '../../src/projects/parse.js'
import { ENTRIES, TRACKS, PROBLEMS, parseTrack } from '../../src/content.js'
import { TRACK_SOURCES, PROJECTS_SOURCE } from '../../src/loadContent.js'
import { pageMarkdown } from '../../plugins/pageSnapshot.js'
import { header, profile } from '../../plugins/llmsFiles.js'

describe('project authoring', () => {
  it('pins only an explicit true flag, including the compact list syntax', () => {
    const projects = parseProjects(`## Pinned
-pinned: true
Featured project.

## Unpinned
- pinned: false
Another project.

## Default
- highlight: true
A project without a flag.
`)
    expect(projects.filter((p) => p.pinned).map((p) => p.title)).toEqual([
      'Pinned',
    ])
    expect(projects).toHaveLength(3)
  })

  it('keeps projects without dates and preserves metadata', () => {
    const [project] = parseProjects(`## Tool
- link: https://example.com/tool
- topics: security, systems, security
An undated tool.
`)
    expect(project).toMatchObject({
      title: 'Tool',
      text: 'An undated tool.',
      start: null,
      end: null,
      pinned: false,
      link: 'https://example.com/tool',
      topics: ['security', 'systems'],
    })
  })

  it('preserves single dates and ongoing date ranges', () => {
    const projects = parseProjects(`## Release
- date: 2025-04

## Ongoing
- start: 2026-01
- end: now
`)
    expect(projects[0].single).toBe(true)
    expect(projects[0].start).toBeGreaterThan(2025)
    expect(projects[1]).toMatchObject({ single: false, end: null })
  })
})

describe('project migration', () => {
  it('keeps every project once and derives pins from the full collection', () => {
    const authored = parseProjects(PROJECTS_SOURCE)
    expect(PROBLEMS).toEqual([])
    expect(PROJECTS.length).toBeGreaterThan(0)
    expect(new Set(PROJECTS.map((p) => p.id)).size).toBe(PROJECTS.length)
    expect(PROJECTS.map((p) => p.id).sort()).toEqual(
      authored.map((p) => p.id).sort()
    )
    expect(PINNED_PROJECTS.map((p) => p.id)).toEqual(
      authored.filter((p) => p.pinned).map((p) => p.id)
    )
    expect(PINNED_PROJECTS.every((pin) => PROJECTS.includes(pin))).toBe(true)
    for (const project of PROJECTS) {
      expect(project.title.trim()).toBeTruthy()
      expect(project.text.trim()).toBeTruthy()
      expect(project.visibility.trim()).toBeTruthy()
      expect(Array.isArray(project.topics)).toBe(true)
      if (project.link) expect(project.link).toMatch(/^https?:\/\//)
    }
  })

  it('preserves the curated order regardless of project dates or pins', () => {
    expect(PROJECTS.map((project) => project.id)).toEqual(
      parseProjects(PROJECTS_SOURCE).map((project) => project.id)
    )
  })

  it('replaces the projects track with trainings and supports empty or populated content', () => {
    expect(TRACKS).not.toHaveProperty('projects')
    expect(ENTRIES.some((entry) => entry.track === 'projects')).toBe(false)
    expect(TRACKS).toHaveProperty('trainings')
    expect(
      parseTrack('<!-- Add trainings here. -->', 'trainings', 'trainings.md')
    ).toEqual([])
    expect(
      ENTRIES.filter((entry) => entry.track === 'trainings').map(
        (entry) => entry.id
      )
    ).toEqual(
      parseTrack(TRACK_SOURCES.trainings, 'trainings', 'trainings.md')
        .sort((a, b) => a.start - b.start)
        .map((entry) => entry.id)
    )
    expect(
      parseTrack(
        '## Course\n- date: 2026-10\nCompleted a course.',
        'trainings',
        'trainings.md'
      )[0]
    ).toMatchObject({ track: 'trainings', title: 'Course', single: true })
  })

  it('exports projects separately from the timeline for static readers', () => {
    const projects = pageMarkdown('work', [], 'content/timeline')
    const timeline = pageMarkdown('timeline', [], 'content/timeline')
    const index = header([])
    const full = profile([], 'content/timeline')
    for (const project of PROJECTS) {
      expect(projects).toContain(`## ${project.title}`)
      expect(index).toContain(project.title)
      expect(full).toContain(project.title)
    }
    expect(timeline).toContain('## trainings')
    expect(timeline).not.toContain('## Decnique')
    expect(timeline).not.toContain('## ft_minishell')
    expect(projects).not.toContain('Add a project as')
  })
})
