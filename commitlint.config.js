// Conventional commits, with the types this repo actually uses.
//
//   type: one line, lower case, no full stop
//
// e.g.  feat: declare tracks in site.config.js and glob their markdown files
//       content: give placeholder entries distinct topic labels
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // a new capability
        'fix', // a bug fix
        'content', // markdown under content/ — entries, tags, posts
        'style', // formatting or visual polish, no behaviour change
        'refactor', // restructuring with no behaviour change
        'perf', // a speed or size win
        'test', // tests only
        'docs', // README and comments
        'build', // dependencies, bundler, tooling config
        'ci', // workflows and automation
        'chore', // housekeeping that fits nowhere else
        'revert', // undo a previous commit
      ],
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 90],
    'body-max-line-length': [0],
  },
}
