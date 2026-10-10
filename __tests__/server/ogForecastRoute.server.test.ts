import {
  forecastCardText,
  forecastImageCacheControl,
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

describe('forecastCardText', () => {
  // Stevens Pass on 2026-04-01 as the v2 map layer returns it (`?day=2026-04-01`).
  const stevensPassApril1 = {
    end_date: '2026-04-02T01:30:00',
    timezone: 'America/Los_Angeles',
    travel_advice:
      'Generally safe avalanche conditions. Watch for unstable snow on isolated terrain features.',
  }

  it('leaves the live card as it was', () => {
    expect(forecastCardText(null, stevensPassApril1)).toEqual({
      banner: null,
      subtitle: 'Avalanche Forecast',
      advice: stevensPassApril1.travel_advice,
      mutedRating: false,
    })
  })

  it('marks an archived card as expired everywhere a reader looks', () => {
    expect(forecastCardText('2026-04-01', stevensPassApril1)).toEqual({
      banner: 'EXPIRED FORECAST — NOT CURRENT CONDITIONS',
      // The naive end_date is UTC: 01:30Z on Apr 2 is 6:30 PM Pacific on Apr 1.
      subtitle: 'Archived forecast · Expired Apr 1, 2026 6:30 PM PDT',
      advice: `That day: ${stevensPassApril1.travel_advice}`,
      mutedRating: true,
    })
  })

  it('falls back to the day when there is no usable expiry', () => {
    const subtitle = 'Archived forecast · April 1, 2026'
    expect(forecastCardText('2026-04-01', null).subtitle).toBe(subtitle)
    expect(forecastCardText('2026-04-01', { ...stevensPassApril1, end_date: null }).subtitle).toBe(
      subtitle,
    )
    expect(
      forecastCardText('2026-04-01', { ...stevensPassApril1, end_date: 'not a date' }).subtitle,
    ).toBe(subtitle)
  })

  it('has no advice line when the day had none', () => {
    expect(forecastCardText('2026-04-01', null).advice).toBeNull()
    expect(
      forecastCardText('2026-04-01', { ...stevensPassApril1, travel_advice: null }).advice,
    ).toBeNull()
  })
})
