import { describe, it, expect } from 'vitest'
import { toHtml, withSnapshot } from '../../plugins/snapshot.js'

describe('toHtml', () => {
  it('keeps the shape a reader needs: headings, paragraphs, lists', () => {
    const html = toHtml('# T\n\nOne\nline.\n\n## Sub\n\n- a\n- b\n\n1. x\n')
    expect(html).toContain('<h1>T</h1>')
    expect(html).toContain('<p>One line.</p>')
    expect(html).toContain('<h2>Sub</h2>')
    expect(html).toContain('<ul><li>a</li><li>b</li></ul>')
    expect(html).toContain('<ol><li>x</li></ol>')
  })

  it('keeps a picture as its alt text and a link as its label', () => {
    const html = toHtml('![a cat](https://x.io/c.webp) and [site](/blog/)')
    expect(html).toContain('<img alt="a cat" src="https://x.io/c.webp"')
    expect(html).toContain('<a href="/blog/">site</a>')
  })

  it('escapes html in the text and in code blocks', () => {
    const html = toHtml('<script>x</script>\n\n```\n<b>\n```\n')
    expect(html).not.toContain('<script>')
    expect(html).toContain('<pre><code>&lt;b&gt;</code></pre>')
  })

  it('refuses a link that is not http, mailto or a site path', () => {
    expect(toHtml('[x](javascript:alert(1))')).not.toContain('javascript:')
  })

  it('drops authoring notes', () => {
    expect(toHtml('<!-- secret -->\nText')).not.toContain('secret')
  })
})

describe('withSnapshot', () => {
  it('fills the empty root with a hidden copy of the text', () => {
    const html = withSnapshot('<body><div id="root"></div></body>', '# Hi')
    expect(html).toContain(
      '<div id="root"><div class="prerendered">\n<h1>Hi</h1>\n</div></div>'
    )
  })
})
