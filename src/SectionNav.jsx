import { useEffect, useRef, useState } from 'react'
import config from '../site.config.js'
import { ENTRIES } from './content.js'
import { POSTS } from './blog/index.js'
import {
  IconBook,
  IconBranch,
  IconRepo,
  IconPencil,
  IconFlask,
  IconTag,
  IconMail,
} from './icons.jsx'

const sections = [
  { label: 'README', icon: IconBook },
  { id: 'work', label: 'Pinned', icon: IconRepo, count: config.work.length },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: IconBranch,
    count: ENTRIES.length,
  },
  {
    id: 'blog',
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
  { id: 'contact', label: 'Contact', icon: IconMail },
]

// Keep Timeline and Writing within reach on phones, and retain more tabs
// as space grows. The menu contains only the sections absent from the bar.
const overflowRules = [
  { query: '(max-width: 899px)', ids: ['stack', 'contact'] },
  { query: '(max-width: 749px)', ids: ['research'] },
  { query: '(max-width: 699px)', ids: [null, 'work'] },
]

const overflowAtViewport = () =>
  overflowRules.flatMap(({ query, ids }) =>
    window.matchMedia(query).matches ? ids : []
  )

export default function SectionNav({ post, home, section }) {
  const [open, setOpen] = useState(false)
  const [activeSection, setActiveSection] = useState(null)
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
    return () =>
      queries.forEach((query) => query.removeEventListener('change', resize))
  }, [])

  useEffect(() => {
    const header = navRef.current.closest('.gh-header')
    const main = document.querySelector('main')
    const targets = sections
      .filter((item) => item.id)
      .map((item) => ({
        id: item.id,
        heading: document.querySelector(`#${item.id} h2`),
      }))
      .filter((item) => item.heading)
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
      if (post) return

      let active = null
      for (const target of targets) {
        if (target.heading.getBoundingClientRect().top <= bounds.bottom + 24)
          active = target.id
      }
      // The final section can be too short to reach the header before the
      // page ends. It still owns the navigation when the reader reaches it.
      if (
        window.scrollY > 0 &&
        window.scrollY + window.innerHeight >=
          document.documentElement.scrollHeight - 2
      ) {
        active = targets.at(-1)?.id ?? null
      }
      setActiveSection(active)
    }
    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(update)
    }
    const observer = new ResizeObserver(schedule)
    observer.observe(header)
    observer.observe(main)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    update()
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [post])

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

  const currentSection = post ? 'blog' : activeSection
  const overflow = sections.filter((item) =>
    overflowIds.includes(item.id ?? null)
  )
  const visible = sections.filter((item) => !overflow.includes(item))
  const activeOverflow = overflow.find(
    (item) => item.id && item.id === currentSection
  )
  const moreActive = Boolean(activeOverflow)

  const renderLink = (item, inMore = false) => {
    const Icon = item.icon
    const props = item.id ? section(item.id) : home
    const active = (item.id ?? null) === currentSection
    return (
      <a
        key={item.label}
        href={props.href}
        className={`${inMore ? 'nav-more-link' : 'tab'} ${active ? 'active' : ''}`}
        aria-current={
          active ? (post || !item.id ? 'page' : 'location') : undefined
        }
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
          aria-current={moreActive ? (post ? 'page' : 'location') : undefined}
          aria-expanded={open}
          aria-controls="more-sections"
          onClick={() => setOpen(!open)}
        >
          {activeOverflow?.label ?? 'More'}
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
