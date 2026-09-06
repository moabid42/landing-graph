// The lists that fill the Research and Stack sections.
//
// Your name, links, hero copy and pinned repos are NOT here — those live in
// site.config.js. Timeline entries live in content/timeline/*.md, blog
// posts in content/blog/*.md.

// Research. Titles + abstracts live here; each links back to ResearchGate.
// Template:
// { title: 'Paper title', abstract: 'One-paragraph abstract…', href: 'https://www.researchgate.net/publication/...' },
export const RESEARCH = []

// Real GitHub language colors.
export const LANGUAGES = [
  { name: 'Python', color: '#3572A5' },
  { name: 'C', color: '#555555' },
  { name: 'C++', color: '#f34b7d' },
  { name: 'Rust', color: '#dea584' },
  { name: 'TypeScript', color: '#3178c6' },
  { name: 'Assembly', color: '#6E4C13' },
]

export const STACK = [
  {
    cat: 'security',
    items:
      'threat modeling · code review · red teaming · binary exploitation · cryptography · web security',
  },
  {
    cat: 'infrastructure',
    items: 'AWS · Docker · Terraform · Ansible · GitHub Actions · GitLab CI',
  },
  { cat: 'spoken', items: 'Arabic (native) · English, German, French (C1)' },
]
