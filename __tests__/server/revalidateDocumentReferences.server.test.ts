jest.mock('../../src/payload.config', () => ({}))

const mockLogger = { info: jest.fn(), error: jest.fn() }

jest.mock('payload', () => ({
  getPayload: jest.fn(() => Promise.resolve({ logger: mockLogger })),
}))

const mockFindDocumentsWithReferences = jest.fn()
jest.mock('../../src/utilities/findDocumentsWithReferences', () => ({
  findDocumentsWithReferences: (...args: unknown[]) => mockFindDocumentsWithReferences(...args),
}))

const mockRevalidateDocument = jest.fn()
jest.mock('../../src/utilities/revalidateDocument', () => ({
  revalidateDocument: (...args: unknown[]) => mockRevalidateDocument(...args),
}))

import { revalidateDocumentReferences } from '@/utilities/revalidateDocumentReferences'

beforeEach(() => {
  mockFindDocumentsWithReferences.mockReset()
  mockRevalidateDocument.mockReset()
  mockLogger.info.mockReset()
  mockLogger.error.mockReset()
  mockFindDocumentsWithReferences.mockResolvedValue([])
  mockRevalidateDocument.mockResolvedValue(undefined)
})

describe('revalidateDocumentReferences', () => {
  it('passes reference to findDocumentsWithReferences unchanged', async () => {
    const reference = { collection: 'media' as const, id: 42 }

    await revalidateDocumentReferences(reference)

    expect(mockFindDocumentsWithReferences).toHaveBeenCalledWith(reference)
  })

  it('calls revalidateDocument for each found document', async () => {
    const docs = [
      { collection: 'pages', id: 1, slug: 'about', tenant: 1 },
      { collection: 'posts', id: 10, slug: 'my-post', tenant: 2 },
      { collection: 'events', id: 20, slug: 'winter-event', tenant: 1 },
    ]
    mockFindDocumentsWithReferences.mockResolvedValue(docs)

    await revalidateDocumentReferences({ collection: 'sponsors' as const, id: 5 })

    expect(mockRevalidateDocument).toHaveBeenCalledTimes(3)
    expect(mockRevalidateDocument).toHaveBeenCalledWith(docs[0])
    expect(mockRevalidateDocument).toHaveBeenCalledWith(docs[1])
    expect(mockRevalidateDocument).toHaveBeenCalledWith(docs[2])
  })

  it('does not call revalidateDocument when no documents found', async () => {
    await revalidateDocumentReferences({ collection: 'tags' as const, id: 99 })

    expect(mockRevalidateDocument).not.toHaveBeenCalled()
    expect(mockLogger.error).not.toHaveBeenCalled()
  })

  it('logs start, count, and completion messages', async () => {
    mockFindDocumentsWithReferences.mockResolvedValue([
      { collection: 'pages', id: 1, slug: 'about', tenant: 1 },
    ])

    await revalidateDocumentReferences({ collection: 'media' as const, id: 7 })

    expect(mockLogger.info).toHaveBeenCalledTimes(3)
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Starting document reference revalidation for media ID 7'),
    )
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Found 1 documents referencing media ID 7'),
    )
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Completed document reference revalidation for media ID 7'),
    )
  })

  it('logs error and does not throw when findDocumentsWithReferences throws', async () => {
    mockFindDocumentsWithReferences.mockRejectedValue(new Error('DB connection failed'))

    await expect(
      revalidateDocumentReferences({ collection: 'sponsors' as const, id: 1 }),
    ).resolves.toBeUndefined()

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error during document reference revalidation for sponsors ID 1'),
    )
  })

  it('logs error and does not throw when revalidateDocument throws', async () => {
    mockFindDocumentsWithReferences.mockResolvedValue([
      { collection: 'pages', id: 1, slug: 'about', tenant: 1 },
    ])
    mockRevalidateDocument.mockRejectedValue(new Error('Revalidation failed'))

    await expect(
      revalidateDocumentReferences({ collection: 'teams' as const, id: 3 }),
    ).resolves.toBeUndefined()

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error during document reference revalidation for teams ID 3'),
    )
  })
})
