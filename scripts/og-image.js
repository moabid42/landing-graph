#!/usr/bin/env node
// Renders public/og.png — the picture shown when a link to the site is posted
// to LinkedIn, X or Slack.
//
// Two things decide the shape of this script. Share-card crawlers do not
// render SVG, so the card has to be a raster file committed to the repo. And
// a template must not ship one person's name as everyone's share card, so the
// card is drawn from public/favicon-default.svg and site.config.js: fork it,
// run `npm run og`, and the card is yours.
//
// Chromium comes from Playwright, which is already installed for the e2e
// suite — no new dependency. This runs on demand rather than during the
// build, so `npm run build` still needs nothing but Node.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { chromium } from '@playwright/test'
import config from '../site.config.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(root, 'public/og.png')

// 1200x630 is the size every platform crops safely.
const W = 1200
const H = 630

const { identity } = config

// The site's own dark palette, so the card matches the page it opens.
const BG = config.seo.themeColor || '#0d1117'
const FG = '#e6edf3'
const MUTED = '#7d8590'
const ACCENT = config.tracks[0]?.color || '#3fb950'

const esc = (s) =>
  String(s).replace(
    /[&<>]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]
  )

// The same mark as the favicon. Its own stylesheet is written for
// prefers-color-scheme, and the page below is rendered with dark emulation
// on, so it resolves to the dark variant without being edited here.
const mark = readFileSync(join(root, 'public/favicon-default.svg'), 'utf8')

const html = `<!doctype html>
<meta charset="utf-8">
<style>
  * { margin: 0; box-sizing: border-box; }
  body {
    width: ${W}px; height: ${H}px; background: ${BG}; color: ${FG};
    display: flex; align-items: center; gap: 72px; padding: 0 96px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .mark { width: 260px; height: 260px; flex: none; }
  .mark svg { width: 100%; height: 100%; display: block; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  .crumb { font-size: 30px; color: ${MUTED}; letter-spacing: .01em; }
  .name { font-size: 78px; font-weight: 700; letter-spacing: -.02em; margin: 14px 0 22px; }
  .cmd { font-size: 31px; color: ${ACCENT}; }
</style>
<div class="mark">${mark}</div>
<div>
  <div class="crumb mono">${esc(identity.handle)} / ${esc(identity.repo)}</div>
  <div class="name">${esc(identity.name)}</div>
  <div class="cmd mono">git log --graph --all</div>
</div>`

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
  colorScheme: 'dark',
})
await page.setContent(html)
// Web fonts are not used, but the mark is inline SVG with a stylesheet.
await page.waitForLoadState('networkidle')
writeFileSync(OUT, await page.screenshot({ type: 'png' }))
await browser.close()

console.log(
  `✓ public/og.png — ${W}x${H}, ${identity.handle} / ${identity.repo}`
)
