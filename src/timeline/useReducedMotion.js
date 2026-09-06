import { useMemo } from 'react'

// Read once: a reader who has asked for less motion is not going to change
// their mind mid-visit, and re-reading on every render would be wasteful.
export default function useReducedMotion() {
  return useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )
}
