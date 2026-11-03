const mockGetRedirects = jest.fn()
jest.mock('../../src/utilities/getRedirects', () => ({
  getCachedRedirects: () => () => mockGetRedirects(),
}))

// `redirect` and `notFound` throw in Next; here they throw something the test can read.
jest.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`)
  },
  notFound: () => {
    throw new Error('notFound')
  },
}))

import { Redirects } from '@/components/Redirects'

function storedRedirect(from: string, center = 'nwac') {
  return {
    id: 1,
    from,
    tenant: { id: 2, slug: center },
    to: { type: 'external', url: 'https://example.com/target' },
  }
}

describe('Redirects', () => {
  // Next.js hands the routes encodeURIComponent'd params, so a request for /& arrives as /%26
  it.each([
    ['/&', '/%26'],
    ['/%26', '/%26'],
    ['/blog/&', '/blog/%26'],
    ['/a+b', '/a%2Bb'],
  ])('redirects a stored From of %s for the route url %s', async (from, url) => {
    mockGetRedirects.mockResolvedValue([storedRedirect(from)])

    await expect(Redirects({ center: 'nwac', url })).rejects.toThrow(
      'redirect:https://example.com/target',
    )
  })

  it('does not match a From from another center', async () => {
    mockGetRedirects.mockResolvedValue([storedRedirect('/&', 'dvac')])

    await expect(Redirects({ center: 'nwac', url: '/%26' })).rejects.toThrow('notFound')
  })

  it('does not treat a double-encoded url as a match', async () => {
    mockGetRedirects.mockResolvedValue([storedRedirect('/&')])

    await expect(Redirects({ center: 'nwac', url: '/%2526' })).rejects.toThrow('notFound')
  })
})
