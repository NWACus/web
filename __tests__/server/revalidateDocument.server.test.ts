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
  // Cycle safety: revalidateDocument must only call revalidatePath(), never
  // payload.update/create/delete. Otherwise circular references (A → B → A)
  // would cause infinite loops through afterChange hooks.
  it('only invalidates Next.js cache — never triggers Payload write operations', async () => {
    const postB = { collection: 'posts', id: 10, slug: 'post-b', tenant: 1 }

    await revalidateDocument(postB)

    expect(mockRevalidatePath).toHaveBeenCalled()
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

  it('logs a warning for unrecognized collection types', async () => {
    const doc = { collection: 'unknownCollection', id: 1, slug: 'test', tenant: 1 }

    await revalidateDocument(doc)

    expect(mockRevalidatePath).not.toHaveBeenCalled()
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining("no path mapping for collection 'unknownCollection'"),
    )
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
