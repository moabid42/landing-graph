import { PROJECTS_SOURCE, PROJECTS_FILE } from './loadContent.js'
import { parseProjects } from './projects/parse.js'
import { PROBLEMS } from './contentParsing.js'

const projects = parseProjects(PROJECTS_SOURCE, PROJECTS_FILE)
export const PROJECT_PROBLEMS = PROBLEMS.filter((p) => p.file === PROJECTS_FILE)

// Both collections follow the author's curated order; dates are metadata.
export const PINNED_PROJECTS = projects.filter((project) => project.pinned)
export const PROJECTS = projects
export const PROJECT_TOPICS = [
  ...new Set(PROJECTS.flatMap((p) => p.topics)),
].sort()
