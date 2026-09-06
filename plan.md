# Plan — landing-graph roadmap

**Goal:** make this repo something anyone can fork and turn into their own
site in an afternoon, without reading the code. The timeline stays a
self-contained engine inside it, so lifting it out into any project — or
publishing it as an npm package — is a folder move, not a rewrite.

**First consumer:** the author's own site pulls this repo in as a git
submodule and supplies nothing but `site.config.js` and `content/`. If that
site ever needs a code edit to say something new, this template has a gap.

**Non-goal for now:** publishing to npm. The decoupling work below is what
a package would need anyway, so nothing here is wasted if that day comes.
See Part C.

---

## The four levels of reuse

The bar: levels 1 and 2 must need **zero code edits**.

| Level | Who | What they touch | Code edits |
| ----- | --- | --------------- | ---------- |
| 1 | most forkers | `content/**/*.md` | none |
| 2 | most of the rest | `site.config.js` | none |
| 3 | power users | fork, edit `src/site/` | yes |
| 4 | other projects | copy `src/timeline/` out | n/a |

## The one structural rule

> `src/timeline/` never imports anything from outside `src/timeline/`.

No site config, no `data.js`, no site CSS, no `?raw` imports. Content
arrives as props. That single rule is what buys level 4 and Part C, and
it's cheap to hold if enforced from Phase 4 onward.

Everything else follows the old pipeline discipline:
**parse → model → layout → render**, each step a pure function of the
previous. Nothing mutates, nothing reads globals.

## End state

```
site.config.js        ALL identity: name, bio, links, tracks, sections, theme
content/
  timeline/*.md       one file per track — globbed, not hardcoded
  tags.md             point events on the trunk
  blog/*.md           posts
src/
  timeline/           the engine — imports nothing from outside this folder
    index.js          public surface: <Timeline />, parseTimeline()
    core/             pure JS. No React, no DOM, no Vite.
      parse.js        markdown string -> { entries, problems }
      model.js        entries + track config -> branches
      layout.js       scale, sides, lanes, collision (pure)
      dates.js        {year, month} type + formatting
    Timeline.jsx      <Timeline entries branches points tracks renderCard />
    DesktopGraph.jsx  proportional two-sided graph
    MobileLog.jsx     ordinal git-log flow
    Card.jsx          default git-flavored card
    hooks/            useRevealOnce, useScrollProgress, useMeasuredHeights
    timeline.css      only structure + var() hooks. No track names.
  site/               the fork-and-edit shell
    App.jsx           reads site.config.js, renders sections in order
    sections/         Hero, Timeline, Pinned, Writing, Research, Stack, Contact
    markdown.jsx      shared md renderer (site + blog)
    icons.jsx
    theme.css         Primer tokens, light/dark
  loadContent.js      Vite glob -> strings -> timeline core
  main.jsx
```

---

# Part A — Make it forkable

This is the part that ships a template. Do it in order; each phase is one
commit and the site must render identically after each.

## Phase 1 — `site.config.js`: all identity in one file

Right now a forker has to edit three files and hunt through 507 lines of
JSX. Confirmed hardcoded personal data:

- `App.jsx` — name (`:184`), bio (`:186-189`), status + location
  (`:198-200`), avatar letter (`:115`), owner/repo crumb (`:116-121`),
  email in three places (`:203`, `:449`, `:491`), the whole remotes table
  (`:447-488`), doc title (`:103-104`), footer (`:500-503`).
- `data.js` — `MEDIUM_URL` (`:37`), `RESEARCHGATE_URL` (`:44`), pinned
  repos, languages, stack.
- `index.html` — title (`:6`), description (`:7`), theme-color.

Steps:

- [ ] New `site.config.js` at the repo root, heavily commented, holding:
      ```js
      export default {
        identity: { name, handle, repo, avatar, tagline, blurb,
                    status, location, email },
        links: [ { name: 'github', url, kind: 'fetch' }, ... ],
        seo:   { title, description, themeColor },
        footer:{ text, note },
        tracks: [ ... ],      // Phase 2
        sections: [ ... ],    // Phase 3
        theme:  { ... },      // Phase 2
      }
      ```
- [ ] The Contact remotes table renders from `links[]` — adding Mastodon
      is one array entry, not a `<tr>`.
- [ ] `<title>` and `<meta description>` come from config at runtime, so
      `index.html` carries no personal text. (A tiny Vite plugin can also
      stamp them at build time for crawlers — nice-to-have, not blocking.)
- [ ] Every `data.js` list moves under config or stays in `data.js` but is
      documented as "yours to replace", with the template comments kept.

**Done when:** `grep -rniE "yourhandle|your name|yoursite|example\.com" src/ index.html`
returns nothing but `site.config.js`. That grep is already the fork
checklist in the README — Phase 1 narrows it to one file.

## Phase 2 — Tracks from config, not from code

Adding a "music" track today means editing `content.js` twice, `App.jsx`
once, and writing six CSS rules. Track names are wired into:

- `content.js:5-10` — five hardcoded `?raw` imports
- `content.js:12-18` — the `TRACKS` object
- `content.js:22` — the separate `CONTINUOUS` set
- `content.js:196-200` — five hardcoded `parseTrack` calls
- `styles.css:16-20`, `:44-48` — `--c-<track>` vars in both themes
- `styles.css:230-234, 255-259, 361-365, 386-395, 431-435` — ~28
  per-track rules for `.swatch`, `.branch`, `.mbranch`, `.tl-node`,
  `.gh-label`

Steps:

- [ ] One config array drives everything:
      ```js
      tracks: [
        { key: 'work', label: 'work', color: '#3fb950', colorLight: '#1a7f37' },
        { key: 'speaking', label: 'speaking', color: '#db61a2',
          colorLight: '#bf3989', continuous: true },
      ]
      ```
      `continuous` replaces the `CONTINUOUS` set.
- [ ] `loadContent.js` globs `content/timeline/*.md` with
      `import.meta.glob` (the pattern `blog.js:14-18` already uses) and
      matches filename to track key. Adding a track = one config line +
      one markdown file. A file with no matching config entry, or a config
      entry with no file, becomes a `problem()` — not a silent skip.
- [ ] Colors are injected as `--tl-track-<key>` CSS variables on the
      timeline root element, from config. Track elements get
      `style={{ '--tl-c': var(--tl-track-work) }}` or equivalent; the
      ~28 `.branch.work` / `.swatch.education` / `.gh-label.projects`
      rules collapse into one rule each using `var(--tl-c)`.
- [ ] Light/dark: config carries both values; the injector picks by the
      `data-theme` attribute, same mechanism `theme.css` already uses.

**Done when:** adding a "volunteering" track — one config line, one
markdown file — renders fully colored on desktop and mobile, in both
themes, with zero CSS and zero JS edits. Write that test fork down in the
README as the proof.

## Phase 3 — Sections become data

A forker who wants to drop Research and add Photography currently edits
JSX in the middle of `App.jsx` (`:342-395`) and the tab bar (`:156-161`).
The counter `4` on the Pinned tab (`:150`) is even hardcoded.

- [ ] `sections: [{ id, label, icon, enabled }]` in config drives both the
      tab bar and the render order. `enabled: false` removes a section and
      its tab together.
- [ ] Each section moves to `src/site/sections/<Name>.jsx`, taking its data
      as props. `App.jsx` becomes a layout shell that maps over
      `sections` — target well under 150 lines.
- [ ] Fix while in there: the Pinned tab counter reads `WORK.length`, not
      the literal `4`.
- [ ] Blank-slate states (`:273-288`, `:356-372`) stay — they are what
      makes a fresh fork look finished instead of broken.
- [ ] Section order in config = order on the page. No JSX reordering.

**Done when:** deleting Research and adding a section is a config edit
plus one file, and the tab bar follows automatically.

## Phase 4 — Isolate the timeline

This is where the structural rule starts being enforced. Today
`Timeline.jsx:2` imports `BRANCHES, ENTRIES, POINTS, PROBLEMS, TRACKS`
straight from `content.js`, which parses markdown at import time — so the
engine is welded to this repo's file layout.

- [ ] Move everything to `src/timeline/`. The engine takes props:
      `<Timeline entries branches points tracks problems renderCard />`.
- [ ] `BRANCH_OF` (`Timeline.jsx:4`) moves inside the component, derived
      with `useMemo` from the `branches` prop.
- [ ] The Vite `?raw` / glob imports live only in `src/loadContent.js`.
      The parser only ever sees strings — that's what makes it portable.
- [ ] `PROBLEMS` (`content.js:31`) stops being a mutable module global
      with `console.warn` at import. Parsing returns `{ entries, problems }`
      and the caller decides. Keep the warning banner — a typo in a content
      file must stay impossible to miss, since that is the #1 thing a
      forker will do wrong.
- [ ] `renderCard` prop, with the current `Card` (`Timeline.jsx:43-96`) as
      default. "Merged / Open / Dropped", the fake sha (`:25-32`, `:47`)
      and the time chip are this site's flavor, not the engine's.
- [ ] Split `timeline.css` out of `styles.css`; `src/site/theme.css` keeps
      the Primer tokens.

**Done when:** `grep -rn "\.\./" src/timeline/` returns nothing, and
`src/timeline/core/` has no React, DOM or Vite reference at all.

## Phase 5 — Template ergonomics

The refactor is worthless as a template if nobody can tell what to edit.

- [ ] `README.md` rewritten for the forker, not for me: what it is, a
      screenshot, "Use this template", the 5-minute quickstart (edit
      config → edit markdown → deploy), the content format, the track
      config, theming, and the identity `grep` from Phase 1.
- [ ] `npm run init` — a small script that blanks `site.config.js` to
      placeholders and replaces `content/timeline/*.md` with two example
      entries each, so a fork starts from "fill in the blanks" rather
      than "read the whole config first". Keep the excellent format comment block from
      `content/work.md:1-24` at the top of every generated file.
- [ ] `LICENSE` — MIT.
- [ ] Deploy docs: GitHub Pages + Netlify/Vercel. Note the `base: './'`
      in `vite.config.js` already makes subpath hosting work.
- [ ] Enable the GitHub "template repository" setting, add topics.
- [ ] Add `.vite/` to `.gitignore` — Vite drops a stray cache dir at the
      repo root whenever `package.json` goes missing.
- [ ] "Staying in sync" section, covering both consumption modes:
      **fork** (`git remote add upstream …`, merge) and **submodule**
      (`git submodule update --remote`). Files a consumer owns
      (`site.config.js`, `content/`, `public/`) versus files that receive
      updates (everything in `src/`).
- [ ] Document the submodule layout the first consumer uses: the parent
      repo holds `site.config.js`, `content/`, `public/` and a thin
      `src/main.jsx`; this repo holds all the code and exports a mount
      point from `src/index.js`. Both must stay runnable standalone —
      `npm run dev` here shows the template with placeholder content.

**Done when:** someone who has never seen the repo forks it and has their
own site live, with their own tracks and colors, without opening a `.jsx`
file. Test this on a real person before calling it done.

### → Ship here. Part A is the template.

---

# Part B — Make the engine solid

None of this blocks the template, but forks will hit these bugs, and every
item is a prerequisite for Part C. Do them in order after shipping.

## Phase 6 — Purity: stop mutating parsed entries

`assignSides` (`content.js:156`) and `assignLanes` (`content.js:180`) are
layout concerns living in the parser, and they stamp `e.lane` / `e.branch`
onto parsed entries (`content.js:223, 232, 238`).

- [ ] `core/layout.js` owns side balancing, lane assignment, and the
      density scale currently inline in `DesktopTimeline`
      (`Timeline.jsx:465-540`).
- [ ] `core/model.js` owns branch construction — per-entry branches plus
      shared `continuous` branches (`content.js:205-239`).
- [ ] All functions return new objects. Branch and lane info lives on
      layout results keyed by entry id, never stamped onto the entry.
- [ ] One lane routine shared by both renderers. Today desktop lanes come
      from `content.js:180` and mobile re-derives its own at
      `Timeline.jsx:262-272` — same greedy interval-coloring algorithm,
      written twice. Parameterize by geometry (lane width, clearance).

**Done when:** `core/parse.js` only parses, and `grep -nE "e\.[a-z]+ =" src/timeline/`
finds no mutation of parsed entries.

## Phase 7 — One engine, two renderers

`MobileLog` (~270 lines) and `DesktopGraph` (~410 lines) are independent
implementations with duplicated plumbing. Keep both layouts — ordinal log
versus proportional graph are legitimately different products — but share
the machinery.

- [ ] `useRevealOnce(ref, deps)` — the two IntersectionObserver blocks
      (`Timeline.jsx:314` and `:658`).
- [ ] `useScrollProgress(ref, headY)` — the two scroll-fill effects
      (`:297-308` and `:623-647`).
- [ ] `useReducedMotion()` (`:36`) and `useMeasuredHeights(refs)` move to
      `hooks/`.
- [ ] `dimmed` / `shown` helpers and the filter legend become shared.
- [ ] Fix while in there: mobile branch dots use pixel-y as React keys
      (`Timeline.jsx:371` — `key={dy}`). Two dots at the same y collide
      and one vanishes. Key by entry id.

**Done when:** neither renderer contains an IntersectionObserver or a
scroll listener of its own.

## Phase 8 — Tame the measure→setState→remeasure loop

Desktop layout converges through chained state passes — `width` (`:445`)
→ `density` (`:450`) → `tops` (`:446`) — compared with `JSON.stringify`
(`:596`, `:280`). `tops` only resets on container resize (`:559`), so
late-loading fonts or images leave stale heights. This is the part most
likely to jitter on a fork with different content.

- [ ] One pipeline per measurement: render cards → measure all heights in
      one pass → run pure
      `computeLayout(entries, branches, heights, geometry)` in core →
      render positioned. One state variable, one `useMemo`, no loop.
- [ ] Re-measure on `document.fonts.ready` and on element resize, not only
      container resize.
- [ ] Drop the `JSON.stringify` equality checks once layout is pure.

**Done when:** `computeLayout` is a pure, unit-tested function and no
`useLayoutEffect` calls `setState` more than once per measurement.

## Phase 9 — Real dates in the core

Decimal years leak hacks everywhere: `end = start + 0.2` fake spans
(`content.js:103, 117`), the `< 0.1` month-range collapse (`:115`), the
`1/24` anchor epsilon (`Timeline.jsx:228`), and `fmtDate` reversing months
with rounding (`Timeline.jsx:18-22`).

- [ ] `core/dates.js`: entries carry `{ year, month }`, month optional →
      mid-year, matching today's behavior. Day precision stays possible
      later without an API break.
- [ ] Conversion to a continuous number happens **only** inside the scale
      in `layout.js`. Nothing else does date arithmetic.
- [ ] `single` entries get `kind: 'moment'` instead of a synthetic `+0.2`
      end; the renderer decides arc length.
- [ ] `formatDate` becomes an option so forks can localize — `MM/YYYY` is
      not universal, and this is a template.

**Done when:** `grep -rnE "\+ 0\.2|1 / 24" src/timeline/` comes back empty.

## Phase 10 — Tests and lint

- [ ] `vitest` + `eslint` (there's an `eslint-disable` comment in the tree
      but no eslint installed).
- [ ] Unit tests for the pure core:
      - parser: field parsing, `date` vs `start`/`end`, `(dropped)`, every
        `problem()` path, the tolerated missing colon (`content.js:71`);
      - model: continuous branches, sorting;
      - layout: lane reuse with clearance, side balancing, scale
        round-trip (`invY(y(d)) ≈ d`), collision push-down;
      - dates: parse/format round-trip.
- [ ] A fixture fork under `test/fixtures/` with different tracks — this
      is the regression test for the whole template promise.
- [ ] CI: lint + test + build on push.

---

# Part C — Publish the package (only on demand)

Do not start this until someone actually asks. After Parts A and B the
work left is packaging, not engineering:

- [ ] Move `src/timeline/` to `packages/timeline/`, add its `package.json`
      (ESM, `react` as a peer dependency), keep the site as the first
      consumer via a workspace.
- [ ] Package README: markdown format, track config, `renderCard`, theming
      variables.
- [ ] Versioning, changelog, npm publish from CI on tag.

**Done when:** `npm create vite` + `npm i <pkg>` + ~20 lines reproduces
this timeline with different content.

---

## Order and effort

Part A is the whole point and is mostly mechanical — Phases 1–3 are pure
extraction, Phase 4 is a move plus prop threading. Ship after Phase 5.

Part B is real engineering. Phase 8 is the only structurally risky item;
it comes after 6 and 7 so the layout code is already isolated and
testable. Phases 9 and 10 can interleave.

Part C is a weekend of packaging whenever it's worth it.

## Non-goals

- **Virtualization** — eager render is fine into the hundreds of entries.
  Revisit only if a real fork hits it.
- **One layout for mobile and desktop** — ordinal log and proportional
  graph are different products and stay separate renderers.
- **SSR** — keep the `typeof window` guard; proper SSR is post-1.0.
- **A theme system** — forks get CSS variables and the light/dark pair,
  not a plugin architecture. Level 3 is "fork and edit the CSS", and that
  is a fine answer.
- **A CMS or admin UI** — the content format is markdown files in git.
  That is the feature, not a limitation.
