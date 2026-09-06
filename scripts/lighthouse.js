#!/usr/bin/env node
// Runs the Lighthouse budgets locally, on demand.
//
// @lhci/cli is deliberately NOT a dependency of this repo. It pulls in
// Lighthouse and puppeteer — 72 packages, one of which (extract-zip, behind
// puppeteer's browser installer) carries an advisory with no published fix.
// CI runs the budgets through treosh/lighthouse-ci-action instead, so the
// lockfile stays clean and `npm audit` stays meaningful.
//
// That would leave no way to check a performance change without pushing, so
// this script fetches the same lhci the action uses, at run time. First run
// downloads it; npx caches it after that.
//
// lhci also wants a system Chrome, which a laptop has at an unpredictable
// path. Playwright already installed a pinned Chromium for the e2e suite —
// point lhci at that one instead of installing a second browser.
import { spawnSync } from 'node:child_process'
import { chromium } from '@playwright/test'

// Matches the Lighthouse the action ships, so a local pass means a CI pass.
const LHCI = '@lhci/cli@0.15'

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

console.log(
  `Fetching ${LHCI} (not a dependency — cached by npx after the first run)…`
)

// --config is explicit: lhci's own discovery would also match a stray
// lighthouserc.js and load it with the wrong module semantics.
const result = spawnSync(
  'npx',
  [
    '--yes',
    LHCI,
    'autorun',
    '--config=lighthouserc.cjs',
    ...process.argv.slice(2),
  ],
  {
    stdio: 'inherit',
    env: { ...process.env, CHROME_PATH: chromePath },
  }
)

process.exit(result.status ?? 1)
