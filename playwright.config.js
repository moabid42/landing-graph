import { defineConfig, devices } from '@playwright/test'
import { BASE } from './src/paths.js'

const PORT = 4173
const BASE_URL = `http://localhost:${PORT}`
// The preview server serves the site under seo.url's path, the same way the
// deployed site does. tests/e2e/site.js builds paths against it.
const SITE_URL = new URL(BASE, BASE_URL).href

export default defineConfig({
  testDir: './tests/e2e',
  // The timeline measures itself and settles over a few frames, so give
  // assertions room to wait rather than sprinkling waits through the specs.
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
      testIgnore: '**/mobile.spec.js',
    },
    {
      // Under 700px the timeline switches to the git-log layout, which is a
      // different renderer and needs its own coverage.
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
      testMatch: '**/mobile.spec.js',
    },
  ],

  // Tests run against the built site, not the dev server, so what CI checks
  // is what actually ships.
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: SITE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
