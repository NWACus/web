import { getCenterSettings } from '@/utilities/getCenterSettings'

const mockFind = jest.fn()

let cacheKeyParts: string[] | undefined
let cacheOptions: { tags?: string[] } | undefined
let cacheResolved = false

jest.mock('next/cache', () => ({
  unstable_cache:
    (cb: () => Promise<unknown>, keyParts: string[], options: Record<string, unknown>) =>
    async () => {
      cacheKeyParts = keyParts
      cacheOptions = options
      cacheResolved = false
      const value = await cb()
      cacheResolved = true
      return value
    },
}))

jest.mock('payload', () => ({
  getPayload: () => Promise.resolve({ find: mockFind }),
}))

jest.mock('../../src/payload.config', () => ({ __esModule: true, default: {} }))

describe('utilities: getCenterSettings', () => {
  beforeEach(() => {
    mockFind.mockReset()
  })

  it('returns the settings with their tenant, under the center tag', async () => {
    const settings = { id: 1, tenant: { id: 2, slug: 'nwac', name: 'Northwest Avalanche Center' } }
    mockFind.mockResolvedValue({ docs: [settings] })

    await expect(getCenterSettings('nwac')).resolves.toEqual(settings)
    expect(cacheOptions?.tags).toEqual(['settings-nwac'])
  })

  it('keys the entry by deployment, so a release starts from a fresh read', async () => {
    const original = process.env.VERCEL_DEPLOYMENT_ID
    process.env.VERCEL_DEPLOYMENT_ID = 'dpl_test'
    mockFind.mockResolvedValue({ docs: [] })

    try {
      await getCenterSettings('nwac')
    } finally {
      if (original === undefined) delete process.env.VERCEL_DEPLOYMENT_ID
      else process.env.VERCEL_DEPLOYMENT_ID = original
    }

    expect(cacheKeyParts).toEqual(['center-settings', 'nwac', 'dpl_test'])
  })

  // tenants default-populate to the slug alone, which would blank the center name in the footer
  it('asks for the tenant name', async () => {
    mockFind.mockResolvedValue({ docs: [] })

    await getCenterSettings('nwac')

    expect(mockFind.mock.calls[0][0].populate.tenants).toEqual({ slug: true, name: true })
  })

  it('returns null for a center without settings, without caching the miss', async () => {
    mockFind.mockResolvedValue({ docs: [] })

    await expect(getCenterSettings('nwac')).resolves.toBeNull()
    expect(cacheResolved).toBe(false)
  })

  it('rethrows a database failure rather than reporting a missing center', async () => {
    mockFind.mockRejectedValue(new Error('connection lost'))

    await expect(getCenterSettings('nwac')).rejects.toThrow('connection lost')
    expect(cacheResolved).toBe(false)
  })
})
