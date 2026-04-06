jest.mock('../../src/payload.config', () => ({}))

// Stub lexical editor features that execute at module scope when collection configs load
jest.mock('@payloadcms/richtext-lexical', () => ({
  lexicalEditor: ({ features }: { features?: unknown }) => {
    const resolvedFeatures =
      typeof features === 'function' ? features({ rootFeatures: [] }) : (features ?? [])
    return { features: resolvedFeatures }
  },
  BlocksFeature: ({ blocks }: { blocks?: unknown[] }) => ({
    key: 'blocks',
    serverFeatureProps: { blocks: blocks ?? [] },
  }),
  FixedToolbarFeature: () => ({ key: 'fixedToolbar' }),
  HeadingFeature: () => ({ key: 'heading' }),
  HorizontalRuleFeature: () => ({ key: 'horizontalRule' }),
  InlineToolbarFeature: () => ({ key: 'inlineToolbar' }),
  AlignFeature: () => ({ key: 'align' }),
  ParagraphFeature: () => ({ key: 'paragraph' }),
  UnderlineFeature: () => ({ key: 'underline' }),
  BoldFeature: () => ({ key: 'bold' }),
  ItalicFeature: () => ({ key: 'italic' }),
  LinkFeature: () => ({ key: 'link' }),
}))

const mockFind = jest.fn()
const mockLogger = { warn: jest.fn() }

import { Events } from '@/collections/Events'
import { HomePages } from '@/collections/HomePages'
import { Media } from '@/collections/Media'
import { Pages } from '@/collections/Pages'
import { Posts } from '@/collections/Posts'
import { Teams } from '@/collections/Teams'

// Include a combination of routable collections with documentReferences fields and those without
const collectionsToTest = [Pages, Posts, HomePages, Events, Media, Teams]

jest.mock('payload', () => ({
  getPayload: jest.fn(() =>
    Promise.resolve({
      find: (...args: unknown[]) => mockFind(...args),
      logger: mockLogger,
      config: { collections: collectionsToTest },
    }),
  ),
}))

import { findDocumentsWithReferences } from '@/utilities/findDocumentsWithReferences'

beforeEach(() => {
  mockFind.mockReset()
  mockLogger.warn.mockReset()
  mockFind.mockResolvedValue({ docs: [] })
})

describe('findDocumentsWithReferences', () => {
  it('queries only collections that have a documentReferences field', async () => {
    await findDocumentsWithReferences({ collection: 'sponsors', id: 1 })

    expect(mockFind).toHaveBeenCalledTimes(4)

    const queriedCollections = mockFind.mock.calls.map(
      (call: [{ collection: string }]) => call[0].collection,
    )
    expect(queriedCollections).toEqual(
      expect.arrayContaining(['pages', 'posts', 'homePages', 'events']),
    )
    expect(queriedCollections).toHaveLength(4)
  })

  it('does not query collections without documentReferences field', async () => {
    await findDocumentsWithReferences({ collection: 'media', id: 1 })

    const queriedCollections = mockFind.mock.calls.map(
      (call: [{ collection: string }]) => call[0].collection,
    )
    expect(queriedCollections).not.toContain('media')
    expect(queriedCollections).not.toContain('teams')
  })

  it('uses correct where clause with _status, collection, and docId', async () => {
    await findDocumentsWithReferences({ collection: 'media', id: 42 })

    for (const call of mockFind.mock.calls) {
      const { where, depth } = call[0]
      expect(where).toEqual({
        and: [
          { _status: { equals: 'published' } },
          { 'documentReferences.collection': { equals: 'media' } },
          { 'documentReferences.docId': { equals: 42 } },
        ],
      })
      expect(depth).toBe(1)
    }
  })

  it('returns single match in one collection', async () => {
    mockFind.mockImplementation(({ collection }: { collection: string }) => {
      if (collection === 'posts') {
        return { docs: [{ id: 10, slug: 'my-post', tenant: 1 }] }
      }
      return { docs: [] }
    })

    const results = await findDocumentsWithReferences({ collection: 'sponsors', id: 5 })

    expect(results).toEqual([{ collection: 'posts', id: 10, slug: 'my-post', tenant: 1 }])
  })

  it('returns multiple matches across collections', async () => {
    mockFind.mockImplementation(({ collection }: { collection: string }) => {
      if (collection === 'pages') {
        return {
          docs: [
            { id: 1, slug: 'about', tenant: 1 },
            { id: 2, slug: 'supporters', tenant: 2 },
          ],
        }
      }
      if (collection === 'events') {
        return { docs: [{ id: 20, slug: 'winter-event', tenant: 1 }] }
      }
      return { docs: [] }
    })

    const results = await findDocumentsWithReferences({ collection: 'teams', id: 3 })

    expect(results).toContainEqual({ collection: 'pages', id: 1, slug: 'about', tenant: 1 })
    expect(results).toContainEqual({ collection: 'pages', id: 2, slug: 'supporters', tenant: 2 })
    expect(results).toContainEqual({
      collection: 'events',
      id: 20,
      slug: 'winter-event',
      tenant: 1,
    })
    expect(results).toHaveLength(3)
  })

  it('returns empty array when no matches', async () => {
    const results = await findDocumentsWithReferences({ collection: 'tags', id: 99 })
    expect(results).toEqual([])
  })

  it('uses empty slug for collections without a slug field (e.g. homePages)', async () => {
    mockFind.mockImplementation(({ collection }: { collection: string }) => {
      if (collection === 'homePages') {
        return { docs: [{ id: 5, tenant: 1 }] }
      }
      return { docs: [] }
    })

    const results = await findDocumentsWithReferences({ collection: 'media', id: 7 })

    expect(results).toEqual([{ collection: 'homePages', id: 5, slug: '', tenant: 1 }])
  })

  it('preserves tenant object when populated', async () => {
    mockFind.mockImplementation(({ collection }: { collection: string }) => {
      if (collection === 'pages') {
        return { docs: [{ id: 1, slug: 'about', tenant: { id: 1, slug: 'nwac' } }] }
      }
      return { docs: [] }
    })

    const results = await findDocumentsWithReferences({ collection: 'media', id: 10 })

    expect(results).toEqual([
      { collection: 'pages', id: 1, slug: 'about', tenant: { id: 1, slug: 'nwac' } },
    ])
  })

  it('logs warning and continues on query error', async () => {
    mockFind.mockImplementation(({ collection }: { collection: string }) => {
      if (collection === 'pages') {
        throw new Error('DB connection failed')
      }
      if (collection === 'posts') {
        return { docs: [{ id: 10, slug: 'my-post', tenant: 1 }] }
      }
      return { docs: [] }
    })

    const results = await findDocumentsWithReferences({ collection: 'sponsors', id: 1 })

    expect(mockLogger.warn).toHaveBeenCalledTimes(1)
    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Error querying pages'))
    // Still returns results from other collections
    expect(results).toContainEqual({ collection: 'posts', id: 10, slug: 'my-post', tenant: 1 })
  })
})
