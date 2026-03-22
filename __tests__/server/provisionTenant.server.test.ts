// Mock heavy payload-dependent modules before any imports.
// jest.mock uses relative paths because it doesn't resolve @/ aliases.
jest.mock('../../src/constants/defaults', () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  DEFAULT_BLOCKS: require('./fixtures/mockBlocks').DEFAULT_BLOCKS,
}))

jest.mock('../../src/blocks/NACMedia/config', () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  NACMediaBlock: require('./fixtures/mockBlocks').NACMediaBlock,
}))

jest.mock('../../src/blocks/Button/config', () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ButtonBlock: require('./fixtures/mockBlocks').ButtonBlock,
}))

jest.mock('../../src/blocks/Callout/config', () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  CalloutBlock: require('./fixtures/mockBlocks').CalloutBlock,
}))

jest.mock('../../src/access/hasSuperAdminPermissions', () => ({
  hasSuperAdminPermissions: jest.fn(),
}))

jest.mock('../../src/endpoints/seed/utilities', () => ({
  getSeedImageByFilename: jest.fn(),
}))

import { SKIP_PAGE_SLUGS } from '@/collections/Tenants/endpoints/provisionTenant'
import type { Page } from '@/payload-types'
import { clearLayoutRelationships } from '@/utilities/clearLayoutRelationships'

describe('SKIP_PAGE_SLUGS', () => {
  it.each(['blocks', 'lexical-blocks'])('includes %s', (slug) => {
    expect(SKIP_PAGE_SLUGS.has(slug)).toBe(true)
  })

  it.each(['about-us', 'contact', 'donate-membership'])('does not include %s', (slug) => {
    expect(SKIP_PAGE_SLUGS.has(slug)).toBe(false)
  })
})

describe('clearLayoutRelationships', () => {
  it('returns empty array for empty layout', () => {
    expect(clearLayoutRelationships([])).toEqual([])
  })

  it('passes through block types not in allBlocksMap unchanged', () => {
    // genericEmbed is not in the mocked DEFAULT_BLOCKS, so it passes through as-is
    const block: Page['layout'][number] = {
      blockType: 'genericEmbed',
      html: '<p>test</p>',
      backgroundColor: 'transparent',
    }
    const result = clearLayoutRelationships([block])
    expect(result[0]).toEqual(block)
  })

  it('clears relationship fields', () => {
    const result = clearLayoutRelationships([
      { blockType: 'singleBlogPost', post: 123, backgroundColor: 'red' },
    ])
    expect(result[0]).not.toHaveProperty('post')
    expect(result[0]).toHaveProperty('backgroundColor', 'red')
  })

  it('clears upload fields', () => {
    const result = clearLayoutRelationships([
      { blockType: 'mediaBlock', media: 456, backgroundColor: 'transparent' },
    ])
    expect(result[0]).not.toHaveProperty('media')
  })

  it('clears hasMany relationship fields', () => {
    const result = clearLayoutRelationships([
      {
        blockType: 'sponsorsBlock',
        sponsors: [1, 2, 3],
        sponsorsLayout: 'static',
        backgroundColor: 'transparent',
      },
    ])
    expect(result[0]).not.toHaveProperty('sponsors')
    expect(result[0]).toHaveProperty('sponsorsLayout', 'static')
  })

  it('strips id keys', () => {
    const result = clearLayoutRelationships([
      { blockType: 'singleBlogPost', id: 'abc123', post: 1, backgroundColor: 'red' },
    ])
    expect(result[0]).not.toHaveProperty('id')
  })

  it('preserves non-relationship fields', () => {
    const result = clearLayoutRelationships([
      { blockType: 'singleEvent', event: 5, backgroundColor: 'blue' },
    ])
    expect(result[0]).toHaveProperty('backgroundColor', 'blue')
    expect(result[0]).not.toHaveProperty('event')
  })

  it('clears relationship fields nested in groups', () => {
    const result = clearLayoutRelationships([
      {
        blockType: 'blogList',
        postOptions: 'static',
        backgroundColor: 'transparent',
        staticOptions: { staticPosts: [1, 2, 3] },
      },
    ])
    expect(result[0]).toHaveProperty('postOptions', 'static')
    expect(result[0]).not.toHaveProperty('staticOptions.staticPosts')
  })

  it('clears upload fields nested in arrays', () => {
    const result = clearLayoutRelationships([
      {
        blockType: 'imageLinkGrid',
        columns: [
          { image: 10, caption: 'First' },
          { image: 20, caption: 'Second' },
        ],
      },
    ])
    expect(result[0]).not.toHaveProperty(['columns', 0, 'image'])
    expect(result[0]).toHaveProperty(['columns', 0, 'caption'], 'First')
    expect(result[0]).not.toHaveProperty(['columns', 1, 'image'])
    expect(result[0]).toHaveProperty(['columns', 1, 'caption'], 'Second')
  })

  it('processes multiple blocks independently', () => {
    const result = clearLayoutRelationships([
      { blockType: 'singleBlogPost', post: 1, backgroundColor: 'red' },
      { blockType: 'singleEvent', event: 2, backgroundColor: 'blue' },
      { blockType: 'mediaBlock', media: 3, backgroundColor: 'transparent' },
    ])
    expect(result[0]).not.toHaveProperty('post')
    expect(result[1]).not.toHaveProperty('event')
    expect(result[2]).not.toHaveProperty('media')
    expect(result[0]).toHaveProperty('backgroundColor', 'red')
    expect(result[1]).toHaveProperty('backgroundColor', 'blue')
  })
})
