import {
  DANGER_MAP_DEFAULTS,
  mapboxZoomFor,
  resolveDangerMapSettings,
} from '@/services/nac/dangerMap/dangerMapSettings'

describe('resolveDangerMapSettings', () => {
  it('falls back to every default when the center has no danger_map config', () => {
    expect(resolveDangerMapSettings(undefined)).toEqual(DANGER_MAP_DEFAULTS)
  })

  it('defaults each control to off when the config omits it', () => {
    const settings = resolveDangerMapSettings({ height: 500 })

    expect(settings.search).toBe(false)
    expect(settings.geolocate).toBe(false)
    expect(settings.advice).toBe(false)
    expect(settings.allCenters).toBe(false)
  })

  describe('height', () => {
    it('parses the string height the API returns', () => {
      expect(resolveDangerMapSettings({ height: '650' }).height).toBe(650)
    })

    it('accepts a numeric height', () => {
      expect(resolveDangerMapSettings({ height: 400 }).height).toBe(400)
    })

    it.each([
      ['below the floor', 100, 300],
      ['above the ceiling', 5000, 1000],
    ])('clamps a height %s', (_case, given, expected) => {
      expect(resolveDangerMapSettings({ height: given }).height).toBe(expected)
    })

    it('rounds a fractional height to whole pixels', () => {
      expect(resolveDangerMapSettings({ height: 512.4 }).height).toBe(512)
    })

    it('falls back to the default when the height is unparseable', () => {
      expect(resolveDangerMapSettings({ height: 'tall' }).height).toBe(DANGER_MAP_DEFAULTS.height)
    })
  })

  describe('viewport', () => {
    it('reads the configured center and zoom', () => {
      const settings = resolveDangerMapSettings({
        height: 650,
        center: { lat: 47.4541, lng: -121.7691 },
        zoom: 7,
      })

      expect(settings.center).toEqual({ lat: 47.4541, lng: -121.7691 })
      expect(settings.zoom).toBe(7)
    })

    // The map falls back to fitting the center's own zones when there is no configured viewport,
    // so "unset" has to be distinguishable from a real coordinate — hence null rather than 0/0.
    it('reports no center when the config has none', () => {
      expect(resolveDangerMapSettings({ height: 500 }).center).toBeNull()
    })

    it.each([
      ['both coordinates null', { lat: null, lng: null }],
      ['only a latitude', { lat: 47.4541, lng: null }],
      ['only a longitude', { lat: null, lng: -121.7691 }],
      ['an empty object', {}],
    ])('reports no center given %s', (_case, center) => {
      expect(resolveDangerMapSettings({ height: 500, center }).center).toBeNull()
    })

    it('defaults the zoom when the config omits it', () => {
      expect(resolveDangerMapSettings({ height: 500 }).zoom).toBe(DANGER_MAP_DEFAULTS.zoom)
    })
  })

  describe('the live tenant configurations', () => {
    it('resolves NWAC', () => {
      expect(
        resolveDangerMapSettings({
          height: '650',
          saturation: -100,
          search: true,
          geolocate: true,
          advice: true,
          center: { lat: 47.454188397509135, lng: -121.769123046875 },
          zoom: 7,
        }),
      ).toEqual({
        height: 650,
        search: true,
        geolocate: true,
        advice: true,
        // NWAC's config predates the setting, so it takes the dashboard's default.
        allCenters: false,
        center: { lat: 47.454188397509135, lng: -121.769123046875 },
        zoom: 7,
      })
    })

    it('resolves SAC, whose forecasters turned the search box off', () => {
      const settings = resolveDangerMapSettings({
        height: '450',
        saturation: -100,
        search: false,
        geolocate: true,
        advice: true,
        center: { lat: 39.1242, lng: -120.119 },
        zoom: 8,
        allCenters: true,
      })

      expect(settings.search).toBe(false)
      expect(settings.allCenters).toBe(true)
      expect(settings.height).toBe(450)
    })
  })
})

describe('mapboxZoomFor', () => {
  // Configured zooms were chosen against the Google-tiled widget (256px tiles); Mapbox GL uses
  // 512px tiles, so the same number renders one level tighter.
  it.each([
    ['NWAC', 7, 6],
    ['SAC and SNFAC', 8, 7],
    ['the dashboard default', DANGER_MAP_DEFAULTS.zoom, 7],
  ])('maps %s zoom %i to Mapbox %i', (_case, configured, expected) => {
    expect(mapboxZoomFor(configured)).toBe(expected)
  })
})
