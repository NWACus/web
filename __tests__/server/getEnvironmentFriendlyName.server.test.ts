import { getEnvironmentFriendlyName } from '../../src/utilities/getEnvironmentFriendlyName'

describe('getEnvironmentFriendlyName', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  it('returns "local" if NODE_ENV is not production', () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', configurable: true })
    process.env.VERCEL_ENV = 'production'
    expect(getEnvironmentFriendlyName()).toBe('local')
  })

  it('returns "local" if VERCEL_ENV is not set', () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true })
    delete process.env.VERCEL_ENV
    expect(getEnvironmentFriendlyName()).toBe('local')
  })

  it('returns "dev" if VERCEL_ENV is preview and VERCEL_GIT_COMMIT_REF is main', () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true })
    process.env.VERCEL_ENV = 'preview'
    process.env.VERCEL_GIT_COMMIT_REF = 'main'
    expect(getEnvironmentFriendlyName()).toBe('dev')
  })

  it('returns "preview" if VERCEL_ENV is preview and VERCEL_GIT_COMMIT_REF is not main', () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true })
    process.env.VERCEL_ENV = 'preview'
    process.env.VERCEL_GIT_COMMIT_REF = 'some-feature-branch'
    expect(getEnvironmentFriendlyName()).toBe('preview')
  })

  it('returns "prod" if VERCEL_ENV is production', () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true })
    process.env.VERCEL_ENV = 'production'
    expect(getEnvironmentFriendlyName()).toBe('prod')
  })

  it('returns "unknown" for any other case', () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true })
    process.env.VERCEL_ENV = 'development'
    process.env.VERCEL_GIT_COMMIT_REF = 'feature-branch'
    expect(getEnvironmentFriendlyName()).toBe('unknown')
  })
})
