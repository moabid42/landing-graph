#!/usr/bin/env node
// Guards what the browser downloads before it can paint.
//
// dist/ is several megabytes, and that is fine: almost all of it is mermaid,
// split into chunks that load only when a post actually contains a diagram.
// The number that matters is the entry payload — the script tag in
// index.html plus everything it preloads. One accidental static `import
// 'mermaid'` turns a 60 kB first load into a 3 MB one, the build still
// succeeds, and nothing else would notice.
import { gzipSync } from 'node:zlib'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'

const DIST = 'dist'

// Raw bytes are what the parser chews through; gzip is what the wire costs.
// Both matter, so both have a ceiling.
const BUDGET = { raw: 320 * 1024, gzip: 100 * 1024 }

// Chunks that must never be reachable before first paint.
const MUST_BE_LAZY = [/mermaid/i, /katex/i, /cytoscape/i]

const kb = (n) => (n / 1024).toFixed(1) + ' kB'

function fail(msg) {
  console.error(`\n✖ ${msg}\n`)
  process.exit(1)
}

if (!existsSync(join(DIST, 'index.html'))) {
  fail(`no ${DIST}/index.html — run \`npm run build\` first`)
}

const html = readFileSync(join(DIST, 'index.html'), 'utf8')

// Entry script plus any modulepreload: everything fetched before first paint.
const eager = [
  ...[...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map((m) => m[1]),
  ...[
    ...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g),
  ].map((m) => m[1]),
].map((href) => href.replace(/^\.?\//, ''))

if (eager.length === 0) fail('found no entry script in index.html')

let raw = 0
let gzip = 0
const rows = []
for (const file of eager) {
  const path = join(DIST, file)
  if (!existsSync(path)) fail(`index.html references ${file}, which is missing`)
  const buf = readFileSync(path)
  raw += buf.length
  gzip += gzipSync(buf).length
  rows.push([file, buf.length])

  for (const pattern of MUST_BE_LAZY) {
    if (pattern.test(file)) {
      fail(
        `${file} is loaded before first paint but must be lazy.\n` +
          `  Something now imports it statically — use a dynamic import().`
      )
    }
  }
}

// A lazy chunk that is never referenced is dead weight in the deploy.
const dir = dirname(join(DIST, eager[0]))
console.log(
  `\nEntry payload (${eager.length} file${eager.length > 1 ? 's' : ''} from ${dir}/):`
)
for (const [file, size] of rows.sort((a, b) => b[1] - a[1])) {
  console.log(`  ${kb(size).padStart(10)}  ${file}`)
}
console.log(`\n  raw   ${kb(raw).padStart(10)}  / budget ${kb(BUDGET.raw)}`)
console.log(`  gzip  ${kb(gzip).padStart(10)}  / budget ${kb(BUDGET.gzip)}`)

const over = []
if (raw > BUDGET.raw) over.push(`raw ${kb(raw)} > ${kb(BUDGET.raw)}`)
if (gzip > BUDGET.gzip) over.push(`gzip ${kb(gzip)} > ${kb(BUDGET.gzip)}`)

if (over.length) {
  fail(
    `entry payload over budget: ${over.join(', ')}.\n` +
      `  Either make the new code lazy, or raise BUDGET in scripts/check-bundle.js\n` +
      `  deliberately, in a commit that says why.`
  )
}

console.log('\n✓ entry payload within budget\n')
