import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import config from './site.config.js'
import seoFiles from './plugins/seoFiles.js'
import blogMeta from './plugins/blogMeta.js'

export default defineConfig({
  plugins: [react(), blogMeta(), seoFiles({ config })],
  base: './',
})
