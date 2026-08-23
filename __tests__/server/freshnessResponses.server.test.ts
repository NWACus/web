import {
  changedResponse,
  indeterminateResponse,
  isFingerprint,
  malformedFingerprintResponse,
  unchangedResponse,
} from '@/utilities/freshnessResponses'

const SHA1 = 'a'.repeat(40)

describe('isFingerprint', () => {
  it('accepts a lowercase sha1 hex digest', () => {
    expect(isFingerprint(SHA1)).toBe(true)
    expect(isFingerprint('0123456789abcdef0123456789abcdef01234567')).toBe(true)
  })

  it.each([
    ['uppercase hex', SHA1.toUpperCase()],
    ['too short', 'a'.repeat(39)],
    ['too long', 'a'.repeat(41)],
    ['non-hex characters', 'g'.repeat(40)],
    ['empty', ''],
    ['a path traversal attempt', '../'.repeat(13) + 'a'],
    ['trailing whitespace', `${SHA1} `],
  ])('rejects %s', (_label, value) => {
    expect(isFingerprint(value)).toBe(false)
  })
})

describe('freshness cache policy', () => {
  it('is the only cacheable answer when the viewer is current', () => {
    // One cache key per zone — every viewer inside an ISR window sends the same fingerprint — and
    // the only entry that can ever go stale. Its TTL is the second half of the staleness budget.
    const res = unchangedResponse()

    expect(res.headers.get('Cache-Control')).toBe('public, max-age=0, s-maxage=30')
  })

  it('never caches a change, so the purge that rides with it always reaches origin', () => {
    const res = changedResponse(SHA1)

    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  it('never caches an indeterminate answer, so the next viewer retries immediately', () => {
    // Cached, a transient upstream blip would read as "you're current" to every viewer at that
    // POP for the full TTL.
    const res = indeterminateResponse()

    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  it('never caches a rejection', () => {
    const res = malformedFingerprintResponse()

    expect(res.status).toBe(400)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  it('reports no change for both flavours of "do not refresh", distinguishably', async () => {
    // The client must not refresh on either, but they are not the same event and the reason is
    // the only way an indeterminate answer is observable at all.
    expect(await unchangedResponse().json()).toEqual({ changed: false })
    expect(await indeterminateResponse().json()).toEqual({
      changed: false,
      reason: 'indeterminate',
    })
    expect(await changedResponse(SHA1).json()).toEqual({ changed: true, etag: SHA1 })
  })
})
