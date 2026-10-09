import {
  forecastImageCacheControl,
  forecastImageSubtitle,
  parseForecastRoute,
} from '@/app/api/[center]/og/forecastRoute'

// 2026-10-09 05:00 UTC is still 2026-10-08 on the West Coast.
const NOW = new Date('2026-10-09T05:00:00Z')

const LIVE = 'public, max-age=300, s-maxage=300'
const SETTLED = 'public, max-age=86400, s-maxage=86400'

describe('parseForecastRoute', () => {
  it('reads a zone route', () => {
    expect(parseForecastRoute('forecasts/avalanche/stevens-pass', NOW)).toEqual({
      kind: 'zone',
      zone: 'stevens-pass',
      day: null,
    })
  })

  it('reads the date segment as a day, not as the zone', () => {
    expect(parseForecastRoute('forecasts/avalanche/stevens-pass/2026-04-01', NOW)).toEqual({
      kind: 'zone',
      zone: 'stevens-pass',
      day: '2026-04-01',
    })
  })

  it('keeps a zone slug carrying a literal &', () => {
    expect(
      parseForecastRoute('forecasts/avalanche/soldier-&-wood-river-valley-mtns/2026-04-05', NOW),
    ).toMatchObject({ zone: 'soldier-&-wood-river-valley-mtns', day: '2026-04-05' })
  })

  it('accepts today in UTC, which no center is ahead of', () => {
    expect(parseForecastRoute('forecasts/avalanche/stevens-pass/2026-10-09', NOW)).toMatchObject({
      kind: 'zone',
      day: '2026-10-09',
    })
  })

  it.each([
    ['a future day', '2026-10-10'],
    ['a malformed date', '2026-4-1'],
    ['a date that is not on the calendar', '2026-02-30'],
    ['something else entirely', 'archive'],
  ])('rejects %s, so it never reaches upstream', (_label, segment) => {
    expect(parseForecastRoute(`forecasts/avalanche/stevens-pass/${segment}`, NOW)).toEqual({
      kind: 'invalid',
    })
  })

  it('is null for any route that is not a forecast zone', () => {
    expect(parseForecastRoute(null, NOW)).toBeNull()
    expect(parseForecastRoute('blog/a-post', NOW)).toBeNull()
    expect(parseForecastRoute('forecasts/avalanche/', NOW)).toBeNull()
    expect(parseForecastRoute('forecasts/avalanche/a/2026-04-01/extra', NOW)).toBeNull()
  })
})

describe('forecastImageCacheControl', () => {
  it("keeps @vercel/og's default for images that aren't forecast cards", () => {
    expect(forecastImageCacheControl(null, NOW)).toBeUndefined()
  })

  it('holds a settled day for a day', () => {
    const target = parseForecastRoute('forecasts/avalanche/stevens-pass/2026-04-01', NOW)
    expect(forecastImageCacheControl(target, NOW)).toBe(SETTLED)
    const twoUtcDaysBack = parseForecastRoute('forecasts/avalanche/stevens-pass/2026-10-07', NOW)
    expect(forecastImageCacheControl(twoUtcDaysBack, NOW)).toBe(SETTLED)
  })

  it('keeps a day that may still be current on the short window', () => {
    // 2026-10-08 is "today" in Seattle at this instant.
    const recent = parseForecastRoute('forecasts/avalanche/stevens-pass/2026-10-08', NOW)
    expect(forecastImageCacheControl(recent, NOW)).toBe(LIVE)
  })

  it('keeps the live card and a rejected date on the short window', () => {
    expect(
      forecastImageCacheControl(parseForecastRoute('forecasts/avalanche/stevens-pass', NOW), NOW),
    ).toBe(LIVE)
    // A rejected date may become valid later; it must not pin the fallback card for long.
    expect(
      forecastImageCacheControl(
        parseForecastRoute('forecasts/avalanche/stevens-pass/2026-10-10', NOW),
        NOW,
      ),
    ).toBe(LIVE)
  })
})

describe('forecastImageSubtitle', () => {
  it('names the day on an archived card', () => {
    expect(forecastImageSubtitle('2026-04-01')).toBe('Avalanche Forecast · April 1, 2026')
  })

  it('stays plain on the live card', () => {
    expect(forecastImageSubtitle(null)).toBe('Avalanche Forecast')
  })
})
