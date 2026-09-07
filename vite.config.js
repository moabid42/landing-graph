import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { BASE } from './src/paths.js'
import seoFiles from './plugins/seoFiles.js'
import blogMeta from './plugins/blogMeta.js'
import prerender from './plugins/prerender.js'

export default defineConfig({
  plugins: [react(), blogMeta(), seoFiles(), prerender()],
  // Derived from seo.url in site.config.js: '/' behind a custom domain,
  // '/<repo>/' on a GitHub project page. Routes are real paths now, so the
  // asset urls have to be absolute — a relative base breaks the moment a page
  // is served from a directory deeper than the root.
  base: BASE,
})
