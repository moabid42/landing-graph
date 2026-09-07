// Every image under public/, with the size it really is.
//
// A post body is markdown, so an <img> in it has no dimensions and the page
// reflows as each picture lands — the reader loses their place mid-sentence.
// Handing the browser the intrinsic size up front reserves the box before the
// bytes arrive. Vite cannot do this for us: files in public/ are copied, not
// imported, so nothing in the graph ever looks at them.
//
// The sizes come out of the file headers rather than a library: five formats,
// a few bytes each, against a dependency that would ship in the lockfile for
// something the build does once.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative, sep } from 'node:path'

const ID = 'virtual:image-sizes'
const RESOLVED = '\0' + ID
const EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif'])

/** [width, height] from an image's header, or null if it cannot be read. */
export function imageSize(buf) {
  // PNG: IHDR is always the first chunk, width and height big-endian at 16.
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return [buf.readUInt32BE(16), buf.readUInt32BE(20)]
  }

  // GIF: logical screen descriptor, little-endian at 6.
  if (buf.length > 10 && buf.toString('latin1', 0, 3) === 'GIF') {
    return [buf.readUInt16LE(6), buf.readUInt16LE(8)]
  }

  // WebP: three encodings, three places to look.
  if (
    buf.length > 30 &&
    buf.toString('latin1', 0, 4) === 'RIFF' &&
    buf.toString('latin1', 8, 12) === 'WEBP'
  ) {
    const kind = buf.toString('latin1', 12, 16)
    if (kind === 'VP8 ') {
      return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff]
    }
    if (kind === 'VP8L') {
      const bits = buf.readUInt32LE(21)
      return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1]
    }
    if (kind === 'VP8X') {
      return [
        (buf.readUIntLE(24, 3) & 0xffffff) + 1,
        (buf.readUIntLE(27, 3) & 0xffffff) + 1,
      ]
    }
    return null
  }

  // JPEG: walk the segment chain to the frame header that carries the size.
  if (buf.length > 4 && buf.readUInt16BE(0) === 0xffd8) {
    let i = 2
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) {
        i++
        continue
      }
      const marker = buf[i + 1]
      // SOF0-3, SOF5-7, SOF9-11, SOF13-15 — every frame type but the
      // arithmetic-coding and progressive markers that share their range.
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        ![0xc4, 0xc8, 0xcc].includes(marker)
      ) {
        return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)]
      }
      i += 2 + buf.readUInt16BE(i + 2)
    }
  }

  return null
}

function walk(dir, root, out) {
  let entries = []
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const name of entries) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      walk(path, root, out)
      continue
    }
    if (!EXT.has(extname(name).toLowerCase())) continue
    const size = imageSize(readFileSync(path))
    // An image whose header we cannot read simply renders without a
    // reserved box, exactly as it did before.
    if (size) out[relative(root, path).split(sep).join('/')] = size
  }
  return out
}

export default function imageSizes({ dir = 'public' } = {}) {
  return {
    name: 'landing-graph:image-sizes',
    resolveId: (id) => (id === ID ? RESOLVED : null),
    load(id) {
      if (id !== RESOLVED) return null
      return `export default ${JSON.stringify(walk(dir, dir, {}))}`
    },
  }
}
