import {
  deprovisionBeforeDelete,
  TENANT_SCOPED_COLLECTIONS,
} from '@/collections/Tenants/hooks/deprovisionBeforeDelete'
import { Logger } from 'pino'

function buildMockLogger(): jest.Mocked<Logger> {
  // @ts-expect-error - partial mock of pino Logger; only methods used in tests are provided
  return {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }
}

function buildMockPayload(findResults: Record<string, number>) {
  const mockLogger = buildMockLogger()
  return {
    logger: mockLogger,
    find: jest.fn(({ collection }: { collection: string }) =>
      Promise.resolve({ totalDocs: findResults[collection] ?? 0 }),
    ),
    delete: jest.fn(() => Promise.resolve()),
  }
}

describe('deprovisionBeforeDelete', () => {
  it('deletes documents from all collections that have tenant-scoped data', async () => {
    const findResults: Record<string, number> = {
      pages: 5,
      posts: 3,
      media: 10,
    }
    const mockPayload = buildMockPayload(findResults)
    const mockReq = { payload: mockPayload }

    await deprovisionBeforeDelete(
      // @ts-expect-error - partial mock; only id and req.payload are used by the hook
      { id: 42, req: mockReq },
    )

    // Should query every tenant-scoped collection
    expect(mockPayload.find).toHaveBeenCalledTimes(TENANT_SCOPED_COLLECTIONS.length)

    for (const collection of TENANT_SCOPED_COLLECTIONS) {
      expect(mockPayload.find).toHaveBeenCalledWith({
        collection,
        where: { tenant: { equals: 42 } },
        limit: 0,
        depth: 0,
      })
    }

    // Should only delete from collections with documents
    expect(mockPayload.delete).toHaveBeenCalledTimes(3)
    expect(mockPayload.delete).toHaveBeenCalledWith({
      collection: 'pages',
      where: { tenant: { equals: 42 } },
      req: mockReq,
    })
    expect(mockPayload.delete).toHaveBeenCalledWith({
      collection: 'posts',
      where: { tenant: { equals: 42 } },
      req: mockReq,
    })
    expect(mockPayload.delete).toHaveBeenCalledWith({
      collection: 'media',
      where: { tenant: { equals: 42 } },
      req: mockReq,
    })
  })

  it('skips delete for collections with no documents', async () => {
    const mockPayload = buildMockPayload({})
    const mockReq = { payload: mockPayload }

    await deprovisionBeforeDelete(
      // @ts-expect-error - partial mock; only id and req.payload are used by the hook
      { id: 1, req: mockReq },
    )

    expect(mockPayload.find).toHaveBeenCalledTimes(TENANT_SCOPED_COLLECTIONS.length)
    expect(mockPayload.delete).not.toHaveBeenCalled()
  })

  it('passes req to delete calls for transaction atomicity', async () => {
    const mockPayload = buildMockPayload({ settings: 1 })
    const mockReq = { payload: mockPayload }

    await deprovisionBeforeDelete(
      // @ts-expect-error - partial mock; only id and req.payload are used by the hook
      { id: 7, req: mockReq },
    )

    expect(mockPayload.delete).toHaveBeenCalledWith(expect.objectContaining({ req: mockReq }))
  })

  it('logs cleanup start and completion', async () => {
    const mockPayload = buildMockPayload({})
    const mockReq = { payload: mockPayload }

    await deprovisionBeforeDelete(
      // @ts-expect-error - partial mock; only id and req.payload are used by the hook
      { id: 99, req: mockReq },
    )

    expect(mockPayload.logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Cleaning up data for tenant 99'),
    )
    expect(mockPayload.logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Cleanup complete for tenant 99'),
    )
  })
})
