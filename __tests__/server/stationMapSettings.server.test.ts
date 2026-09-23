import {
  STATION_MAP_DEFAULTS,
  resolveStationMapSettings,
} from '@/services/snowobs/stationMap/settings'

describe('resolveStationMapSettings', () => {
  it('falls back to every default when the center has no stations config', () => {
    expect(resolveStationMapSettings(undefined)).toEqual(STATION_MAP_DEFAULTS)
  })

  it('reads the viewport and converts the zoom to Mapbox tile scale', () => {
    const settings = resolveStationMapSettings({ center: { lat: 47.07, lng: -121.84 }, zoom: 7 })
    expect(settings.center).toEqual({ lat: 47.07, lng: -121.84 })
    expect(settings.zoom).toBe(6)
  })

  it('falls back per coordinate when one is unset', () => {
    const settings = resolveStationMapSettings({ center: { lat: null, lng: -121 } })
    expect(settings.center).toEqual({ lat: STATION_MAP_DEFAULTS.center.lat, lng: -121 })
  })

  it('accepts within as a string or a number, and rejects a value the dashboard would not offer', () => {
    expect(resolveStationMapSettings({ within: '60' }).within).toBe(60)
    expect(resolveStationMapSettings({ within: 1440 }).within).toBe(1440)
    expect(resolveStationMapSettings({ within: 42 }).within).toBe(180)
    expect(resolveStationMapSettings({ within: 'soon' }).within).toBe(180)
  })

  it('defaults the legend off and marker colors on', () => {
    const settings = resolveStationMapSettings({})
    expect(settings.sourceLegend).toBe(false)
    expect(settings.sourceMarkerColor).toBe(true)
  })

  it('honors an explicit marker-color off', () => {
    expect(resolveStationMapSettings({ source_marker_color: false }).sourceMarkerColor).toBe(false)
    expect(resolveStationMapSettings({ source_legend: true }).sourceLegend).toBe(true)
  })

  it('surfaces alternate zones without honoring them', () => {
    expect(
      resolveStationMapSettings({ alternate_zones: 'https://x/zones.kml' }).alternateZones,
    ).toBe('https://x/zones.kml')
    expect(resolveStationMapSettings({ alternate_zones: null }).alternateZones).toBeNull()
    expect(resolveStationMapSettings({ alternate_zones: '' }).alternateZones).toBeNull()
  })
})
