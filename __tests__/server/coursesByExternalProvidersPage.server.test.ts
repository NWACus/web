import { coursesByExternalProvidersPage } from '@/endpoints/seed/pages/courses-by-external-providers-page'
import type { Media } from '@/payload-types'
import { getURL } from '@/utilities/getURL'
import { buildTenant } from '../builders'

const seoImage: Media = { id: 1, tenant: 1, alt: '', updatedAt: '', createdAt: '' }

function embedSrcs(): string[] {
  const page = coursesByExternalProvidersPage(buildTenant({ id: 1 }), seoImage)
  return page.layout.flatMap((block) =>
    block.blockType === 'genericEmbed'
      ? // Captures each iframe's src="..." value from the embed HTML
        Array.from(block.html.matchAll(/src="([^"]+)"/g), (match) => match[1])
      : [],
  )
}

describe('coursesByExternalProvidersPage embed origin', () => {
  const original = process.env.SEED_EMBED_ORIGIN

  afterEach(() => {
    if (original === undefined) delete process.env.SEED_EMBED_ORIGIN
    else process.env.SEED_EMBED_ORIGIN = original
  })

  it('points the iframes at SEED_EMBED_ORIGIN when set (preview seeds)', () => {
    process.env.SEED_EMBED_ORIGIN = 'https://branch.preview.avy-fx.org'

    expect(embedSrcs()).toEqual([
      'https://branch.preview.avy-fx.org/embeds/providers',
      'https://branch.preview.avy-fx.org/embeds/courses?showFilters=true',
    ])
  })

  it('falls back to getURL() when SEED_EMBED_ORIGIN is unset (local seeds)', () => {
    delete process.env.SEED_EMBED_ORIGIN

    expect(embedSrcs()).toEqual([
      `${getURL()}/embeds/providers`,
      `${getURL()}/embeds/courses?showFilters=true`,
    ])
  })
})
