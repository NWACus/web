import {
  NO_RATING_STYLE,
  OFF_SEASON_STYLE,
  decorateZoneFeatures,
  featuresToFit,
  hasActiveWarning,
  popupDangerLevel,
  zoneBounds,
  zonePopup,
  zoneStyle,
} from '@/services/nac/dangerMap/dangerMapZones'
import { NO_RATING_ADVICE } from '@/services/nac/dangerScale'
import type { ZoneFeature, ZoneGeometry, ZoneProperties } from '@/services/nac/model/mapLayer'

/** A mid-winter Considerable zone — the ordinary case the map spends the season rendering. */
function zone(overrides: Partial<ZoneProperties> = {}): ZoneProperties {
  return {
    name: 'West Slopes Central',
    center: 'Northwest Avalanche Center',
    center_link: 'https://www.nwac.us/',
    timezone: 'America/Los_Angeles',
    center_id: 'NWAC',
    state: 'WA',
    off_season: false,
    travel_advice: 'Careful snowpack evaluation is essential.',
    danger: 'considerable',
    danger_level: 3,
    color: '#f7941e',
    stroke: '#104efb',
    font_color: '#ffffff',
    link: 'http://www.nwac.us/avalanche-forecast/#/west-slopes-central',
    start_date: '2026-01-14T01:30:00',
    end_date: '2026-01-15T01:30:00',
    warning: { product: null },
    ...overrides,
  }
}

describe('zoneStyle', () => {
  it('paints a rated zone in the colors the server supplied', () => {
    expect(zoneStyle(zone())).toEqual({
      fillColor: '#f7941e',
      fillOpacity: 0.6,
      strokeColor: '#104efb',
    })
  })

  // The widget ignores the API's fillOpacity: 0.5 and darkens Extreme so the worst rating reads
  // as the worst rating. avy uses the API value instead; we follow the widget.
  it('darkens an extreme zone past the standard fill opacity', () => {
    expect(zoneStyle(zone({ danger: 'extreme', danger_level: 5, color: '#231f20' }))).toEqual({
      fillColor: '#231f20',
      fillOpacity: 0.8,
      strokeColor: '#104efb',
    })
  })

  it('paints an unrated zone in the no-rating blue, not the server color', () => {
    expect(zoneStyle(zone({ danger: 'no rating', danger_level: -1, color: '#888888' }))).toEqual(
      NO_RATING_STYLE,
    )
  })

  // Off-season beats everything, including a stale rating still sitting in the response.
  it('paints an off-season zone faint grey even when a rating is present', () => {
    expect(zoneStyle(zone({ off_season: true, danger: 'considerable', danger_level: 3 }))).toEqual(
      OFF_SEASON_STYLE,
    )
  })

  it('paints an off-season zone faint grey even at extreme danger', () => {
    expect(zoneStyle(zone({ off_season: true, danger: 'extreme', danger_level: 5 }))).toEqual(
      OFF_SEASON_STYLE,
    )
  })

  it('matches the danger string regardless of case or padding', () => {
    expect(zoneStyle(zone({ danger: 'No Rating' }))).toEqual(NO_RATING_STYLE)
    expect(zoneStyle(zone({ danger: ' EXTREME ' })).fillOpacity).toBe(0.8)
  })

  it('falls back to the no-rating colors when the server sent no color at all', () => {
    const style = zoneStyle(zone({ color: null, stroke: null }))

    expect(style.fillColor).toBe(NO_RATING_STYLE.fillColor)
    expect(style.strokeColor).toBe(NO_RATING_STYLE.strokeColor)
  })
})

describe('decorateZoneFeatures', () => {
  const feature = (properties: Partial<ZoneProperties>, id: number): ZoneFeature => ({
    type: 'Feature',
    id,
    geometry: { type: 'Polygon', coordinates: [] },
    properties: zone(properties),
  })

  it('bakes each zone style into its own feature', () => {
    const [rated, offSeason] = decorateZoneFeatures([
      feature({}, 1655),
      feature({ off_season: true }, 1654),
    ])

    expect(rated.properties).toMatchObject({ fillColor: '#f7941e', fillOpacity: 0.6 })
    expect(offSeason.properties).toMatchObject(OFF_SEASON_STYLE)
  })

  // setFeatureState keys on the top-level feature id, so losing it would silently break
  // hover highlighting and the warning flash.
  it('preserves the feature id and geometry', () => {
    const [decorated] = decorateZoneFeatures([feature({}, 1655)])

    expect(decorated.id).toBe(1655)
    expect(decorated.geometry).toEqual({ type: 'Polygon', coordinates: [] })
  })

  it('carries the warning flag through so paint can drive the flash', () => {
    const [plain, warned] = decorateZoneFeatures([
      feature({}, 1),
      feature({ warning: { product: 'warning' } }, 2),
    ])

    expect(plain.properties.hasWarning).toBe(false)
    expect(warned.properties.hasWarning).toBe(true)
  })
})

describe('hasActiveWarning', () => {
  it('is true when the map layer carries a warning product', () => {
    expect(hasActiveWarning(zone({ warning: { product: 'warning' } }))).toBe(true)
  })

  it('is false when no warning product is attached', () => {
    expect(hasActiveWarning(zone({ warning: { product: null } }))).toBe(false)
  })
})

describe('popupDangerLevel', () => {
  it('uses the zone rating when the forecast is live', () => {
    expect(popupDangerLevel(zone())).toBe(3)
  })

  it.each([
    ['the rating is the no-rating sentinel', { danger_level: -1 }],
    ['there is no validity window', { end_date: null }],
  ])('falls back to No Rating when %s', (_case, overrides) => {
    expect(popupDangerLevel(zone(overrides))).toBe(0)
  })
})

describe('zonePopup', () => {
  const settings = { advice: true, allCenters: false, centerId: 'NWAC' }

  it('headlines a rated zone with the numbered danger level', () => {
    const popup = zonePopup(zone(), settings)

    expect(popup.headline).toBe('3 - Considerable')
    expect(popup.subhead).toBe('Avalanche Danger')
    expect(popup.zoneName).toBe('West Slopes Central')
    expect(popup.href).toBe('/forecasts/avalanche/west-slopes-central')
  })

  it('headlines an unrated zone as information rather than danger', () => {
    const popup = zonePopup(zone({ danger: 'no rating', danger_level: -1 }), settings)

    expect(popup.headline).toBe('No Rating')
    expect(popup.subhead).toBe('Information Available')
    expect(popup.advice).toBe(NO_RATING_ADVICE)
  })

  // Off-season suppresses the whole danger framing: no rating, no validity window, no advice.
  it('replaces the whole danger framing off-season', () => {
    const popup = zonePopup(zone({ off_season: true }), settings)

    expect(popup.offSeason).toBe(true)
    expect(popup.headline).toBe('Forecasts ended for the season')
    expect(popup.subhead).toBeNull()
    expect(popup.publishedText).toBeNull()
    expect(popup.expiresText).toBeNull()
    expect(popup.advice).toBeNull()
  })

  it('flags an active warning', () => {
    expect(zonePopup(zone({ warning: { product: 'warning' } }), settings).hasWarning).toBe(true)
  })

  describe('travel advice', () => {
    // The widget renders the danger scale's advice for the zone's rating, not the API's
    // per-zone travel_advice string. Matching that keeps the two surfaces reading identically.
    it('comes from the danger scale, not the per-zone travel_advice', () => {
      const popup = zonePopup(zone({ travel_advice: 'Something else entirely.' }), settings)

      expect(popup.advice).toContain('Dangerous avalanche conditions.')
      expect(popup.advice).not.toContain('Something else entirely.')
    })

    it('is omitted when the center turned advice off', () => {
      expect(
        zonePopup(zone(), { advice: false, allCenters: false, centerId: 'NWAC' }).advice,
      ).toBeNull()
    })
  })

  describe('the validity window', () => {
    // The map layer sends naive timestamps that are actually UTC. Reading them as local time
    // would shift every published/expires line by the viewer's offset.
    it('reads the naive timestamps as UTC and renders them in the zone timezone', () => {
      const popup = zonePopup(zone(), settings)

      expect(popup.publishedText).toBe('Tuesday, 1/13 5:30PM')
      expect(popup.expiresText).toBe('Wednesday, 1/14 5:30PM')
    })

    it('handles a timestamp that already carries an offset', () => {
      const popup = zonePopup(zone({ start_date: '2026-01-14T01:30:00+00:00' }), settings)

      expect(popup.publishedText).toBe('Tuesday, 1/13 5:30PM')
    })

    it('omits the window when the zone has no dates', () => {
      const popup = zonePopup(zone({ start_date: null, end_date: null }), settings)

      expect(popup.publishedText).toBeNull()
      expect(popup.expiresText).toBeNull()
    })

    it('falls back to UTC when the zone has no timezone', () => {
      const popup = zonePopup(zone({ timezone: null }), settings)

      expect(popup.publishedText).toBe('Wednesday, 1/14 1:30AM')
    })
  })

  describe('the center name', () => {
    it('is shown when the map is drawing every center', () => {
      const popup = zonePopup(zone(), { advice: true, allCenters: true, centerId: 'NWAC' })

      expect(popup.centerName).toBe('Northwest Avalanche Center')
    })

    it('is hidden on a single-center map, where it would be the same on every zone', () => {
      expect(zonePopup(zone(), settings).centerName).toBeNull()
    })
  })
})

describe('zoneBounds', () => {
  const withGeometry = (geometry: ZoneGeometry | null): ZoneFeature => ({
    type: 'Feature',
    id: 1,
    geometry,
    properties: zone(),
  })

  const polygon = (ring: [number, number][]): ZoneGeometry => ({
    type: 'Polygon',
    coordinates: [ring],
  })

  it('bounds a single polygon', () => {
    const bounds = zoneBounds([
      withGeometry(
        polygon([
          [-121.5, 47.1],
          [-120.5, 47.9],
          [-121.0, 47.5],
        ]),
      ),
    ])

    expect(bounds).toEqual([
      [-121.5, 47.1],
      [-120.5, 47.9],
    ])
  })

  it('spans every zone on the map', () => {
    const bounds = zoneBounds([
      withGeometry(
        polygon([
          [-121.5, 47.1],
          [-121.0, 47.5],
        ]),
      ),
      withGeometry(
        polygon([
          [-118.0, 44.0],
          [-117.5, 44.5],
        ]),
      ),
    ])

    expect(bounds).toEqual([
      [-121.5, 44.0],
      [-117.5, 47.5],
    ])
  })

  // MultiPolygon nests one level deeper than Polygon, and the map layer returns both.
  it('bounds a MultiPolygon as well as a Polygon', () => {
    const bounds = zoneBounds([
      withGeometry({
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [-121.5, 47.1],
              [-121.0, 47.5],
            ],
          ],
          [
            [
              [-120.0, 48.0],
              [-119.5, 48.5],
            ],
          ],
        ],
      }),
    ])

    expect(bounds).toEqual([
      [-121.5, 47.1],
      [-119.5, 48.5],
    ])
  })

  it.each([
    ['no features', []],
    ['a feature with no geometry', [withGeometry(null)]],
    ['a feature with empty coordinates', [withGeometry({ type: 'Polygon', coordinates: [] })]],
  ])('reports no bounds for %s', (_case, features) => {
    expect(zoneBounds(features)).toBeNull()
  })
})

describe('zonePopup — where a zone links to', () => {
  const settings = { advice: true, allCenters: true, centerId: 'NWAC' }

  // Upstream always hands back the center's own website. On AvyWeb that would walk the reader off
  // the site and past the native forecast page, so our own zones are rewritten to their route.
  it("sends this center's zones to their AvyWeb forecast page", () => {
    const popup = zonePopup(zone(), settings)

    expect(popup.href).toBe('/forecasts/avalanche/west-slopes-central')
    expect(popup.isExternal).toBe(false)
  })

  it("keeps another center's zone pointing at that center's own site", () => {
    const popup = zonePopup(
      zone({ center_id: 'SNFAC', link: 'https://www.sawtoothavalanche.com/forecast/#/banner' }),
      settings,
    )

    expect(popup.href).toBe('https://www.sawtoothavalanche.com/forecast/#/banner')
    expect(popup.isExternal).toBe(true)
  })

  it('has no link at all when upstream sent none', () => {
    const popup = zonePopup(zone({ link: null }), settings)

    expect(popup.href).toBeNull()
    expect(popup.isExternal).toBe(false)
  })

  // A link with nothing after the last slash yields no slug, so there is no native route to use.
  it('falls back to the external link when the url carries no slug', () => {
    const popup = zonePopup(zone({ link: 'https://www.nwac.us/' }), settings)

    expect(popup.href).toBe('https://www.nwac.us/')
    expect(popup.isExternal).toBe(true)
  })
})

describe('featuresToFit', () => {
  const owned = (centerId: string): ZoneFeature => ({
    type: 'Feature',
    id: centerId,
    geometry: null,
    properties: zone({ center_id: centerId }),
  })

  it('narrows an all-centers map to this center, so a reader lands on their own zones', () => {
    const features = [owned('NWAC'), owned('SNFAC'), owned('NWAC')]

    expect(featuresToFit({ features }, 'NWAC')).toEqual([features[0], features[2]])
  })

  it('falls back to every zone when none belongs to this center', () => {
    const features = [owned('SNFAC'), owned('SAC')]

    expect(featuresToFit({ features }, 'NWAC')).toEqual(features)
  })

  it('treats not-yet-loaded zones as nothing to fit rather than throwing', () => {
    expect(featuresToFit(null, 'NWAC')).toEqual([])
  })
})
