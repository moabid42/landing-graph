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

// README and Timeline stay visible on mobile; the other sections use More.
const secondary = sections.filter((item) => item.id && item.id !== 'timeline')

export default function SectionNav({ post, home, section }) {
  const [open, setOpen] = useState(false)
  const moreRef = useRef(null)
  const buttonRef = useRef(null)

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
    const mq = window.matchMedia('(max-width: 899px)')
    const resize = (event) => {
      if (!event.matches) setOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('focusin', outside)
    document.addEventListener('keydown', escape)
    mq.addEventListener('change', resize)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('focusin', outside)
      document.removeEventListener('keydown', escape)
      mq.removeEventListener('change', resize)
    }
  }, [open])

  const renderLink = (item, inMore = false) => {
    const Icon = item.icon
    const props = item.id ? section(item.id) : home
    const active = post ? item.id === 'blog' : !item.id
    return (
      <a
        key={item.label}
        href={props.href}
        className={`${inMore ? 'nav-more-link' : `tab ${secondary.includes(item) ? 'nav-secondary' : ''}`} ${active ? 'active' : ''}`}
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
    <nav className="gh-tabs" aria-label="Sections">
      {sections.map((item) => renderLink(item))}
      <div className="nav-more" ref={moreRef}>
        <button
          ref={buttonRef}
          type="button"
          className={`tab nav-more-toggle ${post ? 'active' : ''}`}
          aria-expanded={open}
          aria-controls="more-sections"
          onClick={() => setOpen(!open)}
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
          {open && secondary.map((item) => renderLink(item, true))}
        </div>
      </div>
    </nav>
  )
}
