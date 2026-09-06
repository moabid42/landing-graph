// Pure number and string helpers shared by both timeline layouts.

export function nowDecimal() {
  const d = new Date()
  return d.getFullYear() + (d.getMonth() + d.getDate() / 30) / 12
}

// decimal year -> "MM/YYYY"
export function fmtDate(y) {
  const yr = Math.floor(y)
  const m = Math.min(12, Math.max(1, Math.round((y - yr) * 12 + 0.5)))
  return String(m).padStart(2, '0') + '/' + yr
}

// deterministic fake short-sha per entry (FNV-1a)
export function sha(s) {
  let h = 0x811c9dc5
  for (const c of s) {
    h ^= c.charCodeAt(0)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7)
}

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
