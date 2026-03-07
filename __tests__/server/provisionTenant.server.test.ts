import {
  SKIP_PAGE_SLUGS,
  TENANT_SCOPED_BLOCK_TYPES,
} from '@/collections/Tenants/endpoints/provisionTenant'

describe('provisionTenant constants', () => {
  describe('TENANT_SCOPED_BLOCK_TYPES', () => {
    it('contains the expected block types', () => {
      expect(TENANT_SCOPED_BLOCK_TYPES).toEqual(
        new Set(['team', 'sponsors', 'singleEvent', 'singleBlogPost', 'formBlock']),
      )
    })

    it.each(['team', 'sponsors', 'singleEvent', 'singleBlogPost', 'formBlock'])(
      'includes %s',
      (blockType) => {
        expect(TENANT_SCOPED_BLOCK_TYPES.has(blockType)).toBe(true)
      },
    )

    it.each(['text', 'blogList', 'eventList', 'hero', 'callToAction'])(
      'does not include %s',
      (blockType) => {
        expect(TENANT_SCOPED_BLOCK_TYPES.has(blockType)).toBe(false)
      },
    )
  })

  describe('SKIP_PAGE_SLUGS', () => {
    it('contains the expected page slugs', () => {
      expect(SKIP_PAGE_SLUGS).toEqual(new Set(['blocks', 'lexical-blocks']))
    })

    it.each(['blocks', 'lexical-blocks'])('includes %s', (slug) => {
      expect(SKIP_PAGE_SLUGS.has(slug)).toBe(true)
    })

    it.each(['about-us', 'contact', 'donate-membership'])('does not include %s', (slug) => {
      expect(SKIP_PAGE_SLUGS.has(slug)).toBe(false)
    })
  })
})

describe('block filtering logic', () => {
  // Replicate the inline filtering logic from provisionTenant.ts for unit testing
  function filterAndTransformLayout(layout: Array<Record<string, unknown>>) {
    return layout
      .filter(
        (block: { blockType?: string }) =>
          !block.blockType || !TENANT_SCOPED_BLOCK_TYPES.has(block.blockType),
      )
      .map((block) => {
        if (block.blockType === 'blogList' && block.postOptions === 'static') {
          return { ...block, postOptions: 'dynamic', staticOptions: undefined }
        }
        if (block.blockType === 'eventList' && block.eventOptions === 'static') {
          return { ...block, eventOptions: 'dynamic', staticOpts: undefined }
        }
        return block
      })
  }

  it('filters out tenant-scoped blocks', () => {
    const layout = [
      { blockType: 'text', content: 'hello' },
      { blockType: 'team', members: [1, 2] },
      { blockType: 'hero', heading: 'Welcome' },
      { blockType: 'sponsors', items: [3] },
    ]

    const result = filterAndTransformLayout(layout)
    expect(result).toEqual([
      { blockType: 'text', content: 'hello' },
      { blockType: 'hero', heading: 'Welcome' },
    ])
  })

  it('converts static blogList to dynamic', () => {
    const layout = [
      { blockType: 'blogList', postOptions: 'static', staticOptions: { posts: [1, 2] } },
    ]

    const result = filterAndTransformLayout(layout)
    expect(result).toEqual([
      { blockType: 'blogList', postOptions: 'dynamic', staticOptions: undefined },
    ])
  })

  it('converts static eventList to dynamic', () => {
    const layout = [{ blockType: 'eventList', eventOptions: 'static', staticOpts: { events: [1] } }]

    const result = filterAndTransformLayout(layout)
    expect(result).toEqual([
      { blockType: 'eventList', eventOptions: 'dynamic', staticOpts: undefined },
    ])
  })

  it('leaves dynamic blogList unchanged', () => {
    const layout = [{ blockType: 'blogList', postOptions: 'dynamic', dynamicOpts: { max: 5 } }]

    const result = filterAndTransformLayout(layout)
    expect(result).toEqual([
      { blockType: 'blogList', postOptions: 'dynamic', dynamicOpts: { max: 5 } },
    ])
  })

  it('leaves dynamic eventList unchanged', () => {
    const layout = [
      { blockType: 'eventList', eventOptions: 'dynamic', dynamicOpts: { maxEvents: 4 } },
    ]

    const result = filterAndTransformLayout(layout)
    expect(result).toEqual([
      { blockType: 'eventList', eventOptions: 'dynamic', dynamicOpts: { maxEvents: 4 } },
    ])
  })

  it('returns empty array when all blocks are tenant-scoped', () => {
    const layout = [
      { blockType: 'team', members: [] },
      { blockType: 'sponsors', items: [] },
      { blockType: 'formBlock', form: 1 },
    ]

    const result = filterAndTransformLayout(layout)
    expect(result).toEqual([])
  })

  it('handles mixed layout with filtering and conversion', () => {
    const layout = [
      { blockType: 'hero', heading: 'Welcome' },
      { blockType: 'team', members: [1] },
      { blockType: 'blogList', postOptions: 'static', staticOptions: { posts: [1] } },
      { blockType: 'singleEvent', event: 5 },
      { blockType: 'eventList', eventOptions: 'dynamic', dynamicOpts: { maxEvents: 3 } },
    ]

    const result = filterAndTransformLayout(layout)
    expect(result).toEqual([
      { blockType: 'hero', heading: 'Welcome' },
      { blockType: 'blogList', postOptions: 'dynamic', staticOptions: undefined },
      { blockType: 'eventList', eventOptions: 'dynamic', dynamicOpts: { maxEvents: 3 } },
    ])
  })
})
