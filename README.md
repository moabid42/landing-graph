# landing-graph

A personal site that renders a career as a git graph. This is the template
I use for my own site, and you are welcome to fork it and put your own data
in.

One trunk. Every job, degree, project and startup is a branch that forks
out and merges back. Milestones are tagged commits. Everything still
running merges into `HEAD → now`. Desktop gets a proportional two-sided
graph; mobile gets an ordinal `git log --graph` flow.

Content is markdown files in git. There is no CMS, no database, and no
admin UI — that is the feature.

The timeline in `content/`, the posts in `content/blog/` and the identity in
`site.config.js` are mine — this repo is the running site, not a demo with
placeholder text. That is deliberate: everything that makes it _mine_ is
data, so replacing that data makes it yours. No code changes, no build
flags, no fields left behind in a component somewhere.

## Quickstart

```sh
git clone https://github.com/moabid42/landing-graph.git
cd landing-graph
npm install
npm run dev
```

Then, in order:

1. **`site.config.js`** — your name, handle, hero copy, links, pinned repos,
   research, stack, footer.
2. **`content/timeline/*.md`** — your timeline, one file per track.
3. **`content/blog/*.md`** — your posts, one file each; the filename is the url.
4. **`public/favicon-default.svg`** — swap the graph mark for your own; it
   is the icon `index.html` points at, and what `npm run og` draws the share
   card from.

That is the whole setup. What you are replacing is my data, so the check is
that none of it survives — when this grep comes back empty, the site is
yours:

```sh
grep -rniE "moabid|mouad" site.config.js content/ index.html
```

Then `npm run og` to regenerate the share card with your name on it.

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

Point Netlify, Vercel or Pages at `dist/`.

Routes are real paths — `/blog/<slug>/` — so the build has to know where the
site is served from. It reads that off `seo.url` in `site.config.js`: a
custom domain makes the base `/`, a project url (`you.github.io/repo`) makes
it `/repo/`. That one line is the whole configuration; set it before you
deploy. The build writes `blog/<slug>/index.html` for every post and a
`404.html` for everything else, so each post is a url a host answers with
`200` and its own `<title>`, and old `#/blog/<slug>` links still land on the
post.

### GitHub Pages

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) does it for
you. Two things to do first:

1. **Settings → Pages → Source → GitHub Actions.** This one is unavoidable:
   until the repo has a Pages site, the publish step fails with a bare
   `404 ... Ensure GitHub Pages has been enabled`. The workflow cannot do it
   for you — `actions/configure-pages` can create the site, but its
   `enablement` input needs a personal access token, and `GITHUB_TOKEN` is
   explicitly not allowed to.
2. Set `seo.url` in `site.config.js` to where the site will live —
   `https://you.github.io/repo` for a project site. That is what canonical
   urls, `og:url` and `sitemap.xml` are built from, so a stale value is worse
   than an empty one.

Then push to `main`, or run the workflow by hand from the Actions tab.

The workflow lints, runs both test suites, builds, checks the entry-payload
budget, and only then packages `dist/` and publishes it. It repeats the
checks that `ci.yml` already runs on `main` on purpose: a deploy gated on a
_separate_ workflow having passed is a deploy that can publish an unchecked
commit. If you would rather save the minutes, drop the verification steps
from `deploy.yml` and let CI be the gate.

The packaged artifact is attached to every run, so you can also download it
from the run summary and deploy it somewhere else by hand.

Using a custom domain? Put a `CNAME` file in `public/` — Vite copies it into
`dist/` — or set the domain in Settings → Pages. If you ever switch Pages
back to the older "deploy from a branch" mode, add an empty `.nojekyll` to
`public/` as well; the Actions path here does not run Jekyll, so it is not
needed today.

## Search engines and share cards

`seo.url` in `site.config.js` is where the site is served from. It drives the
base path, the canonical url on every route, the `og:url`, the schema.org
block, and a `sitemap.xml`, `robots.txt` and `feed.xml` generated at build
time. The feed is announced in the head of every page, so pasting the site
url into a reader finds it.
`seo.image` is the picture shown when someone posts a link — put a 1200x630
png in `public/` and point at it.

There is no second copy of any of that to keep in step: `index.html` carries
a `<!--seo-->` placeholder, and `plugins/prerender.js` fills it from
`site.config.js` at build time — then writes one small html file per post
with the same block swapped for that post's own title, description, canonical
url, share card and `BlogPosting` schema. A crawler or a link unfurler gets
the right answer from the html itself, without running a line of javascript.

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
| `npm run lighthouse`    | lighthouse budgets (fetches lhci via `npx`)       |
| `npm run audit`         | `npm audit` — CI fails on any advisory            |
| `npm run og`            | redraw `public/og.png` from the mark and config   |

Unit tests cover the layer that turns markdown and `site.config.js` into the
shapes the page renders — dates, entry fields, branch lanes, blog
frontmatter. They also act as a content lint: a typo in `content/` fails
`npm test` instead of quietly dropping an entry.

End-to-end tests drive the real bundle in Chromium at desktop and mobile
widths, covering the graph, the track filter, the theme toggle, the router
and the head each route serves.

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
a production build, the entry-payload budget, `npm audit`, the end-to-end
suite, Lighthouse budgets, and commitlint over the commits in the pull
request.

Lighthouse is the one check that is not an npm dependency. `@lhci/cli` brings
276 packages with it, including one advisory that has no published fix, so
the budgets run through `treosh/lighthouse-ci-action` instead — same
`lighthouserc.cjs`, same Lighthouse, nothing in the lockfile. `npm run
lighthouse` still works locally; it fetches lhci with `npx` on demand. See
[SECURITY.md](SECURITY.md).

The entry-payload budget in [`scripts/check-bundle.js`](scripts/check-bundle.js)
is the one worth knowing about. `dist/` is a few megabytes, almost all of it
mermaid, split into chunks that load only when a post actually contains a
diagram. The budget covers what the browser fetches before first paint
(~65 kB gzipped), so turning one dynamic import into a static one fails the
build instead of quietly shipping 3 MB.

Blog posts are split the same way, which is why writing more of them does not
slow the site down. [`plugins/blogMeta.js`](plugins/blogMeta.js) turns each
post into two imports: `?meta` is its frontmatter, eager and tiny, and it is
what the Writing list renders from; the body is a dynamic `import()` that runs
when someone opens the post. Nine posts of prose are about 40 kB gzipped — an
eager glob puts all of it in front of every visitor, including the ones who
only came for the graph.

## Using it as a submodule

If you would rather keep your content in its own private repo and pull this
repo in as the engine:

```sh
git submodule add https://github.com/moabid42/landing-graph.git
git submodule update --remote landing-graph    # pull template updates
```

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md) covers the setup, the commit convention and
the few things worth knowing before changing the timeline. Security issues go
through a [private advisory](SECURITY.md), not a public issue.

## License

MIT — see [LICENSE](LICENSE).
