// Minimal 16px octicon-style glyphs, stroke-drawn so they inherit currentColor.
const base = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export const IconRepo = (p) => (
  <svg {...base} {...p}>
    <path d="M4.75 1.75h7.5v12.5h-6a1.5 1.5 0 0 1 0-3h6" />
    <path d="M4.75 1.75a1.5 1.5 0 0 0-1.5 1.5v9.25" />
    <path d="M6.5 14.25v-2.5l1.25.9 1.25-.9v2.5" fill="currentColor" stroke="none" opacity=".85" />
  </svg>
)

export const IconBranch = (p) => (
  <svg {...base} {...p}>
    <circle cx="4.5" cy="3.25" r="1.6" />
    <circle cx="4.5" cy="12.75" r="1.6" />
    <circle cx="11.5" cy="3.25" r="1.6" />
    <path d="M4.5 4.85v6.3" />
    <path d="M11.5 4.85v1.4a3 3 0 0 1-3 3h-1.5" />
  </svg>
)

export const IconMerge = (p) => (
  <svg {...base} {...p}>
    <circle cx="4.5" cy="3.25" r="1.6" />
    <circle cx="4.5" cy="12.75" r="1.6" />
    <circle cx="11.75" cy="10.5" r="1.6" />
    <path d="M4.5 4.85v6.3" />
    <path d="M4.5 6c3.2 0 5.6 1.9 5.6 4.5" />
  </svg>
)

export const IconIssueOpen = (p) => (
  <svg {...base} {...p}>
    <circle cx="8" cy="8" r="6" />
    <circle cx="8" cy="8" r="1.6" fill="currentColor" stroke="none" />
  </svg>
)

export const IconClosed = (p) => (
  <svg {...base} {...p}>
    <circle cx="8" cy="8" r="6" />
    <path d="m5.7 10.3 4.6-4.6" />
  </svg>
)

export const IconTag = (p) => (
  <svg {...base} {...p}>
    <path d="M2 7.1V3a1 1 0 0 1 1-1h4.1a1 1 0 0 1 .7.3l6 6a1 1 0 0 1 0 1.4l-4.1 4.1a1 1 0 0 1-1.4 0l-6-6a1 1 0 0 1-.3-.7Z" />
    <circle cx="5.4" cy="5.4" r="1" fill="currentColor" stroke="none" />
  </svg>
)

export const IconMail = (p) => (
  <svg {...base} {...p}>
    <rect x="1.75" y="3.25" width="12.5" height="9.5" rx="1.5" />
    <path d="m2.5 4.5 5.5 4.25L13.5 4.5" />
  </svg>
)

export const IconPencil = (p) => (
  <svg {...base} {...p}>
    <path d="M11.1 2.1a1.6 1.6 0 0 1 2.3 0l.5.5a1.6 1.6 0 0 1 0 2.3l-7.6 7.6-3.4 1 1-3.4 7.2-8Z" />
    <path d="m9.9 3.4 2.7 2.7" />
  </svg>
)

export const IconFlask = (p) => (
  <svg {...base} {...p}>
    <path d="M6.25 1.75h3.5" />
    <path d="M6.75 1.75v4.1L2.9 12.4a1.3 1.3 0 0 0 1.1 2h8a1.3 1.3 0 0 0 1.1-2L9.25 5.85v-4.1" />
    <path d="M4.6 9.75h6.8" />
  </svg>
)

export const IconBook = (p) => (
  <svg {...base} {...p}>
    <path d="M8 3.5c-1.3-1-3.2-1.4-6-1.4v10.4c2.8 0 4.7.4 6 1.4 1.3-1 3.2-1.4 6-1.4V2.1c-2.8 0-4.7.4-6 1.4Z" />
    <path d="M8 3.5v10.4" />
  </svg>
)
