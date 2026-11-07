import { getPostHogEnvironment } from '../../src/utilities/getPostHogEnvironment'

describe('getPostHogEnvironment', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.NEXT_PUBLIC_POSTHOG_ENVIRONMENT
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('returns "local" when the variable is unset', () => {
    expect(getPostHogEnvironment()).toBe('local')
  })

  it('returns "local" for an unrecognized value', () => {
    process.env.NEXT_PUBLIC_POSTHOG_ENVIRONMENT = 'prod'
    expect(getPostHogEnvironment()).toBe('local')
  })

  it.each(['production', 'preview', 'development', 'local'])('passes through %s', (value) => {
    process.env.NEXT_PUBLIC_POSTHOG_ENVIRONMENT = value
    expect(getPostHogEnvironment()).toBe(value)
  })
})
