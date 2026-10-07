import path from 'path'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
import loadConfig from 'tailwindcss/loadConfig'

async function compile(classes: string) {
  const config = loadConfig(path.resolve(__dirname, '../../tailwind.config.mjs'))
  const { css } = await postcss([
    tailwindcss({ ...config, content: [{ raw: `<div class="${classes}"></div>` }] }),
  ]).process('@tailwind utilities;', { from: undefined })
  return css
}

describe('tailwind config', () => {
  // Any object-valued screen (e.g. `{ raw: ... }`) makes Tailwind silently drop min-*/max-* variants
  it('generates max-* and min-* variants', async () => {
    const css = await compile('md:max-xl:max-w-none max-md:hidden min-[500px]:flex')

    expect(css).toContain('.md\\:max-xl\\:max-w-none')
    expect(css).toContain('.max-md\\:hidden')
    expect(css).toContain('.min-\\[500px\\]\\:flex')
  })

  it('gives printWide: enough specificity to override the screen breakpoints', async () => {
    const css = await compile('md:w-1/2 printWide:w-1/3')

    expect(css).toContain('@media print and (min-width: 700px)')
    expect(css).toContain(':root .printWide\\:w-1\\/3')
  })
})
