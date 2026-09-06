#!/usr/bin/env node
// Runs Lighthouse against the built site.
//
// lhci looks for a system Chrome, which a CI runner does not reliably have
// and a laptop has at an unpredictable path. Playwright already downloads a
// pinned Chromium for the e2e suite, so point lhci at that one: same browser
// locally and in CI, and one thing to install instead of two.
import { spawnSync } from 'node:child_process'
import { chromium } from '@playwright/test'

let chromePath
try {
  chromePath = chromium.executablePath()
} catch (err) {
  console.error(
    'Could not find the Playwright browser.\n' +
      'Run `npx playwright install chromium` first.\n' +
      String(err.message)
  )
  process.exit(1)
}

// --config is explicit: lhci's own discovery would also match a stray
// lighthouserc.js and load it with the wrong module semantics.
const result = spawnSync(
  'npx',
  ['lhci', 'autorun', '--config=lighthouserc.cjs', ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    env: { ...process.env, CHROME_PATH: chromePath },
  }
)

process.exit(result.status ?? 1)
