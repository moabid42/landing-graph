// Everything on the page that is not the timeline lives here. Timeline
// entries live in content/*.md and are parsed by src/content.js.
//
// This is the file to edit first after forking. Replace every value below
// with your own — nothing here is referenced by the timeline engine.

// ---------- identity ----------
export const FULL_NAME = 'Your Name'
export const OWNER = 'yourhandle' // the "owner" half of the header crumb
export const SITE_NAME = 'yoursite.dev' // the "repo" half of the header crumb
export const EMAIL = 'you@example.com'

// ---------- remotes (the Contact table) ----------
export const GITHUB_URL = 'https://github.com/yourhandle'
export const LINKEDIN_URL = 'https://linkedin.com/in/yourhandle'
export const MEDIUM_URL = 'https://medium.com/@yourhandle'
export const RESEARCHGATE_URL = 'https://www.researchgate.net/profile/Your-Name'

// ---------- pinned repositories — the Pinned section ----------
// Template:
// { title, text, topics: [], href: 'https://…' | null, visibility: 'Public' | 'Internal' }
export const WORK = [
  {
    title: 'example-project',
    text: 'One or two sentences on what this is and why it mattered. Lead with the outcome, not the tech stack.',
    topics: ['topic', 'topic', 'topic'],
    href: 'https://github.com/yourhandle',
    visibility: 'Public',
  },
  {
    title: 'another-project',
    text: 'Work you cannot link to still belongs here — mark it Internal and describe the shape of it.',
    topics: ['topic', 'topic'],
    href: null,
    visibility: 'Internal',
  },
]

// ---------- research — the Research section ----------
// Leave empty to show the blank slate instead.
// Template:
// { title: 'Paper title', abstract: 'One-paragraph abstract…', href: 'https://…' },
export const RESEARCH = []

// ---------- stack ----------
// Real GitHub language colors: https://github.com/ozh/github-colors
export const LANGUAGES = [
  { name: 'JavaScript', color: '#f1e05a' },
  { name: 'Python', color: '#3572A5' },
  { name: 'Go', color: '#00ADD8' },
  { name: 'Rust', color: '#dea584' },
  { name: 'C', color: '#555555' },
]

export const STACK = [
  { cat: 'category', items: 'skill · skill · skill · skill' },
  { cat: 'infrastructure', items: 'tool · tool · tool · tool' },
  { cat: 'spoken', items: 'Language (native) · Language (C1)' },
]

// Blog posts are markdown files in content/blog/ — see src/blog.js.
