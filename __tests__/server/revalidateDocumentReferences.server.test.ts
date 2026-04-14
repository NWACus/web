jest.mock('../../src/payload.config', () => ({}))

const mockLogger = { info: jest.fn(), error: jest.fn() }

jest.mock('payload', () => ({
  getPayload: jest.fn(() => Promise.resolve({ logger: mockLogger })),
}))

import { ReferenceQuery } from '@/utilities/findDocumentsWithReferences'
import { DocumentForRevalidation } from '@/utilities/revalidateDocument'
import {
  revalidateDocumentReferences,
  RevalidationDeps,
} from '@/utilities/revalidateDocumentReferences'

let mockFindRefs: jest.Mock<Promise<DocumentForRevalidation[]>, [ReferenceQuery]>
let mockRevalidateDoc: jest.Mock<Promise<void>, [DocumentForRevalidation]>
let deps: RevalidationDeps

beforeEach(() => {
  mockFindRefs = jest.fn().mockResolvedValue([])
  mockRevalidateDoc = jest.fn().mockResolvedValue(undefined)
  deps = { findRefs: mockFindRefs, revalidateDoc: mockRevalidateDoc }
  mockLogger.info.mockReset()
  mockLogger.error.mockReset()
})

describe('revalidateDocumentReferences', () => {
  it('passes reference to findRefs unchanged', async () => {
    const reference = { collection: 'media' as const, id: 42 }

    await revalidateDocumentReferences(reference, deps)

    expect(mockFindRefs).toHaveBeenCalledWith(reference)
  })

  it('calls revalidateDoc for routable documents', async () => {
    const docs: DocumentForRevalidation[] = [
      { collection: 'pages', id: 1, slug: 'about', tenant: 1 },
      { collection: 'posts', id: 10, slug: 'my-post', tenant: 2 },
      { collection: 'events', id: 20, slug: 'winter-event', tenant: 1 },
    ]
    mockFindRefs.mockResolvedValue(docs)

    await revalidateDocumentReferences({ collection: 'sponsors' as const, id: 5 }, deps)

    expect(mockRevalidateDoc).toHaveBeenCalledTimes(3)
    expect(mockRevalidateDoc).toHaveBeenCalledWith(docs[0])
    expect(mockRevalidateDoc).toHaveBeenCalledWith(docs[1])
    expect(mockRevalidateDoc).toHaveBeenCalledWith(docs[2])
  })

  it('does not call revalidateDoc when no documents found', async () => {
    await revalidateDocumentReferences({ collection: 'tags' as const, id: 99 }, deps)

    expect(mockRevalidateDoc).not.toHaveBeenCalled()
    expect(mockLogger.error).not.toHaveBeenCalled()
  })

  it('logs start and completion messages', async () => {
    mockFindRefs.mockResolvedValue([{ collection: 'pages', id: 1, slug: 'about', tenant: 1 }])

    await revalidateDocumentReferences({ collection: 'media' as const, id: 7 }, deps)

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Starting document reference revalidation for media ID 7'),
    )
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Revalidated 1 routable documents for media ID 7'),
    )
  })

  it('logs error and does not throw when findRefs throws', async () => {
    mockFindRefs.mockRejectedValue(new Error('DB connection failed'))

    await expect(
      revalidateDocumentReferences({ collection: 'sponsors' as const, id: 1 }, deps),
    ).resolves.toBeUndefined()

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error during document reference revalidation for sponsors ID 1'),
    )
  })

  it('logs error and does not throw when revalidateDoc throws', async () => {
    mockFindRefs.mockResolvedValue([{ collection: 'pages', id: 1, slug: 'about', tenant: 1 }])
    mockRevalidateDoc.mockRejectedValue(new Error('Revalidation failed'))

    await expect(
      revalidateDocumentReferences({ collection: 'teams' as const, id: 3 }, deps),
    ).resolves.toBeUndefined()

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error during document reference revalidation for teams ID 3'),
    )
  })

  describe('recursive resolution', () => {
    it('recurses through non-routable intermediate collections to find routable documents', async () => {
      // media 123 → sponsor 5 (non-routable) → page 7 (routable)
      mockFindRefs.mockImplementation(async (ref) => {
        if (ref.collection === 'media' && ref.id === 123) {
          return [{ collection: 'sponsors', id: 5, slug: '', tenant: 1 }]
        }
        if (ref.collection === 'sponsors' && ref.id === 5) {
          return [{ collection: 'pages', id: 7, slug: 'supporters', tenant: 1 }]
        }
        return []
      })

      await revalidateDocumentReferences({ collection: 'media' as const, id: 123 }, deps)

      expect(mockFindRefs).toHaveBeenCalledWith({ collection: 'media', id: 123 })
      expect(mockFindRefs).toHaveBeenCalledWith({ collection: 'sponsors', id: 5 })
      expect(mockRevalidateDoc).toHaveBeenCalledTimes(1)
      expect(mockRevalidateDoc).toHaveBeenCalledWith({
        collection: 'pages',
        id: 7,
        slug: 'supporters',
        tenant: 1,
      })
    })

    it('handles mixed routable and non-routable results', async () => {
      // media 10 is referenced directly by page 1, and also by sponsor 5 which is on page 7
      mockFindRefs.mockImplementation(async (ref) => {
        if (ref.collection === 'media' && ref.id === 10) {
          return [
            { collection: 'pages', id: 1, slug: 'gallery', tenant: 1 },
            { collection: 'sponsors', id: 5, slug: '', tenant: 1 },
          ]
        }
        if (ref.collection === 'sponsors' && ref.id === 5) {
          return [{ collection: 'pages', id: 7, slug: 'supporters', tenant: 1 }]
        }
        return []
      })

      await revalidateDocumentReferences({ collection: 'media' as const, id: 10 }, deps)

      expect(mockRevalidateDoc).toHaveBeenCalledTimes(2)
      expect(mockRevalidateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ collection: 'pages', id: 1 }),
      )
      expect(mockRevalidateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ collection: 'pages', id: 7 }),
      )
    })

    it('deduplicates routable documents found via multiple paths', async () => {
      // media 10 → page 1 directly, AND media 10 → sponsor 5 → page 1
      mockFindRefs.mockImplementation(async (ref) => {
        if (ref.collection === 'media' && ref.id === 10) {
          return [
            { collection: 'pages', id: 1, slug: 'about', tenant: 1 },
            { collection: 'sponsors', id: 5, slug: '', tenant: 1 },
          ]
        }
        if (ref.collection === 'sponsors' && ref.id === 5) {
          return [{ collection: 'pages', id: 1, slug: 'about', tenant: 1 }]
        }
        return []
      })

      await revalidateDocumentReferences({ collection: 'media' as const, id: 10 }, deps)

      // Page 1 should only be revalidated once despite being found via two paths
      expect(mockRevalidateDoc).toHaveBeenCalledTimes(1)
      expect(mockRevalidateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ collection: 'pages', id: 1 }),
      )
    })

    it('handles deep chains: media → biography → team → page', async () => {
      mockFindRefs.mockImplementation(async (ref) => {
        if (ref.collection === 'media' && ref.id === 50) {
          return [{ collection: 'biographies', id: 3, slug: '', tenant: 1 }]
        }
        if (ref.collection === 'biographies' && ref.id === 3) {
          return [{ collection: 'teams', id: 2, slug: '', tenant: 1 }]
        }
        if (ref.collection === 'teams' && ref.id === 2) {
          return [{ collection: 'pages', id: 15, slug: 'who-we-are', tenant: 1 }]
        }
        return []
      })

      await revalidateDocumentReferences({ collection: 'media' as const, id: 50 }, deps)

      // media → biographies → teams (pages is routable, so no further findRefs call)
      expect(mockFindRefs).toHaveBeenCalledTimes(3)
      expect(mockRevalidateDoc).toHaveBeenCalledTimes(1)
      expect(mockRevalidateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ collection: 'pages', id: 15, slug: 'who-we-are' }),
      )
    })

    it('terminates on cycles without infinite recursion', async () => {
      // Contrived cycle: sponsor 5 → team 2 → sponsor 5
      mockFindRefs.mockImplementation(async (ref) => {
        if (ref.collection === 'media' && ref.id === 1) {
          return [{ collection: 'sponsors', id: 5, slug: '', tenant: 1 }]
        }
        if (ref.collection === 'sponsors' && ref.id === 5) {
          return [{ collection: 'teams', id: 2, slug: '', tenant: 1 }]
        }
        if (ref.collection === 'teams' && ref.id === 2) {
          // Cycle back to sponsors
          return [{ collection: 'sponsors', id: 5, slug: '', tenant: 1 }]
        }
        return []
      })

      await revalidateDocumentReferences({ collection: 'media' as const, id: 1 }, deps)

      // Should not infinite loop — sponsors:5 is visited, so the cycle is broken
      expect(mockRevalidateDoc).not.toHaveBeenCalled()
      // media:1 → sponsors:5 → teams:2 → sponsors:5 (skipped)
      expect(mockFindRefs).toHaveBeenCalledTimes(3)
    })
  })
})
