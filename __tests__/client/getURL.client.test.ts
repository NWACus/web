import { getURL } from '@/utilities/getURL'

describe('client-side utilities: getURL', () => {
  it('returns the full url, including port if exists without the pathname', () => {
    const url = new URL(window.location.href)

    const result = getURL()
    expect(result).toBe(url.origin)
  })

  it('does not use the hostname arg on the client when passed, returns the full url, including port if exists without the pathname', () => {
    const url = new URL(window.location.href)

    const result = getURL('nwac.localhost')
    expect(result).toBe(url.origin)
  })
})
