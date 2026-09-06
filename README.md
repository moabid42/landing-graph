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

| Field | Meaning |
| ----- | ------- |
| `start` / `end` | a range. `end: now` stays open and merges into HEAD. |
| `end: YYYY-MM (dropped)` | closed without merging — a chapter you left. |
| `date` | a single moment (a talk, a competition). Replaces `start`/`end`. |
| `topics` | comma-separated labels shown under the title. |
| `time` | `part-time` or `full-time` — an optional colored chip. |
| `link` | optional "Learn more" button. |

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
  { key: 'speaking', label: 'speaking', color: '#db61a2',
    colorLight: '#bf3989', continuous: true },
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

> Track colors are still the `--c-<track>` variables in `src/styles.css`.
> Wiring `color` / `colorLight` above straight through is the second half
> of Phase 2 in [plan.md](plan.md).

## Deploying

```sh
npm run build     # -> dist/
```

`vite.config.js` sets `base: './'`, so the build works from a subpath —
GitHub Pages project sites included. Point Netlify, Vercel or Pages at
`dist/` and you are done.

## Using it as a submodule

If you would rather keep your content in its own private repo and pull the
template in:

```sh
git submodule add https://github.com/yourhandle/landing-graph.git
git submodule update --remote landing-graph    # pull template updates
```

## Roadmap

[plan.md](plan.md) is the live plan: config-driven identity, tracks and
sections, then an isolated timeline engine that can be lifted out into any
project.

## License

MIT — see [LICENSE](LICENSE).
