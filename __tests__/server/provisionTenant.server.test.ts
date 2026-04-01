// Real block configs are used (no mocks needed) thanks to ESM transform support in jest.config.mjs.
// These mocks are for modules that need a running Payload instance or external services.
jest.mock('../../src/access/hasSuperAdminPermissions', () => ({
  hasSuperAdminPermissions: jest.fn(),
}))

jest.mock('../../src/endpoints/seed/utilities', () => ({
  getSeedImageByFilename: jest.fn(),
}))

import type { Page } from '@/payload-types'
import { clearLayoutRelationships } from '@/utilities/clearLayoutRelationships'

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
