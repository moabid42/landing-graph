// A plain html copy of a page's text, for readers that never run scripts.
//
// The app draws everything with javascript, so the html a crawler fetches is
// an empty <div id="root">. Most AI crawlers stop there. This fills the root
// with the same words as simple html — headings, paragraphs, lists, links,
// pictures with their alt text — which React throws away the moment it
// renders. The stylesheet keeps it out of sight until then (.prerendered in
// src/styles.css), so a visitor never sees it and nothing shifts.
//
// Deliberately small: it only has to carry text a machine can read, not look
// like the page. src/markdown.jsx is what visitors see.

const esc = (s) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

// Links and pictures only accept http(s) or site paths, so a post cannot
// smuggle a javascript: url into the page.
const safeUrl = (u) => (/^(https?:|mailto:|\/)/i.test(u) ? u : '#')

function inline(text) {
  return esc(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(
      /!\[([^\]]*)\]\(([^)\s]+)\)/g,
      (_, alt, src) =>
        `<img alt="${alt}" src="${safeUrl(src)}" loading="lazy" />`
    )
    .replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      (_, label, href) => `<a href="${safeUrl(href)}">${label}</a>`
    )
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\s][^*]*)\*/g, '<em>$1</em>')
}

/** Markdown in, simple html out. */
export function toHtml(md) {
  const out = []
  let para = []
  let list = null
  const flushPara = () => {
    if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`)
    para = []
  }
  const flushList = () => {
    if (list) out.push(`<${list.tag}>${list.items.join('')}</${list.tag}>`)
    list = null
  }

  const lines = md
    .replace(/\r\n?/g, '\n')
    .replace(/<!--[\s\S]*?-->/g, '')
    .split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const fence = line.match(/^\s*```/)
    if (fence) {
      flushPara()
      flushList()
      const code = []
      while (++i < lines.length && !/^\s*```/.test(lines[i]))
        code.push(lines[i])
      out.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`)
      continue
    }
    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    const item = line.match(/^\s*(?:([-*+])|(\d+)\.)\s+(.*)$/)
    const quote = line.match(/^>\s?(.*)$/)
    if (heading) {
      flushPara()
      flushList()
      const n = heading[1].length
      out.push(`<h${n}>${inline(heading[2])}</h${n}>`)
    } else if (item) {
      flushPara()
      const tag = item[2] ? 'ol' : 'ul'
      if (list?.tag !== tag) {
        flushList()
        list = { tag, items: [] }
      }
      list.items.push(`<li>${inline(item[3])}</li>`)
    } else if (quote) {
      flushPara()
      flushList()
      out.push(`<blockquote><p>${inline(quote[1])}</p></blockquote>`)
    } else if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) {
      flushPara()
      flushList()
      out.push('<hr />')
    } else if (!line.trim()) {
      flushPara()
      flushList()
    } else {
      flushList()
      para.push(line.trim())
    }
  }
  flushPara()
  flushList()
  return out.join('\n')
}

const ROOT = '<div id="root"></div>'

/** The page's html with its root filled by a hidden copy of the text. */
export function withSnapshot(html, md) {
  return html.replace(
    ROOT,
    `<div id="root"><div class="prerendered">\n${toHtml(md)}\n</div></div>`
  )
}
