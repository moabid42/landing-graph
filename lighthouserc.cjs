// Lighthouse budgets, run against the built site.
//
// CommonJS on purpose: lhci loads its config with require(), so an ESM
// export lands as { default: ... } and is silently ignored — every
// assertion below would fall back to lhci's own defaults.
//
// The thresholds are floors, not targets: they exist to catch a regression,
// so they sit a little under where the site actually scores. Raise them when
// the site improves; do not lower them to turn a red build green.
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      // The hash router means there is one document; #/blog/... is the same
      // html, so there is nothing extra to collect.
      url: ['http://localhost/index.html'],
      numberOfRuns: 3,
      settings: { preset: 'desktop', chromeFlags: '--no-sandbox' },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],

        // Named separately so a regression says what broke, rather than
        // only moving a rolled-up score by a few points.
        'total-byte-weight': ['error', { maxNumericValue: 700000 }],
        'errors-in-console': 'error',
        'dom-size': ['warn', { maxNumericValue: 2500 }],

        // One render-blocking request is the stylesheet, which is how the
        // page avoids a flash of unstyled content. Inlining it would trade
        // a real regression for a better number.
        'render-blocking-resources': 'off',
        'render-blocking-insight': 'off',
        // React ships code this page does not execute on first paint. Worth
        // watching, not worth failing a build over.
        'unused-javascript': 'warn',
        'network-dependency-tree-insight': 'off',
        'valid-source-maps': 'off',
      },
    },
    upload: { target: 'filesystem', outputDir: './.lighthouseci' },
  },
}
