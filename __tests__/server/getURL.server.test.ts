import { getURL } from '@/utilities/getURL'

describe('utilities: getURL', () => {
  const originalEnv = process.env

  afterAll(() => {
    process.env = originalEnv
  })

  it('returns the NEXT_PUBLIC_ROOT_DOMAIN env var with the protocol in front of it when set and no hostname is passed', () => {
    const result = getURL()
    expect(result).toBe('http://envvar.localhost:3000')
  })

  it('returns the hostname value passed to it with the protocol in front of it when the hostname arg is truthy', () => {
    const result = getURL('nwac.localhost:3000')
    expect(result).toBe('http://nwac.localhost:3000')
  })

  it('returns NEXT_PUBLIC_ROOT_DOMAIN env var when hostname is null', () => {
    const result = getURL(null)
    expect(result).toBe('http://envvar.localhost:3000')
  })

  it('returns NEXT_PUBLIC_ROOT_DOMAIN env var when hostname is empty string', () => {
    const result = getURL('')
    expect(result).toBe('http://envvar.localhost:3000')
  })

  it('defaults to localhost:3000 if NEXT_PUBLIC_ROOT_DOMAIN env var is not set', async () => {
    process.env.NEXT_PUBLIC_ROOT_DOMAIN = ''
    jest.resetModules()
    const { getURL: freshGetURL } = await import('../../src/utilities/getURL')
    const result = freshGetURL()
    expect(result).toBe('http://localhost:3000')
  })

  it('uses https protocol in production', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true })
    process.env.NEXT_PUBLIC_ROOT_DOMAIN = 'prod.example.com'
    jest.resetModules()
    const { getURL: freshGetURL } = await import('../../src/utilities/getURL')
    const result = freshGetURL()
    expect(result).toBe('https://prod.example.com')
  })
})
