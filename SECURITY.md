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

## Reporting

Open a private security advisory through GitHub:
<https://github.com/moabid42/landing-graph/security/advisories/new>

Please do not open a public issue for something exploitable. Expect a first
reply within a week — this is a side project, not a staffed product.
