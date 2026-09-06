// The bridge between the tracks declared in site.config.js and the CSS that
// paints them.
import { BRANCHES, TRACKS } from '../content.js'

// Which branch an entry rides, by entry id.
export const BRANCH_OF = Object.fromEntries(
  BRANCHES.flatMap((b) => b.entries.map((e) => [e.id, b]))
)

// Track colors live in site.config.js, not in a stylesheet. Publishing them
// as CSS variables is what lets a new track be one config line: the rules in
// styles.css all read var(--tl-c), and each element points --tl-c at its own
// track. Both themes are emitted up front so a theme flip is pure CSS.
export const TRACK_CSS =
  ':root{' +
  Object.entries(TRACKS)
    .map(([k, t]) => `--tl-track-${k}:${t.color};`)
    .join('') +
  "}html[data-theme='light']{" +
  Object.entries(TRACKS)
    .map(([k, t]) => `--tl-track-${k}:${t.colorLight};`)
    .join('') +
  '}'

// Every element that carries a track class also carries its color.
export const trackVar = (track) => ({ '--tl-c': `var(--tl-track-${track})` })
