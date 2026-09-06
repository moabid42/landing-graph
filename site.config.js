// ============================================================================
// site.config.js — everything that makes this site yours.
//
// This is the only file you have to edit to put your own name on the site.
// Your timeline lives in content/timeline/*.md and your posts in
// content/blog/*.md; everything else — including the lists behind the
// Pinned, Research and Stack sections — is right here.
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
      'Software Security Engineer. Experienced in building and breaking complex' +
      ' & highload systems, currently attacking Schwarz Group ' +
      'from the inside, on purpose.',

    // The pull quote under the tagline. Explains the graph to a first-time
    // reader; rewrite it in your own voice or set it to null to hide it.
    blurb:
      'The career below is rendered the only honest way: `git log --graph ' +
      '--all`.\n' +
      'Every job, degree and project is a branch. Most of them ran ' +
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
  // header crumb and "linkedin" is the Follow button. Add, remove or reorder
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
    href: 'https://github.com/moabid42/decnique',
    visibility: 'Public',
  },
  {
    title: 'mals3scan',
    text: 'Serverless AWS security pipeline that scans every file uploaded to S3 with YARA rules for malware and sensitive data, firing real-time alerts for incident response.',
    topics: ['aws', 'lambda', 'yara', 'terraform'],
    href: 'https://github.com/moabid42/mals3scan',
    visibility: 'Public',
  },
  {
    title: 'l3ak-ctf-infra',
    text: 'Architecture and operations for a high-traffic yearly CTF: 15,000+ concurrent users and millions of requests inside the opening hour.',
    topics: ['high-load', 'GCP', 'monitoring', 'distributed systems'],
    href: null,
    visibility: 'Internal',
  },
  {
    title: 'redteam-copilot',
    text: 'Developed a cloud red teaming copilot at Schwarz Digits, OPSEC safe and deterministic detection aware',
    topics: ['llm', 'red-team', 'automation'],
    href: null,
    visibility: 'Internal',
  },
  ],

  // ---------------------------------------------------------------- research
  // The Research section: one clickable box per paper, opening its
  // ResearchGate page. An empty list shows the "being indexed" panel with a
  // link to the full profile instead.
  //
  //   title   the paper title, as published
  //   tldr    the finding in a sentence or two, not the abstract
  //   topics  the pills under the tl;dr, like a repo's topics
  //   href    where the box opens — the ResearchGate publication url. The
  //           card footer is read off this url: the archive it is hosted on,
  //           and the publication number, shown like a commit sha.
  research: [
    {
      title: 'Recon as a First-Class Planning Action under Partial Observability',
      tldr: 'Attack-path planners almost all assume they already know the network. Modelling reconnaissance as a planning action with its own OPSEC cost and information gain reaches the goal in 80.3% of randomised Active Directory graphs against 52.3% for a two-phase baseline — but only once the pursuit is directed and multi-step.',
      topics: ['attack planning', 'partial observability', 'math'],
      href: 'https://www.researchgate.net/publication/405230754_Recon_as_a_First-Class_Planning_Action_under_Partial_Observability',
    },
    {
      title: 'HOP: Hook Oriented Programming',
      tldr: 'Licence checks fall to debuggers, and anti-debugging in turn falls to whatever an attacker can patch out. HOP is a Linux anti-debugging design that claims the one debugger slot a process is allowed to have, so the protection has to be evicted before a debugger can attach at all.',
      topics: ['anti-debugging', 'linux', 'reverse engineering'],
      href: 'https://www.researchgate.net/publication/396647415_HOP_-Hook_Oriented_Programming',
    },
    {
      title: 'RCPRNG: Robust Complete PRNG',
      tldr: 'Cryptographic PRNG models assume unlimited compute and clean entropy; embedded systems have neither, and there entropy accumulation and generation share the same scarce resources. RCPRNG folds both into one security model whose completeness property carries guarantees across arbitrary state transitions, and shows the Gaži-Tessaro sponge construction satisfies it.',
      topics: ['cryptography', 'prng', 'IoT'],
      href: 'https://www.researchgate.net/publication/396647163_RCPRNG_-_Robust_Complete_Pseudo_Random_Number_Generator',
    },
    // {
    //   title: 'Paper title, as published',
    //   tldr: 'What it found, in a sentence or two.',
    //   topics: ['topic', 'topic'],
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
      'red teaming · detection engineering · cloud security · threat modeling · code review · rev ·  pwn · crypto',
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
