import { ogImageUrlForDoc } from '@/app/api/[center]/og/buildOgImageUrl'

describe('ogImageUrlForDoc', () => {
  it('builds a blog post OG image URL', () => {
    expect(ogImageUrlForDoc('nwac', 'post', 'winter-outlook')).toBe(
      '/api/nwac/og?type=post&slug=winter-outlook',
    )
  })

  it('builds an event OG image URL', () => {
    expect(ogImageUrlForDoc('sac', 'event', 'avalanche-awareness-night')).toBe(
      '/api/sac/og?type=event&slug=avalanche-awareness-night',
    )
  })

  it('encodes slugs with reserved characters so the query stays valid', () => {
    const url = ogImageUrlForDoc('snfac', 'post', 'a & b')
    expect(url).toBe('/api/snfac/og?type=post&slug=a+%26+b')
    // the resolvable slug round-trips out of the query string
    expect(new URLSearchParams(url.split('?')[1]).get('slug')).toBe('a & b')
  })
})
