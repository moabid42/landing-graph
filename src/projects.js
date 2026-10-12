import { PROJECTS_SOURCE, PROJECTS_FILE } from './loadContent.js'
import { parseProjects } from './projects/parse.js'

const projects = parseProjects(PROJECTS_SOURCE, PROJECTS_FILE)

// Pins keep the author's order; the complete collection is newest first,
// followed by projects whose dates have not been supplied.
export const PINNED_PROJECTS = projects.filter((project) => project.pinned)
export const PROJECTS = [...projects].sort(
  (a, b) => (b.start ?? -Infinity) - (a.start ?? -Infinity)
)
export const PROJECT_TOPICS = [
  ...new Set(PROJECTS.flatMap((p) => p.topics)),
].sort()
