import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.js'

// Reuses the app's own Vite config, so tests see the same JSX transform and
// the same `?raw` / import.meta.glob handling the site is built with.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // Pure logic only — the DOM is covered by the Playwright suite, which
      // exercises a real browser instead of a simulated one.
      environment: 'node',
      include: ['tests/unit/**/*.test.js'],
      coverage: {
        provider: 'v8',
        // The parsing layer, which is what unit tests own. Rendering lives in
        // App.jsx / Timeline.jsx and is covered by the Playwright suite
        // against a real browser; counting it here would produce a number no
        // unit test is meant to move.
        include: ['src/content.js', 'src/blog.js', 'src/loadContent.js'],
        reporter: ['text', 'lcov'],
        thresholds: { statements: 85, branches: 85, functions: 85, lines: 85 },
      },
    },
  })
)
