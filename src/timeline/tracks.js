// The bridge between the tracks declared in site.config.js and the CSS that
// paints them.
import { TRACKS } from '../content.js'

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
