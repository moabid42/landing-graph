import { RESEARCH_SOURCE, RESEARCH_FILE } from './loadContent.js'
import { parseResearch } from './research/parse.js'
import { PROBLEMS } from './contentParsing.js'
import { facetOptions } from './archive.js'

export const RESEARCH = parseResearch(RESEARCH_SOURCE, RESEARCH_FILE)
export const RESEARCH_PROBLEMS = PROBLEMS.filter(
  (p) => p.file === RESEARCH_FILE
)

// Both collections follow the author's curated order.
export const PINNED_RESEARCH = RESEARCH.filter((paper) => paper.pinned)
export const RESEARCH_FACETS = facetOptions(RESEARCH)
