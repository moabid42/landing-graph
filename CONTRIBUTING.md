# Contributing

Thanks for looking. This is a personal-site template, so the bar for changes
is a little unusual: a feature is worth adding if it helps someone put _their_
career on the page, not if it makes this particular copy nicer.

## Getting set up

```sh
npm install                        # also installs the git hooks
npx playwright install chromium    # for the end-to-end suite
npm run dev
```

Node is pinned in [`.nvmrc`](.nvmrc). If `npm install` warns about your
version, that is `engines` doing its job — some of the tooling genuinely does
not run on older releases.

## Before you open a pull request

```sh
npm run lint
npm run format
npm test
npm run e2e
```

CI runs all of these plus a production build, the entry-payload budget and
Lighthouse. The pre-commit hook runs the fast half for you.

## Commits

One line, conventional, lower case, no full stop:

```
feat: declare tracks in site.config.js and glob their markdown files
fix: park HEAD below the last card instead of on today's date
content: give placeholder entries distinct topic labels
```

The allowed types are in [`commitlint.config.js`](commitlint.config.js). The
`commit-msg` hook checks this, and so does CI over every commit in a pull
request. Keep commits atomic — one idea each, so a bad one can be reverted
without taking three good ones with it.

## What to know before changing things

**Content is not code.** Everything under `content/` is data, and the entry
parser is whitespace-sensitive. It is excluded from Prettier on purpose.

**`site.config.js` is the whole customisation surface.** If a fork has to edit
a file under `src/` to put their own name on the site, that is a bug. New
options belong in the config with a comment explaining them, and a test in
`tests/unit/config.test.js` so a typo fails the build.

**The timeline is measured, not calculated.** `src/timeline/` renders, then
measures card heights, then feeds those back as state to size each month. It
looks like a render loop and is not — see the comment in `eslint.config.js`
about the two React Compiler rules that are switched off for it.

**Layout maths goes in a pure module.** `src/timeline/scale.js` and
`src/seo/meta.js` are pure so they can be tested without a browser. If you add
geometry, put the arithmetic somewhere a unit test can reach it. Both shipped
layout bugs in this repo lived in code that only a browser could exercise.

**Adding a dependency needs a reason.** The site ships ~60 kB gzipped before
first paint and `npm run size` fails the build if that grows. Anything large
belongs behind a dynamic `import()`, the way mermaid is.

## Reporting a bug

Say what you expected, what happened, and what is in `content/` and
`site.config.js` that triggers it — most bugs here are shaped by particular
dates or a particular number of overlapping entries.
