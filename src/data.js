// The lists that fill the Pinned, Research and Stack sections.
//
// Your name, links and hero copy are NOT here — those live in
// site.config.js. Timeline entries live in content/timeline/*.md, blog
// posts in content/blog/*.md.

// Pinned repositories — the Pinned section.
export const WORK = [
  {
    title: 'decnique',
    text: 'A domain-specific language and SMT-backed coverage engine that models SIEM detection rules and attacker techniques on one shared event schema — surfacing detection gaps in cloud IAM.',
    topics: ['dsl', 'smt', 'sigma', 'elastic', 'panther'],
    href: 'https://github.com/moabid42',
    visibility: 'Public',
  },
  {
    title: 'mals3scan',
    text: 'Serverless AWS security pipeline that scans every file uploaded to S3 with YARA rules for malware and sensitive data, firing real-time alerts for incident response.',
    topics: ['aws', 'lambda', 'yara', 'terraform'],
    href: 'https://github.com/moabid42',
    visibility: 'Public',
  },
  {
    title: 'l3ak-ctf-infra',
    text: 'Architecture and operations for a high-traffic yearly CTF: 15,000+ concurrent users and millions of requests inside the opening hour.',
    topics: ['high-load', 'docker', 'monitoring'],
    href: 'https://ctftime.org/team/220336',
    visibility: 'Public',
  },
  {
    title: 'redteam-copilot',
    text: 'First-of-its-kind internal infrastructure and copilot for red-team engagements at Schwarz Digits, accelerating workflows roughly tenfold.',
    topics: ['llm', 'red-team', 'automation'],
    href: null,
    visibility: 'Internal',
  },
]

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
