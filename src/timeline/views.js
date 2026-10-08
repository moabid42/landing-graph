import { assignLanes, assignSides } from '../content.js'

// Rebuild the graph around the visible commits. Clone entries so each view
// can have its own lanes without changing the full history.
export function selectTimeline({ entries, branches, points }, highlightsOnly) {
  const selected = entries
    .filter((e) => !highlightsOnly || e.highlight)
    .map((e) => ({ ...e }))
  const byId = Object.fromEntries(selected.map((e) => [e.id, e]))
  const visibleBranches = branches
    .map((b) => {
      const commits = b.entries.map((e) => byId[e.id]).filter(Boolean)
      return commits.length
        ? { ...b, start: commits[0].start, entries: commits }
        : null
    })
    .filter(Boolean)
    .sort((a, b) => a.start - b.start)

  assignSides(visibleBranches)
  assignLanes(visibleBranches)
  for (const b of visibleBranches) for (const e of b.entries) e.lane = b.lane

  return {
    entries: selected,
    branches: visibleBranches,
    points: points.filter((p) => !highlightsOnly || p.highlight),
  }
}
