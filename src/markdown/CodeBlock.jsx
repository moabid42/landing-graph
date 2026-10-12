import { useEffect, useRef, useState } from 'react'

let highlighter
const loadHighlighter = () =>
  (highlighter ??= import('./highlight.js').catch((error) => {
    highlighter = null
    throw error
  }))

function tokens(nodes) {
  return nodes.map((node, index) =>
    node.type === 'text' ? (
      node.value
    ) : (
      <span key={index} className={node.properties.className?.join(' ')}>
        {tokens(node.children)}
      </span>
    )
  )
}

export default function CodeBlock({ code, language }) {
  const [highlighted, setHighlighted] = useState(null)
  const [status, setStatus] = useState('')
  const codeRef = useRef(null)

  useEffect(() => {
    let current = true
    setHighlighted(null)
    if (language && !['text', 'plaintext', 'txt'].includes(language)) {
      loadHighlighter()
        .then(({ highlightCode }) => {
          const tree = highlightCode(code, language)
          if (current) setHighlighted(tree)
        })
        .catch(() => {
          /* Code stays readable if the optional highlighting chunk fails. */
        })
    }
    return () => {
      current = false
    }
  }, [code, language])

  useEffect(() => {
    if (!status) return
    const timer = setTimeout(() => setStatus(''), 3000)
    return () => clearTimeout(timer)
  }, [status])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setStatus('copied')
    } catch {
      if (!codeRef.current) return
      const range = document.createRange()
      range.selectNodeContents(codeRef.current)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
      setStatus('selected')
    }
  }

  return (
    <div className="md-code-block">
      <div className="code-toolbar">
        <span>{language || 'code'}</span>
        <button type="button" className="gh-btn code-copy" onClick={copy}>
          {status === 'copied'
            ? 'Copied!'
            : status === 'selected'
              ? 'Selected'
              : 'Copy'}
        </button>
        <span className="sr-only" role="status">
          {status === 'copied'
            ? 'Code copied to clipboard.'
            : status === 'selected'
              ? 'Clipboard unavailable. Code selected; copy it with your keyboard.'
              : ''}
        </span>
      </div>
      {/* Focus makes horizontally scrolling code usable with the keyboard. */}
      {/* eslint-disable jsx-a11y/no-noninteractive-tabindex */}
      <pre
        className="md-code"
        data-lang={language || undefined}
        tabIndex={0}
        role="region"
        aria-label={`${language || 'Plain text'} code block`}
      >
        <code ref={codeRef}>{highlighted ? tokens(highlighted) : code}</code>
      </pre>
      {/* eslint-enable jsx-a11y/no-noninteractive-tabindex */}
    </div>
  )
}
