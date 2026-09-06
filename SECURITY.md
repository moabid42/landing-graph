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

```sh
npm run audit        # npm audit, no flags, no exceptions
```

Clean, and CI fails if it stops being clean. There is no allowlist and no
`--omit=dev` carve-out, which is the point: an audit with exceptions is one
nobody reads.

Keeping it that way cost one architectural decision. Lighthouse is not a
dependency of this repo. `@lhci/cli` pulls in Lighthouse and puppeteer — 276
packages — and one of them, `extract-zip`, has an advisory with **no
published fix**: `2.0.1` is the newest release and the advisory covers
`<=2.0.1`. Nothing can override it. `npm audit fix --force` "resolves" it by
installing `@lhci/cli@0.6.1`, nine minor versions back, which breaks the
budgets outright.

So the budgets run out-of-tree instead, through
`treosh/lighthouse-ci-action` in [`ci.yml`](.github/workflows/ci.yml). Same
`lighthouserc.cjs`, same Lighthouse 12.6, none of it in the lockfile.
`scripts/lighthouse.js` still runs it locally by fetching lhci with `npx` at
run time, so a performance change can be checked without pushing.

## Reporting

Open a private security advisory through GitHub:
<https://github.com/moabid42/landing-graph/security/advisories/new>

Please do not open a public issue for something exploitable. Expect a first
reply within a week — this is a side project, not a staffed product.
