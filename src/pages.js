import config from '../site.config.js'

// Shared by the router, page headers and static build.
export const PAGES = {
  work: {
    title: 'Selected work',
    file: 'work.md',
    description:
      'Tools and infrastructure I have built, from detection engineering and cloud security to CTF platforms and red-team automation.',
  },
  timeline: {
    title: 'Timeline',
    file: 'timeline.md',
    description:
      'The full graph: work, education, projects, startups and speaking. Follow each branch from its first commit to where it merges, or filter by track.',
  },
  writing: {
    title: 'Writing',
    file: 'writing.md',
    description:
      'Notes from taking systems apart: low-level programming, reverse engineering, exploitation and cloud security. Every post, newest first.',
  },
  research: {
    title: 'Research',
    file: 'research.md',
    description:
      'Papers on how systems fail and how to reason about their security, covering attack planning, anti-debugging and cryptographic randomness.',
  },
  stack: {
    title: 'Stack',
    file: 'stack.md',
    description:
      'The languages, tools and areas I work with, across security engineering, infrastructure and systems programming.',
  },
  soul: {
    title: config.soul.title,
    file: 'soul.md',
    description: config.soul.description,
  },
  more: {
    title: 'Contact',
    file: 'remotes.md',
    description:
      'Code, writing, research and ways to get in touch. These are the remotes where you can find more of my work.',
  },
}
