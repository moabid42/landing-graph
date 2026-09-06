// The lists that fill the Pinned, Research and Stack sections.
//
// Your name, links and hero copy are NOT here — those live in
// site.config.js. Timeline entries live in content/*.md, blog posts in
// content/blog/*.md. Everything below is yours to replace.

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
