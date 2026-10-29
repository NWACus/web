import { linkablePaths } from '../../src/components/Breadcrumbs/linkablePaths'

const logError = jest.fn()
const findBuiltInPages = jest.fn()
const readNav = jest.fn()

jest.mock('../../src/payload.config', () => ({}))
jest.mock('next/cache', () => ({ unstable_cache: (fn: () => unknown) => fn }))
jest.mock('payload', () => ({
  getPayload: async () => ({ find: findBuiltInPages, logger: { error: logError } }),
}))
jest.mock('../../src/components/Header/utils', () => ({
  getCachedTopLevelNavItems: () => readNav,
  extractAllInternalUrls: () => ['/observations', '/weather/stations'],
}))

describe('linkablePaths', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    readNav.mockResolvedValue({ topLevelNavItems: [] })
    findBuiltInPages.mockResolvedValue({ docs: [{ url: '/blog' }, { url: 'weather/forecast' }] })
  })

  it("combines the nav's links with the center's built-in pages", async () => {
    expect(await linkablePaths('sac')).toEqual([
      '/observations',
      '/weather/stations',
      '/blog',
      '/weather/forecast',
    ])
    expect(logError).not.toHaveBeenCalled()
  })

  it('keeps the built-in pages and logs when the nav cannot be read', async () => {
    readNav.mockRejectedValue(new Error('NAC API down'))

    expect(await linkablePaths('sac')).toEqual(['/blog', '/weather/forecast'])
    expect(logError).toHaveBeenCalledTimes(1)
  })

  it('keeps the nav links and logs when built-in pages cannot be read', async () => {
    findBuiltInPages.mockRejectedValue(new Error('database busy'))

    expect(await linkablePaths('sac')).toEqual(['/observations', '/weather/stations'])
    expect(logError).toHaveBeenCalledTimes(1)
  })
})
