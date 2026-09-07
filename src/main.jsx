import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import { upgradeLegacyUrl } from './router.js'
import './styles.css'

// Before the first render, so a link published against the old #/blog/<slug>
// routes lands on the post rather than flashing the README first.
upgradeLegacyUrl()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary label="The page">
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
