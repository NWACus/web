import { getNACWidgetsConfig } from '@/utilities/getNACWidgetsConfig'

const mockConfig: { version: string; baseUrl: string; devMode?: boolean } = {
  version: '20251207',
  baseUrl: 'https://du6amfiq9m9h7.cloudfront.net/public/v2',
  devMode: false,
}

jest.mock('../../src/utilities/getGlobals', () => ({
  getCachedGlobal: () => () => Promise.resolve(mockConfig),
}))

describe('utilities: getNACWidgetsConfig', () => {
  const originalNodeEnv = process.env.NODE_ENV
  const originalVercelEnv = process.env.VERCEL_ENV

  afterEach(() => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalNodeEnv,
      configurable: true,
    })
    if (originalVercelEnv === undefined) {
      delete process.env.VERCEL_ENV
    } else {
      process.env.VERCEL_ENV = originalVercelEnv
    }
    mockConfig.devMode = false
  })

  it('returns version and baseUrl from the global config', async () => {
    const result = await getNACWidgetsConfig()
    expect(result.version).toBe('20251207')
    expect(result.baseUrl).toBe('https://du6amfiq9m9h7.cloudfront.net/public/v2')
  })

  it('returns devMode from the global config in non-production', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', configurable: true })
    mockConfig.devMode = true

    const result = await getNACWidgetsConfig()
    expect(result.devMode).toBe(true)
  })

  it('forces devMode to false in production even when global config has it enabled', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true })
    process.env.VERCEL_ENV = 'production'
    mockConfig.devMode = true

    const result = await getNACWidgetsConfig()
    expect(result.devMode).toBe(false)
  })

  it('defaults devMode to false when not set in global config', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', configurable: true })
    delete mockConfig.devMode

    const result = await getNACWidgetsConfig()
    expect(result.devMode).toBe(false)
  })

  it('throws when version is missing', async () => {
    const original = mockConfig.version
    mockConfig.version = ''

    await expect(getNACWidgetsConfig()).rejects.toThrow('Could not determine NAC widgets version')

    mockConfig.version = original
  })

  it('throws when baseUrl is missing', async () => {
    const original = mockConfig.baseUrl
    mockConfig.baseUrl = ''

    await expect(getNACWidgetsConfig()).rejects.toThrow('Could not determine NAC widgets base url')

    mockConfig.baseUrl = original
  })
})
