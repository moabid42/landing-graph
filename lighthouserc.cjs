// Lighthouse budgets, run against the built site.
//
// CommonJS on purpose: lhci loads its config with require(), so an ESM
// export lands as { default: ... } and is silently ignored — every
// assertion below would fall back to lhci's own defaults.
//
// The thresholds are floors, not targets: they exist to catch a regression,
// so they sit a little under where the site actually scores. Raise them when
// the site improves; do not lower them to turn a red build green.
const { readFileSync } = require('node:fs')

const PORT = 4174

// The site is served under seo.url's path, not necessarily the host root, so
// lhci's own staticDistDir server cannot host it: every asset url in the
// built html is absolute and would miss. `vite preview` puts the build
// exactly where the deployed site puts it.
//
// Which pages those are lives in site.config.js and content/blog, which are
// ESM and so cannot be required from here. The sitemap the build just wrote
// says the same thing in a form this file can read: the README first, then
// section pages and posts newest first. Budget the README and the newest
// post explicitly, so adding a section cannot displace article coverage.
// Run `npm run build` first; both callers do.
const pages = () => {
  const xml = readFileSync('./dist/sitemap.xml', 'utf8')
  const paths = [...xml.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map(
    (m) => m[1]
  )
  const post = paths.find((path) => /\/blog\/[^/]+\/$/.test(path))
  return [paths[0], post]
    .filter(Boolean)
    .map((path) => `http://localhost:${PORT}${path}`)
}

// True of both routes. Only the payload budget differs, because a post
// carries its pictures and the README does not.
const shared = {
  'categories:performance': ['error', { minScore: 0.9 }],
  'categories:accessibility': ['error', { minScore: 1 }],
  'categories:best-practices': ['error', { minScore: 0.9 }],
  'categories:seo': ['error', { minScore: 0.9 }],

  'errors-in-console': 'error',
  'dom-size': ['warn', { maxNumericValue: 2500 }],

  // Every picture in a post declares its size, so nothing below it should
  // move once it lands. What is left is the post body arriving a beat after
  // its heading, which is the lazy import doing its job.
  'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],

  // One render-blocking request is the stylesheet, which is how the page
  // avoids a flash of unstyled content. Inlining it would trade a real
  // regression for a better number.
  'render-blocking-resources': 'off',
  'render-blocking-insight': 'off',
  // React ships code this page does not execute on first paint. Worth
  // watching, not worth failing a build over.
  'unused-javascript': 'warn',
  'network-dependency-tree-insight': 'off',
  'valid-source-maps': 'off',
}

module.exports = {
  ci: {
    collect: {
      startServerCommand: `npx vite preview --port ${PORT} --strictPort`,
      startServerReadyPattern: 'Local:',
      url: pages(),
      numberOfRuns: 3,
      settings: { preset: 'desktop', chromeFlags: '--no-sandbox' },
    },
    assert: {
      assertMatrix: [
        {
          matchingUrlPattern: '/blog/',
          assertions: {
            ...shared,
            // A post is mostly its pictures. This is roughly twice what the
            // heaviest one costs today — enough for an image-heavy write-up,
            // small enough to catch an unoptimised drop.
            'total-byte-weight': ['error', { maxNumericValue: 1400000 }],
          },
        },
        {
          matchingUrlPattern: '^(?!.*/blog/).*$',
          assertions: {
            ...shared,
            'total-byte-weight': ['error', { maxNumericValue: 700000 }],
          },
        },
      ],
    },
    upload: { target: 'filesystem', outputDir: './.lighthouseci' },
  },
}
