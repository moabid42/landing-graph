import { useEffect, useRef, useState } from 'react'
import config from '../site.config.js'
import { ENTRIES } from './content.js'
import { PROJECTS } from './projects.js'
import { POSTS } from './blog/index.js'
import { homePath, pagePath } from './paths.js'
import { link } from './router.js'
import {
  IconBook,
  IconFingerprint,
  IconBranch,
  IconRepo,
  IconPencil,
  IconFlask,
  IconTag,
  IconMail,
} from './icons.jsx'

const sections = [
  { id: 'home', label: 'README', icon: IconBook },
  { id: 'work', label: 'Projects', icon: IconRepo, count: PROJECTS.length },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: IconBranch,
    count: ENTRIES.length,
  },
  {
    id: 'writing',
    label: 'Writing',
    icon: IconPencil,
    count: POSTS.length || null,
  },
  {
    id: 'research',
    label: 'Research',
    icon: IconFlask,
    count: config.research.length || null,
  },
  { id: 'stack', label: 'Stack', icon: IconTag },
  { id: 'soul', label: config.soul.title, icon: IconFingerprint },
  { id: 'more', label: 'Contact', icon: IconMail },
]

// Keep README and Timeline within reach on phones, and retain more tabs
// as space grows. The menu contains only the sections absent from the bar.
const overflowRules = [
  { query: '(max-width: 999px)', ids: ['stack', 'soul', 'more'] },
  { query: '(max-width: 749px)', ids: ['research'] },
  { query: '(max-width: 699px)', ids: ['work', 'writing'] },
]

const overflowAtViewport = () =>
  overflowRules.flatMap(({ query, ids }) =>
    window.matchMedia(query).matches ? ids : []
  )

export default function SectionNav({ current }) {
  const [open, setOpen] = useState(false)
  const [overflowIds, setOverflowIds] = useState(overflowAtViewport)
  const navRef = useRef(null)
  const moreRef = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    const queries = overflowRules.map(({ query }) => window.matchMedia(query))
    const resize = () => {
      setOverflowIds(overflowAtViewport())
      setOpen(false)
    }
    queries.forEach((query) => query.addEventListener('change', resize))
    resize()
    return () =>
      queries.forEach((query) => query.removeEventListener('change', resize))
  }, [])

  useEffect(() => {
    const header = navRef.current.closest('.gh-header')
    let frame = null
    let headerHeight = 0

    const update = () => {
      frame = null
      const bounds = header.getBoundingClientRect()
      if (bounds.height !== headerHeight) {
        headerHeight = bounds.height
        document.documentElement.style.setProperty(
          '--header-height',
          `${headerHeight}px`
        )
      }
    }
    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(update)
    }
    const observer = new ResizeObserver(schedule)
    observer.observe(header)
    window.addEventListener('resize', schedule)
    update()
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', schedule)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => setOpen(false), [current])

  useEffect(() => {
    if (!open) return
    const outside = (event) => {
      if (!moreRef.current?.contains(event.target)) setOpen(false)
    }
    const escape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('focusin', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('focusin', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  const currentSection = current ?? 'home'
  const overflow = sections.filter((item) => overflowIds.includes(item.id))
  const visible = sections.filter((item) => !overflow.includes(item))
  const activeOverflow = overflow.find(
    (item) => item.id && item.id === currentSection
  )
  const moreActive = Boolean(activeOverflow)

  const renderLink = (item, inMore = false) => {
    const Icon = item.icon
    const props = link(
      item.id === 'home' ? homePath() : pagePath(item.id),
      () => window.scrollTo({ top: 0, behavior: 'instant' })
    )
    const active = item.id === currentSection
    return (
      <a
        key={item.label}
        href={props.href}
        className={`${inMore ? 'nav-more-link' : 'tab'} ${active ? 'active' : ''}`}
        aria-current={active ? 'page' : undefined}
        onClick={(event) => {
          props.onClick?.(event)
          setOpen(false)
        }}
      >
        <Icon width={14} height={14} />
        {item.label}
        {item.count != null && <span className="counter">{item.count}</span>}
      </a>
    )
  }

  return (
    <nav
      className={`gh-tabs ${overflow.length ? 'has-overflow' : ''}`}
      aria-label="Sections"
      ref={navRef}
    >
      {visible.map((item) => renderLink(item))}
      <div className="nav-more" ref={moreRef}>
        <button
          ref={buttonRef}
          type="button"
          className={`tab nav-more-toggle ${moreActive ? 'active' : ''}`}
          aria-label="More pages"
          title={
            activeOverflow ? `Current page: ${activeOverflow.label}` : undefined
          }
          aria-expanded={open}
          aria-controls="more-sections"
          onClick={() => setOpen((value) => !value)}
        >
          More
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="m3 4 3 4 3-4Z" />
          </svg>
        </button>
        <div className="nav-more-menu" id="more-sections" hidden={!open}>
          {open && overflow.map((item) => renderLink(item, true))}
        </div>
      </div>
    </nav>
  )
}
