import { avalancheCenterSchema } from '@/services/nac/types/schemas'
import snfacCenter from '../e2e/mocks/afp-golden/v2_public_center_SNFAC.json'
import aaicCenter from './fixtures/nac-center-aaic.json'
import cacCenter from './fixtures/nac-center-cac.json'
import ewyaixCenter from './fixtures/nac-center-ewyaix.json'
import nysacCenter from './fixtures/nac-center-nysac.json'

describe('avalancheCenterSchema', () => {
  it('parses a center registered without city or config (EWYAIX)', () => {
    const parsed = avalancheCenterSchema.safeParse(ewyaixCenter)

    expect(parsed.success).toBe(true)
    expect(parsed.data?.city).toBeNull()
    expect(parsed.data?.config).toBeNull()
    expect(parsed.data?.type).toBe('other')
  })

  it('parses a center without a url or full observation viewer config (NYSAC)', () => {
    const parsed = avalancheCenterSchema.safeParse(nysacCenter)

    expect(parsed.success).toBe(true)
    expect(parsed.data?.url).toBeNull()
  })

  it('parses a center with a partial config (CAC)', () => {
    const parsed = avalancheCenterSchema.safeParse(cacCenter)

    expect(parsed.success).toBe(true)
    expect(parsed.data?.config?.expires_time).toBe(0)
  })

  it('parses a center without an email or type (AAIC)', () => {
    const parsed = avalancheCenterSchema.safeParse(aaicCenter)

    expect(parsed.success).toBe(true)
    expect(parsed.data?.email).toBeNull()
    expect(parsed.data?.type).toBeNull()
  })

  it('still parses a fully configured center', () => {
    const parsed = avalancheCenterSchema.safeParse({
      ...ewyaixCenter,
      city: 'Seattle',
      type: 'usfs',
      config: {
        expires_time: 18,
        published_time: null,
        blog: true,
        blog_title: 'Blog',
        weather_table: [],
      },
    })

    expect(parsed.success).toBe(true)
    expect(parsed.data?.config?.published_time).toBe(0)
  })

  // Parsed on every page of the center's site, so a bad value in a field only native products
  // read must fall back rather than fail the parse.
  it('falls back on malformed native-only fields instead of failing', () => {
    const { widget_config: widgets, config } = snfacCenter
    const parsed = avalancheCenterSchema.safeParse({
      ...snfacCenter,
      config: {
        ...config,
        weather_table: [{ ...config.weather_table[0], forecast_point: { lat: '43.8', lng: 'x' } }],
      },
      widget_config: {
        ...widgets,
        forecast: { ...widgets.forecast, start_year: '2021' },
        danger_map: { ...widgets.danger_map, allCenters: 'yes', center: { lat: 'n', lng: 1 } },
        stations: { ...widgets.stations, source_marker_color: 1 },
      },
    })

    expect(parsed.success).toBe(true)
    expect(parsed.data?.config?.weather_table[0].forecast_point).toEqual({ lat: null, lng: null })
    expect(parsed.data?.widget_config.forecast?.start_year).toBeUndefined()
    expect(parsed.data?.widget_config.danger_map?.allCenters).toBeUndefined()
    expect(parsed.data?.widget_config.danger_map?.center).toEqual({ lat: null, lng: 1 })
    expect(parsed.data?.widget_config.stations?.source_marker_color).toBeUndefined()
  })
})
