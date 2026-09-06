# Security

## Scope

This is a static site — mine, and the template it is built on. It has no
server, no database, no accounts and no user input — it renders markdown you wrote into HTML you host. That
rules out most of what usually goes wrong.

What is worth reporting:

- A way to get script execution out of `content/` markdown or
  `site.config.js`. Mermaid runs at `securityLevel: 'strict'` and the
  renderer builds React elements rather than setting `innerHTML`, with the
  single exception of mermaid's own generated SVG.
- A dependency in `package-lock.json` with a known advisory that reaches the
  browser bundle. Note that almost everything in `devDependencies` does not.
- Anything in the build that could write outside `dist/`.

Not in scope: content you wrote yourself rendering as you wrote it, and
anything requiring commit access to the repository.

## Dependency advisories

`npm audit` reports a number that looks alarming and mostly is not. The check
that matters is the one CI gates on:

```sh
npm run audit        # npm audit --omit=dev
```

That covers what a visitor downloads — React, mermaid and the bundle Vite
builds — and it is currently clean. Everything `npm audit` reports without
`--omit=dev` is build-time tooling that never reaches a browser.

Of that tooling, `qs`, `tmp` and `uuid` were fixable without downgrading
anything and are pinned forward in the `overrides` block of `package.json`,
scoped under `@lhci/cli` so the override cannot drag an unrelated package
backwards.

One remains, counted several times because five packages depend on it:
`extract-zip`, reached through `@lhci/cli` → `lighthouse` → `puppeteer-core`
→ `@puppeteer/browsers`. It has no fix. `2.0.1` is the latest published
version and the advisory covers `<=2.0.1`, so no override can resolve it.
`npm audit fix --force` "fixes" it by installing `@lhci/cli@0.6.1` — nine
minor versions back — which breaks `npm run lighthouse` outright. That trade
is not worth making for a dev dependency.

It is also not reachable here. `extract-zip` is used when
`@puppeteer/browsers` unpacks a browser it downloaded, and nothing downloads
a browser in this repo: `puppeteer-core` does not fetch browsers (that is
what separates it from `puppeteer`), and `scripts/lighthouse.js` points
`CHROME_PATH` at the Chromium Playwright already installed.

## Reporting

Open a private security advisory through GitHub:
<https://github.com/moabid42/landing-graph/security/advisories/new>

Please do not open a public issue for something exploitable. Expect a first
reply within a week — this is a side project, not a staffed product.
