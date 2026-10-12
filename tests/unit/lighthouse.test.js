import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

const config = readFileSync(
  new URL('../../lighthouserc.cjs', import.meta.url),
  'utf8'
)

function budgetUrls(paths) {
  const xml = `<urlset>${paths.map((path) => `<url><loc>https://example.com${path}</loc></url>`).join('')}</urlset>`
  const sandbox = {
    module: { exports: {} },
    require: () => ({ readFileSync: () => xml }),
  }
  runInNewContext(config, sandbox)
  return sandbox.module.exports.ci.collect.url
}

describe('Lighthouse page selection', () => {
  it.each(['/', '/portfolio/'])(
    'budgets the homepage and newest article under %s even when sections come first',
    (base) => {
      expect(
        budgetUrls([
          base,
          `${base}work/`,
          `${base}writing/`,
          `${base}blog/newest/`,
          `${base}blog/older/`,
        ])
      ).toEqual([
        `http://localhost:4174${base}`,
        `http://localhost:4174${base}blog/newest/`,
      ])
    }
  )

  it('budgets only the homepage if no articles are published', () => {
    expect(budgetUrls(['/', '/work/', '/writing/'])).toEqual([
      'http://localhost:4174/',
    ])
  })
})
