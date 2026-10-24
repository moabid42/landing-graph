import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

export default function ArchiveSort({ label, value, onChange, defaultSort }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [above, setAbove] = useState(false)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const initialFocus = useRef(0)
  const options = [
    { value: 'default', label: defaultSort },
    { value: 'updated', label: 'Recently updated' },
  ]
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  )

  useLayoutEffect(() => {
    if (!open) return
    const position = () => {
      const bounds = rootRef.current.getBoundingClientRect()
      const height = menuRef.current.parentElement.offsetHeight + 6
      setAbove(
        window.innerHeight - bounds.bottom < height && bounds.top > height
      )
    }
    position()
    window.addEventListener('resize', position)
    return () => window.removeEventListener('resize', position)
  }, [open])

  useEffect(() => {
    if (!open) return
    menuRef.current.children[initialFocus.current]?.focus()
    const outside = (event) => {
      if (!rootRef.current.contains(event.target)) setOpen(false)
    }
    const escape = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        triggerRef.current.focus()
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

  const openMenu = (index) => {
    initialFocus.current = index
    setOpen(true)
  }
  const navigate = (event) => {
    if (event.key === 'Tab') {
      setOpen(false)
      triggerRef.current.focus()
      return
    }
    const items = [...menuRef.current.children]
    const current = items.indexOf(document.activeElement)
    let next
    if (event.key === 'ArrowDown') next = (current + 1) % items.length
    else if (event.key === 'ArrowUp')
      next = (current - 1 + items.length) % items.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = items.length - 1
    else if (
      event.key.length === 1 &&
      /\S/.test(event.key) &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      const match = items
        .slice(current + 1)
        .concat(items.slice(0, current + 1))
        .find((item) =>
          item.textContent
            .trim()
            .toLowerCase()
            .startsWith(event.key.toLowerCase())
        )
      next = items.indexOf(match)
    }
    if (next >= 0) {
      event.preventDefault()
      items[next].focus()
    }
  }

  return (
    <div className="archive-sort" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="gh-btn archive-sort-toggle"
        aria-label={`Sort by: ${options[selectedIndex].label} (${label})`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => (open ? setOpen(false) : openMenu(selectedIndex))}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            openMenu(event.key === 'ArrowDown' ? 0 : options.length - 1)
          }
        }}
      >
        <span className="archive-sort-prefix">Sort by:</span>
        <span>{options[selectedIndex].label}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path d="m3 4 3 4 3-4Z" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div className={`archive-sort-menu${above ? ' is-above' : ''}`}>
          <p className="archive-sort-heading">Sort by</p>
          <div
            id={id}
            ref={menuRef}
            role="menu"
            tabIndex={-1}
            aria-label={`Sort ${label}`}
            onKeyDown={navigate}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className="archive-sort-option"
                role="menuitemradio"
                aria-checked={option.value === value}
                tabIndex={-1}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                  triggerRef.current.focus()
                }}
              >
                <svg
                  className="archive-sort-check"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                >
                  <path
                    d="m3.5 8 3 3 6-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
