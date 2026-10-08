import { ogImageUrlForDoc, ogImageUrlForZone } from '@/app/api/[center]/og/buildOgImageUrl'

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

describe('ogImageUrlForZone', () => {
  it('builds a versioned zone OG image URL', () => {
    expect(ogImageUrlForZone('nwac', 'stevens-pass', '0123456789abcdef')).toBe(
      '/api/nwac/og?route=forecasts%2Favalanche%2Fstevens-pass&v=0123456789abcdef',
    )
  })

  it('leaves the version off when there is none', () => {
    expect(ogImageUrlForZone('nwac', 'stevens-pass', null)).toBe(
      '/api/nwac/og?route=forecasts%2Favalanche%2Fstevens-pass',
    )
  })

  it('encodes a zone slug carrying a literal &, so it cannot end the route parameter early', () => {
    const url = ogImageUrlForZone('snfac', 'soldier-&-wood-river-valley-mtns', 'abc')
    const search = new URLSearchParams(url.split('?')[1])
    expect(search.get('route')).toBe('forecasts/avalanche/soldier-&-wood-river-valley-mtns')
    expect(search.get('v')).toBe('abc')
  })
})
