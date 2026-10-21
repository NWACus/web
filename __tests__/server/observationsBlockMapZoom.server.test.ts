import { observationsBlockMapZoom } from '@/blocks/ObservationsWidget/mapZoom'

const observationViewer = { alternate_zones: null, color: '', saturation: 0 }

describe('observationsBlockMapZoom', () => {
  it('zooms out from the observation viewer zoom', () => {
    const zoom = observationsBlockMapZoom({
      observation_viewer: { ...observationViewer, map_zoom: 7.8 },
      danger_map: { height: 500, zoom: 8 },
    })
    expect(zoom).toBeCloseTo(7.3)
  })

  it('falls back to the danger map zoom less one, as the widget does', () => {
    const zoom = observationsBlockMapZoom({
      observation_viewer: observationViewer,
      danger_map: { height: 500, zoom: 8 },
    })
    expect(zoom).toBeCloseTo(6.5)
  })

  it('leaves the zoom to the widget when AFP has none', () => {
    expect(observationsBlockMapZoom({ observation_viewer: observationViewer })).toBeUndefined()
    expect(observationsBlockMapZoom(undefined)).toBeUndefined()
  })
})
