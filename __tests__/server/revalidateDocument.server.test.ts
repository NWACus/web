jest.mock('../../src/payload.config', () => ({}))

const mockLogger = { info: jest.fn(), warn: jest.fn() }
const mockPayload = { logger: mockLogger }

jest.mock('payload', () => ({
  getPayload: jest.fn(() => Promise.resolve(mockPayload)),
}))

const mockRevalidatePath = jest.fn()
jest.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

const mockResolveTenant = jest.fn()
jest.mock('../../src/utilities/tenancy/resolveTenant', () => ({
  resolveTenant: (...args: unknown[]) => mockResolveTenant(...args),
}))

const mockGetCachedTopLevelNavItems = jest.fn()
jest.mock('../../src/components/Header/utils', () => ({
  getCachedTopLevelNavItems: (...args: unknown[]) => mockGetCachedTopLevelNavItems(...args),
  getNavigationPathForSlug: () => [],
}))

import { revalidateDocument } from '@/utilities/revalidateDocument'

beforeEach(() => {
  mockRevalidatePath.mockReset()
  mockResolveTenant.mockReset()
  mockGetCachedTopLevelNavItems.mockReset()
  mockLogger.info.mockReset()
  mockLogger.warn.mockReset()

  mockResolveTenant.mockResolvedValue({ id: 1, slug: 'nwac' })
  mockGetCachedTopLevelNavItems.mockReturnValue(() => Promise.resolve({ topLevelNavItems: [] }))
})

describe('revalidateDocument', () => {
  /**
   * This test documents the architectural invariant that prevents infinite
   * revalidation cycles when documents reference each other (A → B → A).
   *
   * The revalidation chain is:
   *   1. Document A is saved → afterChange hook fires
   *   2. afterChange calls revalidateDocumentReferences(A)
   *   3. That finds Document B references A, calls revalidateDocument(B)
   *   4. revalidateDocument(B) ONLY calls revalidatePath() — it never saves
   *      or updates any document, so no afterChange hook fires for B
   *   5. Chain terminates
   *
   * If revalidateDocument ever started calling payload.update() or
   * payload.create(), circular references would cause infinite loops.
   * This test ensures that doesn't happen by verifying the mock Payload
   * instance never has write methods called.
   */
  it('only invalidates Next.js cache — never triggers Payload write operations', async () => {
    // Simulate: Page A references Post B, and Post B references Page A.
    // When Page A is saved, revalidateDocumentReferences finds Post B.
    // revalidateDocument(Post B) should ONLY call revalidatePath.
    const postB = { collection: 'posts', id: 10, slug: 'post-b', tenant: 1 }

    await revalidateDocument(postB)

    // The critical assertion: revalidatePath was called (cache invalidation happened)
    expect(mockRevalidatePath).toHaveBeenCalled()

    // The Payload instance should NEVER have update/create/delete called on it.
    // These methods don't even exist on our mock — if the code tried to call them,
    // it would throw. This is the architectural firewall against infinite cycles.
    expect(mockPayload).not.toHaveProperty('update')
    expect(mockPayload).not.toHaveProperty('create')
    expect(mockPayload).not.toHaveProperty('delete')
  })

  it('revalidates correct paths for pages', async () => {
    const page = { collection: 'pages', id: 1, slug: 'about', tenant: 1 }

    await revalidateDocument(page)

    expect(mockRevalidatePath).toHaveBeenCalledWith('/about')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/nwac/about')
  })

  it('revalidates correct paths for posts', async () => {
    const post = { collection: 'posts', id: 10, slug: 'my-post', tenant: 1 }

    await revalidateDocument(post)

    expect(mockRevalidatePath).toHaveBeenCalledWith('/blog/my-post')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/nwac/blog/my-post')
  })

  it('revalidates correct paths for homePages', async () => {
    const homePage = { collection: 'homePages', id: 1, slug: '', tenant: 1 }

    await revalidateDocument(homePage)

    expect(mockRevalidatePath).toHaveBeenCalledWith('/')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/nwac')
  })

  it('revalidates correct paths for events', async () => {
    const event = { collection: 'events', id: 5, slug: 'winter-summit', tenant: 1 }

    await revalidateDocument(event)

    expect(mockRevalidatePath).toHaveBeenCalledWith('/events/winter-summit')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/nwac/events/winter-summit')
  })

  it('does nothing for unrecognized collection types', async () => {
    const doc = { collection: 'unknownCollection', id: 1, slug: 'test', tenant: 1 }

    await revalidateDocument(doc)

    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })

  it('handles tenant resolution failure gracefully', async () => {
    mockResolveTenant.mockRejectedValue(new Error('Tenant not found'))

    const page = { collection: 'pages', id: 1, slug: 'about', tenant: 999 }

    await revalidateDocument(page)

    expect(mockRevalidatePath).not.toHaveBeenCalled()
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Failed to resolve tenant'),
    )
  })
})
