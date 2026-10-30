jest.mock('../../src/payload.config', () => ({}))

import {
  generateMetaForEvent,
  generateMetaForPage,
  generateMetaForPost,
} from '@/utilities/generateMeta'
import type { Metadata } from 'next'

const parentMeta: Metadata = { title: 'NWAC', description: 'Northwest Avalanche Center' }

// A slug with no matching document (any 404) used to throw reading `doc.tenant`
describe('generateMeta for a missing document', () => {
  it.each([
    ['page', generateMetaForPage],
    ['post', generateMetaForPost],
    ['event', generateMetaForEvent],
  ])('falls back to the parent metadata for a %s', async (_, generate) => {
    await expect(generate({ center: 'nwac', doc: null, parentMeta })).resolves.toEqual(parentMeta)
  })

  it('returns empty metadata with no parent', async () => {
    await expect(generateMetaForPage({ center: 'nwac', doc: null })).resolves.toEqual({})
  })
})
