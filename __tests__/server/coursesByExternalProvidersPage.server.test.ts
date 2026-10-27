import type { Media } from '@/payload-types'
import { buildTenant } from '../builders'

const seoImage: Media = { id: 1, tenant: 1, alt: '', updatedAt: '', createdAt: '' }

// ROOT_DOMAIN is read at module load, so each case imports the seed page fresh under its env
async function embedSrcs(rootDomain: string): Promise<string[]> {
  const original = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  process.env.NEXT_PUBLIC_ROOT_DOMAIN = rootDomain
  try {
    let srcs: string[] = []
    await jest.isolateModulesAsync(async () => {
      const { coursesByExternalProvidersPage } = await import(
        '@/endpoints/seed/pages/courses-by-external-providers-page'
      )
      const page = coursesByExternalProvidersPage(buildTenant({ id: 1 }), seoImage)
      srcs = page.layout.flatMap((block) =>
        block.blockType === 'genericEmbed'
          ? // Captures each iframe's src="..." value from the embed HTML
            Array.from(block.html.matchAll(/src="([^"]+)"/g), (match) => match[1])
          : [],
      )
    })
    return srcs
  } finally {
    if (original === undefined) Reflect.deleteProperty(process.env, 'NEXT_PUBLIC_ROOT_DOMAIN')
    else process.env.NEXT_PUBLIC_ROOT_DOMAIN = original
  }
}

describe('coursesByExternalProvidersPage embed URLs', () => {
  it('points the iframes at the root domain, protocol-relative so previews get https (#1433)', async () => {
    expect(await embedSrcs('branch.preview.avy-fx.org')).toEqual([
      '//branch.preview.avy-fx.org/embeds/providers',
      '//branch.preview.avy-fx.org/embeds/courses?showFilters=true',
    ])
  })

  it('uses localhost for local seeds', async () => {
    expect(await embedSrcs('localhost:3000')).toEqual([
      '//localhost:3000/embeds/providers',
      '//localhost:3000/embeds/courses?showFilters=true',
    ])
  })
})
