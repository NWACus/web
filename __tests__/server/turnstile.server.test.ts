import { passesCaptcha } from '../../src/services/turnstile'

function mockSiteverify(success: boolean): jest.Mock {
  const mock = jest.fn().mockResolvedValue({ json: () => Promise.resolve({ success }) })
  global.fetch = mock
  return mock
}

describe('passesCaptcha', () => {
  const originalSecret = process.env.TURNSTILE_SECRET_KEY
  afterEach(() => {
    process.env.TURNSTILE_SECRET_KEY = originalSecret
  })

  it('passes everything while no secret is configured', async () => {
    delete process.env.TURNSTILE_SECRET_KEY
    await expect(passesCaptcha(null)).resolves.toBe(true)
  })

  it('rejects a missing token once a secret is configured', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'secret'
    await expect(passesCaptcha(null)).resolves.toBe(false)
  })

  it('verifies the token with Cloudflare and returns its verdict', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'secret'
    const fetchMock = mockSiteverify(true)
    await expect(passesCaptcha('token')).resolves.toBe(true)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({ method: 'POST' }),
    )

    mockSiteverify(false)
    await expect(passesCaptcha('token')).resolves.toBe(false)
  })
})
