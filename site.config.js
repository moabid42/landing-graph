// ============================================================================
// site.config.js — everything that makes this site yours.
//
// This is the only file you have to edit to put your own name on the site.
// Your timeline lives in content/*.md, your posts in content/blog/*.md, and
// the lists that fill the Pinned / Research / Stack sections are in
// src/data.js. Nothing else needs touching.
// ============================================================================

export default {
  // ---------------------------------------------------------------- identity
  identity: {
    // The header crumb reads "handle / repo", like a repository page.
    handle: 'yourhandle',
    repo: 'yoursite.dev',

    // One letter for the circular avatar next to the crumb.
    avatar: 'y',

    // The README hero.
    name: 'Your Name',
    tagline:
      'One line about what you do, who you do it for, and the thing you ' +
      'are working on right now. Keep it short — the graph below does the ' +
      'rest of the talking.',

    // The pull quote under the tagline. Explains the graph to a first-time
    // reader; rewrite it in your own voice or set it to null to hide it.
    blurb:
      'The career below is rendered the only honest way: `git log --graph ' +
      '--all`. Every job, degree and project is a branch. Most of them ran ' +
      'at the same time.',

    // The green-dot status line. Set status to null to hide the whole row.
    status: 'now · what you are doing right now',
    location: 'your city, xx',

    email: 'you@example.com',
  },

  // ------------------------------------------------------------------- links
  // Rendered as the `git remote -v` table in the Contact section, in this
  // order. Sections elsewhere look these up by name: "medium" is the Writing
  // section's link, "researchgate" is the Research section's. Add, remove or
  // reorder freely — a missing name just hides that link.
  links: [
    { name: 'origin', url: 'mailto:you@example.com', kind: 'email' },
    { name: 'github', url: 'https://github.com/yourhandle', kind: 'fetch' },
    { name: 'linkedin', url: 'https://linkedin.com/in/yourhandle', kind: 'fetch' },
    { name: 'medium', url: 'https://medium.com/@yourhandle', kind: 'fetch' },
    {
      name: 'researchgate',
      url: 'https://www.researchgate.net/profile/Your-Name',
      kind: 'fetch',
    },
  ],

  // --------------------------------------------------------------------- seo
  // Applied to the document at runtime. index.html carries the same values
  // as a static fallback for crawlers that do not run scripts.
  seo: {
    description:
      'Your Name — what you do. Career rendered as git log --graph --all: ' +
      'every job, degree and project as a branch.',
    themeColor: '#0d1117',
  },

  // ------------------------------------------------------------------ footer
  footer: {
    // {year} is replaced with the current year.
    text: '© {year} Your Name · your city',
    note: 'rendered from `git log --graph --all`',
  },
}
