/**
 * Shared danger-map zone fixtures. Lives outside `__tests__/client` and `__tests__/server` so
 * both jest projects can import it without jest collecting it as a suite.
 */
import type { ZoneFeature, ZoneProperties } from '@/services/nac/model/mapLayer'

/** A mid-winter Considerable zone — the ordinary case the map spends the season rendering. */
export function zone(overrides: Partial<ZoneProperties> = {}): ZoneProperties {
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

/**
 * A zone as the map layer returns it for the Eastern Wyoming Avalanche Info Exchange (captured
 * 2026-09-10): unrated, undated, linked to the exchange's own site rather than a forecast.
 */
export function exchangeZone(overrides: Partial<ZoneProperties> = {}): ZoneProperties {
  return zone({
    name: 'Big Horns',
    center: 'Eastern Wyoming Avalanche Info Exchange',
    center_link: 'https://ewyoavalanche.org',
    timezone: 'America/Denver',
    center_id: 'EWYAIX',
    state: 'WY',
    danger: 'no rating',
    danger_level: -1,
    color: '#888888',
    link: 'https://ewyoavalanche.org',
    start_date: null,
    end_date: null,
    ...overrides,
  })
}

/** Wrap zone properties as a map-layer feature with a stable id and no geometry. */
export function zoneFeature(properties: ZoneProperties, id: number): ZoneFeature {
  return { type: 'Feature', id, geometry: null, properties }
}
