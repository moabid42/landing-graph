// A small GitHub-flavored markdown renderer, tuned for this site's posts.
// Renders straight to React elements (no innerHTML except mermaid's SVG),
// and treats ```mermaid fences as live diagrams, lazy-loading the mermaid
// library only when a post actually contains one.
import { createElement, useEffect, useId, useState } from 'react'

/* ---------------- inline markdown ---------------- */
const INLINE_RE = new RegExp(
  [
    /\\[\\`*_[\]~#>|-]/.source, // 1 escaped char
    /`[^`\n]+`/.source, // 2 code span
    /!\[[^\]\n]*\]\([^)\n]+\)/.source, // 3 image
    /\[[^\]\n]+\]\([^)\n]+\)/.source, // 4 link
    /\*\*.+?\*\*/.source, // 5 bold
    /\*[^*\n]+\*/.source, // 6 italic
    /~~.+?~~/.source, // 7 strikethrough
    /https?:\/\/[^\s<>()]+[^\s<>().,!?:;'"]/.source, // 8 autolink
  ]
    .map((s) => `(${s})`)
    .join('|')
)

const extProps = (href) =>
  /^[a-z]+:\/\//.test(href)
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {}

function inline(text) {
  const out = []
  let rest = text
  let k = 0
  while (rest) {
    const m = rest.match(INLINE_RE)
    if (!m) {
      out.push(rest)
      break
    }
    if (m.index > 0) out.push(rest.slice(0, m.index))
    const t = m[0]
    if (m[1]) out.push(t.slice(1))
    else if (m[2]) out.push(<code key={k}>{t.slice(1, -1)}</code>)
    else if (m[3]) {
      const im = t.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/)
      if (im) out.push(<img key={k} src={im[2]} alt={im[1]} title={im[3]} />)
      else out.push(t)
    } else if (m[4]) {
      const lm = t.match(/^\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/)
      if (lm)
        out.push(
          <a key={k} href={lm[2]} title={lm[3]} {...extProps(lm[2])}>
            {inline(lm[1])}
          </a>
        )
      else out.push(t)
    } else if (m[5]) out.push(<strong key={k}>{inline(t.slice(2, -2))}</strong>)
    else if (m[6]) out.push(<em key={k}>{inline(t.slice(1, -1))}</em>)
    else if (m[7]) out.push(<del key={k}>{inline(t.slice(2, -2))}</del>)
    else if (m[8])
      out.push(
        <a key={k} href={t} target="_blank" rel="noopener noreferrer">
          {t}
        </a>
      )
    rest = rest.slice(m.index + t.length)
    k++
  }
  return out
}

/* ---------------- mermaid diagrams ---------------- */
// Primer-flavored theme variables so diagrams look native to the site.
const MERMAID_DARK = {
  background: '#0d1117',
  primaryColor: '#161b22',
  primaryTextColor: '#e6edf3',
  primaryBorderColor: '#30363d',
  secondaryColor: '#21262d',
  tertiaryColor: '#161b22',
  lineColor: '#8b949e',
  textColor: '#e6edf3',
  fontSize: '14px',
}
const MERMAID_LIGHT = {
  background: '#ffffff',
  primaryColor: '#f6f8fa',
  primaryTextColor: '#1f2328',
  primaryBorderColor: '#d0d7de',
  secondaryColor: '#eaeef2',
  tertiaryColor: '#f6f8fa',
  lineColor: '#59636e',
  textColor: '#1f2328',
  fontSize: '14px',
}

let mermaidMod = null

export function Mermaid({ code }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const [svg, setSvg] = useState(null)
  const [err, setErr] = useState(null)
  const [tick, setTick] = useState(0)

  // re-render the diagram when the site theme flips
  useEffect(() => {
    const mo = new MutationObserver(() => setTick((t) => t + 1))
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => mo.disconnect()
  }, [])

  useEffect(() => {
    let on = true
    const dark = document.documentElement.getAttribute('data-theme') !== 'light'
    const load = mermaidMod
      ? Promise.resolve(mermaidMod)
      : import('mermaid').then((m) => (mermaidMod = m.default))
    load
      .then(async (mermaid) => {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'base',
          themeVariables: dark ? MERMAID_DARK : MERMAID_LIGHT,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
        })
        try {
          const r = await mermaid.render(`mmd${uid}t${tick}`, code)
          if (on) {
            setSvg(r.svg)
            setErr(null)
          }
        } catch (e) {
          if (on) setErr(String(e?.message || e))
        }
      })
      .catch((e) => on && setErr(String(e?.message || e)))
    return () => {
      on = false
    }
  }, [code, tick, uid])

  if (err)
    return (
      <pre className="md-code md-mermaid-err">
        <code>{code + '\n\n%% mermaid error: ' + err}</code>
      </pre>
    )
  if (!svg)
    return (
      <div className="md-mermaid loading" aria-hidden="true">
        <code>rendering diagram…</code>
      </div>
    )
  return (
    <div
      className="md-mermaid"
      role="img"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

/* ---------------- block markdown ---------------- */
const ITEM_RE = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/
const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

// if a list item parses to a single paragraph, unwrap it (tight list)
const unwrap = (nodes) =>
  nodes.length === 1 && nodes[0]?.type === 'p' ? nodes[0].props.children : nodes

function renderList(lines, key) {
  const first = lines.find((l) => !/^\s*$/.test(l))
  const base = first.match(/^(\s*)/)[1].length
  const ordered = /^\s*\d/.test(first)
  const items = []
  let cur = null
  for (const l of lines) {
    const m = l.match(ITEM_RE)
    if (m && m[1].length <= base) {
      if (cur) items.push(cur)
      cur = { lines: [m[3]], indent: m[1].length + m[2].length + 1 }
    } else if (cur) {
      const lead = l.match(/^\s*/)[0].length
      cur.lines.push(l.slice(Math.min(cur.indent, lead)))
    }
  }
  if (cur) items.push(cur)
  const Tag = ordered ? 'ol' : 'ul'
  return (
    <Tag key={key}>
      {items.map((it, idx) => {
        const task = it.lines[0].match(/^\[([ xX])\]\s+(.*)$/)
        if (task) {
          const body = [task[2], ...it.lines.slice(1)].join('\n')
          return (
            <li key={idx} className="task">
              <input type="checkbox" disabled checked={task[1] !== ' '} />{' '}
              {unwrap(blocks(body))}
            </li>
          )
        }
        return <li key={idx}>{unwrap(blocks(it.lines.join('\n')))}</li>
      })}
    </Tag>
  )
}

function blocks(src) {
  const lines = src.replace(/\r\n?/g, '\n').split('\n')
  const out = []
  let i = 0
  let k = 0
  while (i < lines.length) {
    const line = lines[i]
    if (/^\s*$/.test(line)) {
      i++
      continue
    }
    /* fenced code (```mermaid becomes a live diagram) */
    const fence = line.match(/^```(\S*)\s*$/)
    if (fence) {
      const lang = fence[1].toLowerCase()
      const buf = []
      i++
      while (i < lines.length && !/^```\s*$/.test(lines[i]))
        buf.push(lines[i++])
      i++
      const code = buf.join('\n')
      if (lang === 'mermaid') out.push(<Mermaid key={k++} code={code} />)
      else
        out.push(
          <pre key={k++} className="md-code" data-lang={lang || undefined}>
            <code>{code}</code>
          </pre>
        )
      continue
    }
    /* heading */
    const hm = line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/)
    if (hm) {
      out.push(
        createElement(
          'h' + hm[1].length,
          { key: k++, id: slugify(hm[2]) },
          inline(hm[2])
        )
      )
      i++
      continue
    }
    /* horizontal rule */
    if (/^ {0,3}(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      out.push(<hr key={k++} />)
      i++
      continue
    }
    /* blockquote */
    if (/^ {0,3}>/.test(line)) {
      const buf = []
      while (i < lines.length && /^ {0,3}>/.test(lines[i]))
        buf.push(lines[i++].replace(/^ {0,3}> ?/, ''))
      out.push(<blockquote key={k++}>{blocks(buf.join('\n'))}</blockquote>)
      continue
    }
    /* table */
    if (
      line.includes('|') &&
      i + 1 < lines.length &&
      /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) &&
      lines[i + 1].includes('-')
    ) {
      const splitRow = (l) =>
        l
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((c) => c.trim())
      const head = splitRow(line)
      const aligns = splitRow(lines[i + 1]).map((c) =>
        /^:-+:$/.test(c) ? 'center' : /^-+:$/.test(c) ? 'right' : undefined
      )
      i += 2
      const rows = []
      while (
        i < lines.length &&
        lines[i].includes('|') &&
        !/^\s*$/.test(lines[i])
      )
        rows.push(splitRow(lines[i++]))
      out.push(
        <div key={k++} className="md-table-wrap">
          <table>
            <thead>
              <tr>
                {head.map((c, ci) => (
                  <th key={ci} style={{ textAlign: aligns[ci] }}>
                    {inline(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>
                  {head.map((_, ci) => (
                    <td key={ci} style={{ textAlign: aligns[ci] }}>
                      {inline(r[ci] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      continue
    }
    /* list */
    if (ITEM_RE.test(line)) {
      const buf = []
      while (i < lines.length) {
        const l = lines[i]
        if (/^\s*$/.test(l)) {
          const nxt = lines[i + 1]
          if (
            nxt !== undefined &&
            (ITEM_RE.test(nxt) || /^\s{2,}\S/.test(nxt))
          ) {
            buf.push('')
            i++
            continue
          }
          break
        }
        if (ITEM_RE.test(l) || /^\s+\S/.test(l)) {
          buf.push(l)
          i++
          continue
        }
        break
      }
      out.push(renderList(buf, k++))
      continue
    }
    /* paragraph */
    const buf = [line]
    i++
    while (
      i < lines.length &&
      !/^\s*$/.test(lines[i]) &&
      !/^```/.test(lines[i]) &&
      !/^#{1,6}\s/.test(lines[i]) &&
      !/^ {0,3}>/.test(lines[i]) &&
      !ITEM_RE.test(lines[i]) &&
      !/^ {0,3}(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i])
    )
      buf.push(lines[i++])
    out.push(<p key={k++}>{inline(buf.join(' '))}</p>)
  }
  return out
}

export default function Markdown({ src }) {
  return <div className="md-body">{blocks(src)}</div>
}
