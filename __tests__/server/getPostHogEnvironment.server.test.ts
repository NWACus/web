import { getPostHogEnvironment } from '../../src/utilities/getPostHogEnvironment'

describe('getPostHogEnvironment', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.NEXT_PUBLIC_VERCEL_ENV
    delete process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('returns "local" when no Vercel environment is exposed to the client', () => {
    expect(getPostHogEnvironment()).toBe('local')
  })

  it('returns "local" for `vercel dev`', () => {
    process.env.NEXT_PUBLIC_VERCEL_ENV = 'development'
    expect(getPostHogEnvironment()).toBe('local')
  })

  it('returns "production" for production deployments', () => {
    process.env.NEXT_PUBLIC_VERCEL_ENV = 'production'
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF = 'main'
    expect(getPostHogEnvironment()).toBe('production')
  })

  it('returns "development" for preview deployments of main', () => {
    process.env.NEXT_PUBLIC_VERCEL_ENV = 'preview'
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF = 'main'
    expect(getPostHogEnvironment()).toBe('development')
  })

  it('returns "preview" for preview deployments of other branches', () => {
    process.env.NEXT_PUBLIC_VERCEL_ENV = 'preview'
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF = 'feature/posthog'
    expect(getPostHogEnvironment()).toBe('preview')
  })
})
