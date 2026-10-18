import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'vite'
import { expect, it } from 'vitest'
import seoFiles from '../../plugins/seoFiles.js'
import { BASE, absolute, feedPath, postPath } from '../../src/paths.js'

it('serves a live RSS feed in dev instead of falling back to the app HTML', async () => {
  const root = mkdtempSync(join(tmpdir(), 'landing-graph-feed-'))
  const blogDir = join(root, 'content/blog')
  let server
  try {
    mkdirSync(blogDir, { recursive: true })
    writeFileSync(
      join(root, 'index.html'),
      '<h1>The website, not the feed</h1>'
    )
    writeFileSync(
      join(blogDir, 'published.md'),
      '---\ntitle: First & published\ndate: 2026-01-01\nsummary: A < B\n---\nBody'
    )
    writeFileSync(
      join(blogDir, 'draft.md'),
      '---\ntitle: Hidden draft\ndate: 2026-01-02\ndraft: true\n---\nSecret'
    )
    server = await createServer({
      configFile: false,
      root,
      base: BASE,
      plugins: [seoFiles({ blogDir })],
      server: { host: '127.0.0.1', port: 0 },
      logLevel: 'silent',
    })
    await server.listen()
    const origin = `http://127.0.0.1:${server.httpServer.address().port}`
    const response = await fetch(`${origin}${feedPath()}?reader=1`)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe(
      'application/rss+xml; charset=utf-8'
    )
    const xml = await response.text()
    expect(xml).toContain('<rss version="2.0"')
    expect(xml).toContain('<title>First &amp; published</title>')
    expect(xml).toContain('<description>A &lt; B</description>')
    expect(xml).toContain(`<link>${absolute(postPath('published'))}</link>`)
    expect(xml).not.toContain('Hidden draft')
    expect(xml).not.toContain('<h1>')

    // Content changes should be visible on the next request, without a build
    // or a restart of the dev server.
    writeFileSync(
      join(blogDir, 'draft.md'),
      '---\ntitle: Newly published\ndate: 2026-01-02\n---\nPublic now'
    )
    const updated = await fetch(`${origin}${feedPath()}`)
    expect(await updated.text()).toContain('<title>Newly published</title>')

    const head = await fetch(`${origin}${feedPath()}`, { method: 'HEAD' })
    expect(head.status).toBe(200)
    expect(head.headers.get('content-type')).toContain('application/rss+xml')
    expect(await head.text()).toBe('')

    const page = await fetch(`${origin}${BASE}`)
    expect(await page.text()).toContain('<h1>The website, not the feed</h1>')
  } finally {
    await server?.close()
    rmSync(root, { recursive: true, force: true })
  }
}, 20_000)
