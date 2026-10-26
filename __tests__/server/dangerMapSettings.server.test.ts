import { mapboxZoomFor, resolveDangerMapSettings } from '@/services/nac/dangerMap/dangerMapSettings'

describe('resolveDangerMapSettings', () => {
  it('shows only this center’s zones when the center has no danger_map config', () => {
    expect(resolveDangerMapSettings(undefined)).toEqual({ allCenters: false })
  })

  it('reads the all-centers setting', () => {
    expect(resolveDangerMapSettings({ height: 450, allCenters: true })).toEqual({
      allCenters: true,
    })
  })

  // The widget ignores every other dashboard field, so a center's search/geolocate/advice toggles
  // and its configured viewport must not leak into the native map either.
  it('ignores the fields the widget ignores', () => {
    expect(
      resolveDangerMapSettings({
        height: '450',
        saturation: -100,
        search: false,
        geolocate: false,
        advice: false,
        center: { lat: 39.1242, lng: -120.119 },
        zoom: 8,
      }),
    ).toEqual({ allCenters: false })
  })
})

describe('mapboxZoomFor', () => {
  // Configured zooms were chosen against Google's 256px tiles; Mapbox GL uses 512px tiles, so the
  // same number renders one level tighter.
  it.each([
    [7, 6],
    [9, 8],
  ])('maps configured zoom %i to Mapbox %i', (configured, expected) => {
    expect(mapboxZoomFor(configured)).toBe(expected)
  })
})
