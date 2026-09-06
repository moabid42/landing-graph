# landing-graph

A personal site template that renders your career as a git graph.

One trunk. Every job, degree, project and startup is a branch that forks
out and merges back. Milestones are tagged commits. Everything still
running merges into `HEAD → now`. Desktop gets a proportional two-sided
graph; mobile gets an ordinal `git log --graph` flow.

Content is markdown files in git. There is no CMS, no database, and no
admin UI — that is the feature.

## Quickstart

```sh
git clone https://github.com/yourhandle/landing-graph.git
cd landing-graph
npm install
npm run dev
```

Then, in order:

1. **`site.config.js`** — your name, handle, hero copy, links, footer.
2. **`src/data.js`** — pinned repos, research, languages, stack.
3. **`content/*.md`** — your timeline, one file per track.
4. **`content/blog/*.md`** — your posts (delete `hello-world.md`).
5. **`public/favicon.svg`** — swap the graph mark for your own.

That is the whole setup. When this grep comes back empty, you are done:

```sh
grep -rniE "yourhandle|your name|yoursite|example\.com" \
  site.config.js src/ content/ index.html
```

Everything that identifies you lives in `site.config.js`. Deleting a link
from `links[]` removes it from the Contact table and from whichever section
used it — drop `researchgate` and the Research section stops linking out.

## Editing the timeline

One markdown file per track:

```
content/timeline/work.md        content/timeline/startups.md
content/timeline/education.md   content/timeline/speaking.md
content/timeline/projects.md    content/tags.md   (milestones on the trunk)
```

Each entry is a `## Title` block with `- key: value` fields and a
description paragraph:

```markdown
## Cloud security engineer

- org: Company · City
- start: 2023-03
- end: 2023-08
- topics: aws, lambda, terraform
- time: full-time
- link: https://example.com

What you did, and what changed because you did it.
```

| Field                    | Meaning                                                          |
| ------------------------ | ---------------------------------------------------------------- |
| `start` / `end`          | a range. `end: now` stays open and merges into HEAD.             |
| `end: YYYY-MM (dropped)` | closed without merging — a chapter you left.                     |
| `date`                   | a single moment (a talk, a competition). Replaces `start`/`end`. |
| `topics`                 | comma-separated labels shown under the title.                    |
| `time`                   | `part-time` or `full-time` — an optional colored chip.           |
| `link`                   | optional "Learn more" button.                                    |

Add a block to add an entry, delete one to remove it. Order does not
matter — the graph sorts by date and assigns branch lanes automatically.
A range shorter than a month renders as a single-date arc.

Typos are not silent: an unparseable date or a missing field shows up in a
warning banner above the graph, naming the file and the entry.

## Tracks

Each file in `content/timeline/` is a track, declared in `site.config.js`:

```js
tracks: [
  { key: 'work', label: 'work', color: '#3fb950', colorLight: '#1a7f37' },
  {
    key: 'speaking',
    label: 'speaking',
    color: '#db61a2',
    colorLight: '#bf3989',
    continuous: true,
  },
]
```

The `key` is the filename: `key: 'work'` reads `content/timeline/work.md`.
Adding a track is one entry here plus one markdown file. Removing one is
deleting both. Rename a track by renaming both together.

A `continuous` track rides one shared branch that forks at its first entry
and stays open, with each entry a commit on it — good for recurring
activity like talks or teaching. Everything else gets a branch per entry.

Mistakes are loud: a track with no file, or a file with no track, shows up
in the warning banner above the graph naming the file.

Colors are published as CSS variables from the config, so `src/styles.css`
names no track at all — a new track needs no stylesheet edit. `colorLight`
is optional and falls back to `color`.

## Deploying

```sh
npm run build     # -> dist/
```

`vite.config.js` sets `base: './'`, so the build works from a subpath —
GitHub Pages project sites included. Point Netlify, Vercel or Pages at
`dist/` and you are done.

## Search engines and share cards

`seo.url` in `site.config.js` is the origin the site is served from. It drives
the canonical url on every route, the `og:url`, and a `sitemap.xml` +
`robots.txt` generated at build time. `seo.image` is the picture shown when
someone posts a link — put a 1200x630 png in `public/` and point at it.

Each blog post overrides the title and description with its own, so a shared
post link reads as that post rather than as the site.

## Development

```sh
npm install          # also installs the git hooks
npm run dev          # vite dev server
npm run build        # production bundle into dist/
```

### Checks

| command                 | what it does                                      |
| ----------------------- | ------------------------------------------------- |
| `npm run lint`          | eslint over `src/`, config and tests              |
| `npm run format`        | prettier over everything not in `.prettierignore` |
| `npm run format:check`  | the same check CI runs                            |
| `npm test`              | vitest, the parsing and config suite              |
| `npm run test:coverage` | the same, with an 85% threshold                   |
| `npm run e2e`           | playwright against the built site                 |
| `npm run e2e:ui`        | playwright in watch mode, with a browser          |
| `npm run size`          | entry payload against its budget (after a build)  |
| `npm run lighthouse`    | lighthouse budgets against `dist/`                |

Unit tests cover the layer that turns markdown and `site.config.js` into the
shapes the page renders — dates, entry fields, branch lanes, blog
frontmatter. They also act as a content lint: a typo in `content/` fails
`npm test` instead of quietly dropping an entry.

End-to-end tests drive the real bundle in Chromium at desktop and mobile
widths, covering the graph, the track filter, the theme toggle and the hash
router.

### Hooks

`npm install` sets up two hooks via husky:

- **pre-commit** — `lint-staged` (eslint + prettier on staged files) then the
  unit suite.
- **commit-msg** — [commitlint](commitlint.config.js). Messages are
  conventional and one line: `type: lower case summary, no full stop`.
  Allowed types include `content` for markdown edits alongside the usual
  `feat`, `fix`, `style`, `refactor`, `test`, `docs`, `build`, `ci`, `chore`.

To commit without them once: `git commit --no-verify`.

### CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push to
`main` and every pull request: lint and formatting, unit tests with coverage,
a production build, the entry-payload budget, the end-to-end suite, Lighthouse
budgets, and commitlint over the commits in the pull request.

The entry-payload budget in [`scripts/check-bundle.js`](scripts/check-bundle.js)
is the one worth knowing about. `dist/` is a few megabytes, almost all of it
mermaid, split into chunks that load only when a post actually contains a
diagram. The budget covers what the browser fetches before first paint
(~60 kB gzipped), so turning one dynamic import into a static one fails the
build instead of quietly shipping 3 MB.

## Using it as a submodule

If you would rather keep your content in its own private repo and pull the
template in:

```sh
git submodule add https://github.com/yourhandle/landing-graph.git
git submodule update --remote landing-graph    # pull template updates
```

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md) covers the setup, the commit convention and
the few things worth knowing before changing the timeline. Security issues go
through a [private advisory](SECURITY.md), not a public issue.

## License

MIT — see [LICENSE](LICENSE).
