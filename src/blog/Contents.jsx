import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export default function Contents({ articleRef, body }) {
  const [headings, setHeadings] = useState([])
  const [active, setActive] = useState('')
  const [open, setOpen] = useState(false)
  const desktopList = useRef(null)

  useEffect(() => {
    const article = articleRef.current
    if (!article || body === null) return
    const nodes = [...article.querySelectorAll('h2[id], h3[id]')]
    setHeadings(
      nodes.map((node) => ({
        id: node.id,
        title: node.textContent,
        level: Number(node.tagName.slice(1)),
      }))
    )
    let frame = null
    const update = () => {
      frame = null
      const offset =
        (document.querySelector('.gh-header')?.getBoundingClientRect().height ||
          0) + 40
      let current = null
      for (const node of nodes) {
        if (node.getBoundingClientRect().top > offset) break
        current = node
      }
      setActive(current?.id || '')
    }
    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(update)
    }
    const observer = new ResizeObserver(schedule)
    observer.observe(article)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    update()
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [articleRef, body])

  // The mobile contents row appears after the outline is collected. Apply a
  // bookmarked chapter after that row has its final height, too.
  useLayoutEffect(() => {
    const hash = window.location.hash.slice(1)
    if (!hash || headings.length === 0) return
    const heading = headings.find((item) => item.id === hash)
    if (heading)
      document
        .getElementById(heading.id)
        ?.scrollIntoView({ behavior: 'instant' })
  }, [headings])

  // Keep the selected chapter within the sidebar's own scroll area without
  // moving the article or the reader's scroll position.
  useEffect(() => {
    const list = desktopList.current
    const item = list?.querySelector('[aria-current="location"]')
    if (!item) return
    const bounds = list.getBoundingClientRect()
    const selected = item.getBoundingClientRect()
    if (selected.top < bounds.top) list.scrollTop -= bounds.top - selected.top
    else if (selected.bottom > bounds.bottom)
      list.scrollTop += selected.bottom - bounds.bottom
  }, [active])

  if (headings.length === 0) return null

  const items = () => (
    <ol>
      {headings.map((heading) => (
        <li key={heading.id} className={`toc-level-${heading.level}`}>
          <a
            href={`#${heading.id}`}
            aria-current={active === heading.id ? 'location' : undefined}
            onClick={() => setOpen(false)}
          >
            {heading.title}
          </a>
        </li>
      ))}
    </ol>
  )

  return (
    <>
      <aside className="post-contents">
        <nav aria-label="On this page">
          <p className="toc-title">On this page</p>
          <div className="toc-scroll" ref={desktopList}>
            {items()}
          </div>
        </nav>
      </aside>
      <details
        className="post-contents-mobile"
        open={open}
        onToggle={(event) => setOpen(event.currentTarget.open)}
      >
        <summary>On this page</summary>
        <nav aria-label="Article chapters">{items()}</nav>
      </details>
    </>
  )
}
