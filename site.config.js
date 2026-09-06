// ============================================================================
// site.config.js — everything that makes this site yours.
//
// This is the only file you have to edit to put your own name on the site.
// Your timeline lives in content/timeline/*.md, your posts in
// content/blog/*.md, and the lists that fill the Pinned / Research / Stack
// sections are in src/data.js. Nothing else needs touching.
// ============================================================================

export default {
  // ---------------------------------------------------------------- identity
  identity: {
    // The header crumb reads "handle / repo", like a repository page.
    handle: 'moabid42',
    repo: 'moabid.me',

    // One letter for the circular avatar next to the crumb.
    avatar: 'm',

    // The README hero.
    name: 'Mouad Abid',
    tagline:
      'Software security engineer. Experienced in building and breaking complex' +
      ' & highload systems, currently attacking Schwarz Group ' +
      'from the inside, on purpose.',

    // The pull quote under the tagline. Explains the graph to a first-time
    // reader; rewrite it in your own voice or set it to null to hide it.
    blurb:
      'The career below is rendered the only honest way: `git log --graph ' +
      '--all`. Every job, degree and project is a branch. Most of them ran ' +
      'at the same time.',

    // The green-dot status line. Set status to null to hide the whole row.
    status: 'now · offensive security @ schwarz digits',
    location: 'heilbronn, de',

    email: 'moabid42@proton.me',
  },

  // ------------------------------------------------------------------- links
  // Rendered as the `git remote -v` table in the Contact section, in this
  // order. Sections elsewhere look these up by name: "medium" is the Writing
  // section's link, "researchgate" is the Research section's, "github" is the
  // header crumb. Add, remove or reorder freely — a missing name just hides
  // whatever renders it.
  links: [
    { name: 'origin', url: 'mailto:moabid42@proton.me', kind: 'email' },
    { name: 'github', url: 'https://github.com/moabid42', kind: 'fetch' },
    { name: 'linkedin', url: 'https://linkedin.com/in/moabid42', kind: 'fetch' },
    { name: 'medium', url: 'https://medium.com/@m0ab1d42', kind: 'fetch' },
    {
      name: 'researchgate',
      url: 'https://www.researchgate.net/profile/Mouad-Abid',
      kind: 'fetch',
    },
  ],

  // --------------------------------------------------------------------- seo
  // Applied to the document at runtime. index.html carries the same values
  // as a static fallback for crawlers that do not run scripts.
  seo: {
    // Where the site is served from, no trailing slash. Canonical urls, the
    // share image and sitemap.xml are all built from this. Leave it empty
    // and those are simply left out.
    //
    // This is the GitHub Pages project url. Point a custom domain at the
    // repo and this becomes 'https://moabid.me' — one line, nothing else
    // changes, because the build uses relative paths throughout.
    url: 'https://moabid42.github.io/landing-graph',

    description:
      'Mouad Abid — software security engineer. Career rendered as git log ' +
      '--graph --all: every job, degree and project as a branch.',

    // The picture shown when a link is posted to LinkedIn, X or Slack.
    // A path under public/, or a full url. 1200x630 is the safe size.
    // Empty means links share without a picture.
    //
    // public/og.png is generated from public/favicon-default.svg and the
    // identity above — run `npm run og` after changing either.
    image: '/og.png',

    themeColor: '#0d1117',
  },

  // ------------------------------------------------------------------ tracks
  // One entry per file in content/timeline/. `key` IS the filename:
  // key 'work' reads content/timeline/work.md.
  //
  // Adding a track is one entry here plus one markdown file — no CSS, no
  // code. Removing one is deleting both. A file with no entry, or an entry
  // with no file, shows up in the warning banner above the graph instead of
  // failing silently.
  //
  //   key        filename in content/timeline/, and the CSS class
  //   label      shown in the filter legend and on each card
  //   color      branch color in dark mode
  //   colorLight branch color in light mode (optional — falls back to color)
  //   continuous all entries ride ONE shared branch that forks at the first
  //              and stays open, each entry a commit on it. Good for
  //              recurring activity: talks, teaching, writing. Default false,
  //              which gives every entry its own branch.
  tracks: [
    { key: 'work', label: 'work', color: '#3fb950', colorLight: '#1a7f37' },
    { key: 'education', label: 'education', color: '#58a6ff', colorLight: '#0969da' },
    { key: 'projects', label: 'projects', color: '#a371f7', colorLight: '#8250df' },
    { key: 'startups', label: 'startups', color: '#f0883e', colorLight: '#bc4c00' },
    {
      key: 'speaking',
      label: 'speaking',
      color: '#db61a2',
      colorLight: '#bf3989',
      continuous: true,
    },
  ],

  // -------------------------------------------------------------------- work
  // The cards in the Pinned section, in this order. The count in the header
  // tab follows the length of this list.
  //
  //   title      repo name on the card
  //   text       one paragraph, what it is and why it mattered
  //   topics     the little grey pills under the text
  //   href       where the title links; null renders it as plain text, for
  //              work that has no public url
  //   visibility the badge on the right of the title, e.g. Public, Internal
  work: [
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
  ],

  // ------------------------------------------------------------------ footer
  footer: {
    // {year} is replaced with the current year.
    text: '© {year} Mouad Abid · Heilbronn',
    note: 'rendered from `git log --graph --all` · v2.0',
  },
}
