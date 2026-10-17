// ============================================================================
// site.config.js — everything that makes this site yours.
//
// This is the only file you have to edit to put your own name on the site.
// Your timeline lives in content/timeline/*.md, your posts in content/blog/*.md
// your projects in content/projects.md, and your personal philosophy in
// content/soul.md; the Research and Stack sections are configured here.
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
      "I'm a software security engineer who likes systems where security, performance and weird edge cases collide. I build secure infrastructure, research how systems fail, and occasionally turn those failures into tools, papers and talks.",

    // What you do, in the words a recruiter would search for. Search engines
    // and AI assistants read it as your job title; it is not shown on the page.
    jobTitle: 'Software Security Engineer',

    // The pull quote under the tagline. Explains the graph to a first-time
    // reader; rewrite it in your own voice or set it to null to hide it.
    blurb:
      "I've always had a habit of asking too many why question, and somehow curiosity has taken me further than any plan I've ever made.",

    // The green-dot status line. Set status to null to hide the whole row.
    status: 'now · offensive security engineer @ Schwarz Digits',
    location: 'Heilbronn, DE',

    email: 'moabid42@proton.me',

    // The repo this site is built from — the header's Fork button. Set it to
    // null to hide the button.
    source: 'https://github.com/moabid42/landing-graph',
  },

  // -------------------------------------------------------------------- soul
  // The personal page at /soul/. Its body lives in content/soul.md; these
  // strings label the page, navigation tab and search/share previews.
  soul: {
    title: 'WhoAmI',
    description: 'My philosophy, the things I value, und co.',
  },

  // ------------------------------------------------------------------- links
  // Rendered as the `git remote -v` table in the Contact section, in this
  // order. Sections elsewhere look these up by name: "medium" is the Writing
  // section's link, "researchgate" is the Research section's, "github" is the
  // header crumb and "linkedin" is the LinkedIn button. Add, remove or reorder
  // freely — a missing name just hides whatever renders it.
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
  // The build writes these into the html of every page it emits, and the app
  // keeps them in step as the router moves. Nothing here is duplicated by
  // hand anywhere else.
  seo: {
    // Where the site is served from, no trailing slash.
    //
    // This is the one line the rest of the site hangs off: its path is the
    // base every link and asset is built against, and its origin is what
    // canonical urls, og:url, the share image and sitemap.xml are made
    // absolute with.
    //
    // The custom domain the repo's Pages site answers on. On a fork with no
    // domain this is the project url instead — 'https://you.github.io/repo'
    // — and the base path follows it; nothing else changes.
    url: 'https://moabid.me',

    // The <title> of the README, and the headline on every share card for
    // it. The header crumb is not this: that is identity.handle / repo, and
    // it stays a repository breadcrumb. This is what a search result says,
    // so write the words someone would actually type to find you — a handle
    // and a domain are not among them. Leave it out and the crumb is used.
    title: 'Mouad Abid | Software Security Engineer',

    description:
      'Mouad Abid — software security engineer. Career rendered as git log ' +
      '--graph --all: every job, degree and training as a branch.',

    // The picture shown when a link is posted to LinkedIn, X or Slack.
    // A path under public/, or a full url. 1200x630 is the safe size.
    // Empty means links share without a picture.
    //
    // public/og.png is generated from public/favicon-default.svg and the
    // identity above — run `npm run og` after changing either.
    image: '/og.png',

    // What the share image shows, for people who cannot see it. Leave it out
    // and the title above is used.
    imageAlt: 'Mouad Abid, software security engineer — moabid.me',

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
    { key: 'trainings', label: 'trainings', color: '#a371f7', colorLight: '#8250df' },
    { key: 'startups', label: 'startups', color: '#f0883e', colorLight: '#bc4c00' },
    {
      key: 'speaking',
      label: 'speaking',
      color: '#db61a2',
      colorLight: '#bf3989',
      continuous: true,
    },
  ],

  // -------------------------------------------------------------------- note
  // The GitHub-style Note callout at the foot of the README hero — the place
  // to tell a first-time reader where new work shows up first. Set the whole
  // block to null to hide it.
  //
  //   link   which remote in links[] it points at, by name. A name that is
  //          not there hides the callout, same as everywhere else.
  //   label  the text on the link at the bottom of the callout
  //   text   the callout itself
  note: null,

  // ---------------------------------------------------------------- research
  // The Research section: one clickable box per paper, opening its
  // ResearchGate page. An empty list shows the "being indexed" panel with a
  // link to the full profile instead.
  //
  //   title   the paper title, as published
  //   tldr    the finding in a sentence or two, not the abstract
  //   domains / technologies / topics  IDs from src/taxonomy.js, shared
  //                                    with projects and writing
  //   href    where the box opens — the ResearchGate publication url. The
  //           card footer is read off this url: the archive it is hosted on,
  //           and the publication number, shown like a commit sha.
  research: [
    {
      title: 'Recon as a First-Class Planning Action under Partial Observability',
      tldr: 'Attack-path planners almost all assume they already know the network. Modelling reconnaissance as a planning action with its own OPSEC cost and information gain reaches the goal in 80.3% of randomised Active Directory graphs against 52.3% for a two-phase baseline — but only once the pursuit is directed and multi-step.',
      domains: ['offensive-security'],
      technologies: ['active-directory'],
      topics: ['attack-planning', 'partial-observability', 'reconnaissance'],
      href: 'https://www.researchgate.net/publication/405230754_Recon_as_a_First-Class_Planning_Action_under_Partial_Observability',
    },
    {
      title: 'HOP: Hook Oriented Programming',
      tldr: 'Licence checks fall to debuggers, and anti-debugging in turn falls to whatever an attacker can patch out. HOP is a Linux anti-debugging design that claims the one debugger slot a process is allowed to have, so the protection has to be evicted before a debugger can attach at all.',
      domains: ['offensive-security', 'systems-programming'],
      technologies: ['linux', 'c', 'assembly'],
      topics: ['anti-debugging', 'reverse-engineering'],
      href: 'https://www.researchgate.net/publication/396647415_HOP_-Hook_Oriented_Programming',
    },
    {
      title: 'RCPRNG: Robust Complete PRNG',
      tldr: 'Cryptographic PRNG models assume unlimited compute and clean entropy; embedded systems have neither, and there entropy accumulation and generation share the same scarce resources. RCPRNG folds both into one security model whose completeness property carries guarantees across arbitrary state transitions, and shows the Gaži-Tessaro sponge construction satisfies it.',
      domains: ['cryptography'],
      technologies: [],
      topics: ['pseudo-randomness', 'entropy', 'formal-methods'],
      href: 'https://www.researchgate.net/publication/396647163_RCPRNG_-_Robust_Complete_Pseudo_Random_Number_Generator',
    },
    // {
    //   title: 'Paper title, as published',
    //   tldr: 'What it found, in a sentence or two.',
    //   domains: ['offensive-security'],
    //   technologies: [],
    //   topics: ['attack-planning'],
    //   href: 'https://www.researchgate.net/publication/...',
    // },
  ],

  // ------------------------------------------------------------------- stack
  // The Stack section: a GitHub-style language bar, then one row per
  // category. Both lists render in the order written here.
  //
  // languages fill the bar in equal segments — name plus the colour GitHub
  // uses for that language.
  languages: [
  { name: 'Python', color: '#3572A5' },
  { name: 'C', color: '#555555' },
  { name: 'C++', color: '#f34b7d' },
  { name: 'TypeScript', color: '#3178c6' },
  { name: 'Assembly', color: '#6E4C13' },
  ],

  // stack rows are free text: `cat` is the label on the left, `items` the
  // line on the right. Add or drop a row and the list follows.
  stack: [
  {
    cat: 'security',
    items:
      'red teaming · detection engineering · cloud security · threat modeling · code review · reverse engineering · binary exploitation · cryptography',
  },
  {
    cat: 'infrastructure',
    items: 'AWS · GCP · Docker · Podman · Terraform · Ansible · GitHub Actions · GitLab CI',
  },
  { cat: 'spoken', items: 'Arabic (native) · English, German, French (C1)' },
  ],

  // ------------------------------------------------------------------ footer
  footer: {
    // {year} is replaced with the current year.
    text: '© {year} Mouad Abid · Heilbronn',
    note: 'rendered from `git log --graph --all` · v2.0',
  },
}
