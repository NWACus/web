import { passesCaptcha } from '../../src/services/turnstile'

function mockSiteverify(success: boolean): jest.Mock {
  const mock = jest.fn().mockResolvedValue({ json: () => Promise.resolve({ success }) })
  global.fetch = mock
  return mock
}

describe('passesCaptcha', () => {
  const originalSecret = process.env.TURNSTILE_SECRET_KEY
  const originalSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  afterEach(() => {
    process.env.TURNSTILE_SECRET_KEY = originalSecret
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = originalSiteKey
  })

  it('passes everything while no secret is configured', async () => {
    delete process.env.TURNSTILE_SECRET_KEY
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'site'
    await expect(passesCaptcha(null)).resolves.toBe(true)
  })

  it('passes everything when the secret is set without the site key', async () => {
    // Enforcing without a widget would demand a token nothing ever issues.
    process.env.TURNSTILE_SECRET_KEY = 'secret'
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    await expect(passesCaptcha(null)).resolves.toBe(true)
  })

  it('rejects a missing token once both keys are configured', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'secret'
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'site'
    await expect(passesCaptcha(null)).resolves.toBe(false)
  })

  it('verifies the token with Cloudflare and returns its verdict', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'secret'
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'site'
    const fetchMock = mockSiteverify(true)
    await expect(passesCaptcha('token')).resolves.toBe(true)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({ method: 'POST' }),
    )

    mockSiteverify(false)
    await expect(passesCaptcha('token')).resolves.toBe(false)
  })

  it('fails closed when siteverify is unreachable', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'secret'
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'site'
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'))
    await expect(passesCaptcha('token')).resolves.toBe(false)
  })
})
