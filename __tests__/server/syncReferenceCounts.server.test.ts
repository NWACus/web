jest.mock('../../src/payload.config', () => ({}))

const mockFind = jest.fn()

jest.mock('../../src/utilities/findDocumentsWithReferences', () => ({
  findDocumentsWithReferences: (...args: unknown[]) => mockFind(...args),
}))

import { syncReferenceCounts, syncReferenceCountsOnDelete } from '@/hooks/syncReferenceCounts'

const mockUpdate = jest.fn()

// The stored counts the hook reads first. Anything not deleted starts at 99, so a recount always
// differs unless a test says otherwise.
let storedCounts: Record<number, number> = {}
let deletedIds = new Set<number>()
const mockStoredFind = jest.fn(async ({ where }: { where: { id: { in: number[] } } }) => ({
  docs: where.id.in
    .filter((id) => !deletedIds.has(id))
    .map((id) => ({ id, referenceCount: storedCounts[id] ?? 99 })),
}))

const req = {
  context: {},
  payload: { find: mockStoredFind, db: { updateOne: mockUpdate } },
}

function reference(collection: string, docId: number) {
  return { collection, docId, instances: [] }
}

/** The hook only reads doc, previousDoc and req, so the rest of Payload's args are irrelevant. */
function runChange(previousDoc: unknown, doc: unknown) {
  // @ts-expect-error - partial hook args; the hook reads only doc, previousDoc and req
  return syncReferenceCounts({ doc, previousDoc, req })
}

function runDelete(doc: unknown) {
  // @ts-expect-error - partial hook args; the hook reads only doc and req
  return syncReferenceCountsOnDelete({ doc, req })
}

beforeEach(() => {
  jest.clearAllMocks()
  storedCounts = {}
  deletedIds = new Set()
  req.context = {}
  mockFind.mockResolvedValue([])
})

describe('syncReferenceCounts', () => {
  it('ignores a document that references no shared content', async () => {
    await runChange(
      { documentReferences: [reference('media', 1)] },
      {
        documentReferences: [reference('media', 2), reference('posts', 3)],
      },
    )

    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('ignores a document with no documentReferences at all', async () => {
    await runChange(undefined, { id: 1 })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('writes the number of documents the finder returns', async () => {
    mockFind.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }])

    await runChange(undefined, { documentReferences: [reference('sharedMedia', 7)] })

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'sharedMedia',
        id: 7,
        data: { referenceCount: 3, updatedAt: null },
      }),
    )
  })

  it('counts drafts, so the number matches the panel', async () => {
    await runChange(undefined, { documentReferences: [reference('sharedMedia', 7)] })

    expect(mockFind).toHaveBeenCalledWith(
      { collection: 'sharedMedia', id: 7 },
      expect.objectContaining({ includeDrafts: true }),
    )
  })

  it('runs inside the caller transaction, so it sees the save that triggered it', async () => {
    await runChange(undefined, { documentReferences: [reference('sharedMedia', 7)] })

    expect(mockFind).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ req }))
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ req }))
  })

  it("writes through the adapter, so no hooks run and the caller's context is untouched", async () => {
    await runChange(undefined, { documentReferences: [reference('sharedMedia', 7)] })

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.not.objectContaining({ context: expect.anything() }),
    )
    // A nested Local API call would have merged its context into this shared request
    expect(req.context).toEqual({})
  })

  it('skips the write when the count has not changed', async () => {
    storedCounts = { 7: 2 }
    mockFind.mockResolvedValue([{ id: 1 }, { id: 2 }])

    await runChange(undefined, { documentReferences: [reference('sharedMedia', 7)] })

    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('skips a target that has been deleted, rather than failing the save', async () => {
    deletedIds = new Set([7])

    await runChange(
      { documentReferences: [reference('sharedMedia', 7)] },
      { documentReferences: [reference('sharedMedia', 7), reference('sharedMedia', 8)] },
    )

    expect(mockFind).toHaveBeenCalledTimes(1)
    expect(mockUpdate).toHaveBeenCalledTimes(1)
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: 8 }))
  })

  it('lets a failed count reject, so the save fails instead of writing a short number', async () => {
    mockFind.mockRejectedValue(new Error('query failed'))

    await expect(
      runChange(undefined, { documentReferences: [reference('sharedMedia', 7)] }),
    ).rejects.toThrow('query failed')
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('recounts the old target when a reference is swapped out', async () => {
    await runChange(
      { documentReferences: [reference('sharedMedia', 1)] },
      { documentReferences: [reference('sharedMedia', 2)] },
    )

    const counted = mockUpdate.mock.calls.map((call) => call[0].id).sort()
    expect(counted).toEqual([1, 2])
  })

  it('counts a target held on both sides only once', async () => {
    await runChange(
      { documentReferences: [reference('sharedMedia', 5)] },
      { documentReferences: [reference('sharedMedia', 5), reference('sharedMedia', 5)] },
    )

    expect(mockUpdate).toHaveBeenCalledTimes(1)
  })

  it('recounts every shared target a deleted document held', async () => {
    await runDelete({
      documentReferences: [
        reference('sharedMedia', 1),
        reference('media', 9),
        reference('sharedMedia', 4),
      ],
    })

    const counted = mockUpdate.mock.calls.map((call) => call[0].id).sort()
    expect(counted).toEqual([1, 4])
  })

  it('skips malformed reference rows rather than throwing', async () => {
    await runChange(undefined, {
      documentReferences: [
        { collection: 'sharedMedia' },
        { collection: 'sharedMedia', docId: 'seven' },
        null,
        reference('sharedMedia', 2),
      ],
    })

    expect(mockUpdate).toHaveBeenCalledTimes(1)
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }))
  })
})
