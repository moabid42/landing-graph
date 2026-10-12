import { createLowlight } from 'lowlight'
import c from 'highlight.js/lib/languages/c'
import cpp from 'highlight.js/lib/languages/cpp'
import bash from 'highlight.js/lib/languages/bash'
import makefile from 'highlight.js/lib/languages/makefile'
import json from 'highlight.js/lib/languages/json'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import yaml from 'highlight.js/lib/languages/yaml'
import x86asm from 'highlight.js/lib/languages/x86asm'

const lowlight = createLowlight({
  c,
  cpp,
  bash,
  makefile,
  json,
  javascript,
  typescript,
  python,
  yaml,
  x86asm,
})
lowlight.registerAlias({ x86asm: ['asm', 'assembly'] })

// Token trees become React elements, so code is always text and cannot
// introduce HTML. Unknown languages keep their original plain rendering.
export function highlightCode(code, language) {
  return lowlight.registered(language)
    ? lowlight.highlight(language, code).children
    : null
}
