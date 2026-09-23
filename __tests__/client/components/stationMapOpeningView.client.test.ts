/**
 * Where the station map opens, and what its reset control returns to.
 *
 * Forecasters set the viewport in the NAC dashboard against the widget's desktop embed, so the
 * case that has to give is the small one: a map too short or too narrow for the configured zoom
 * frames the center's zones instead. A stub map answers `cameraForBounds` and records the camera
 * moves; the real one needs a canvas.
 */
import type { Map as MapboxMap } from 'mapbox-gl'

jest.mock('mapbox-gl', () => ({ __esModule: true, default: {} }))

import { AUTOMATED_MOVE, goToOpeningView } from '@/components/stationMap/useStationMap'
import { useOpeningView, useZones } from '@/components/stationMap/useStationMapState'
import type { StationMapData } from '@/services/snowobs/stationMap/model'
import type { StationMapSettings } from '@/services/snowobs/stationMap/settings'
import type { Bounds } from '@/utilities/geo/bounds'
import { renderHook } from '@testing-library/react'

const SETTINGS: StationMapSettings = {
  center: { lat: 39.05, lng: -120.2 },
  zoom: 8,
  within: 180,
  sourceLegend: false,
  sourceMarkerColor: true,
  alternateZones: null,
}

/** Roughly SAC's single forecast zone, and the box around it. */
const ZONE: StationMapData['outlines'][number] = {
  name: 'Central Sierra Nevada',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [-120.6, 38.46],
        [-119.76, 38.46],
        [-119.76, 39.63],
        [-120.6, 39.63],
        [-120.6, 38.46],
      ],
    ],
  },
}
const ZONE_BOUNDS: Bounds = [
  [-120.6, 38.46],
  [-119.76, 39.63],
]

const NO_ZONES: Pick<StationMapData, 'zones' | 'outlines'> = { zones: [], outlines: [] }
const ZONES: Pick<StationMapData, 'zones' | 'outlines'> = { zones: [ZONE], outlines: [ZONE] }

interface Moves {
  fitBounds: { bounds: unknown; options: unknown; eventData: unknown }[]
  flyTo: { options: unknown; eventData: unknown }[]
}

/**
 * A map that answers `cameraForBounds` with `fitZoom` — the highest zoom its size can hold the
 * zones at — and records where it is asked to go. `undefined` is Mapbox's "nothing frames these".
 */
function stubMap(fitZoom: number | undefined): { map: MapboxMap; moves: Moves } {
  const moves: Moves = { fitBounds: [], flyTo: [] }
  const map = {
    cameraForBounds: () => (fitZoom === undefined ? undefined : { zoom: fitZoom }),
    fitBounds: (bounds: unknown, options: unknown, eventData: unknown) =>
      moves.fitBounds.push({ bounds, options, eventData }),
    flyTo: (options: unknown, eventData: unknown) => moves.flyTo.push({ options, eventData }),
  }
  // Only these three calls are made; the rest of a live map has nothing to do with the decision.
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return { map: map as unknown as MapboxMap, moves }
}

describe('goToOpeningView', () => {
  it('frames the zones when the map is too small for the configured zoom', () => {
    const { map, moves } = stubMap(7.5)

    goToOpeningView(map, SETTINGS, ZONE_BOUNDS, false)

    expect(moves.flyTo).toEqual([])
    expect(moves.fitBounds).toEqual([
      { bounds: ZONE_BOUNDS, options: { padding: 20, animate: false }, eventData: AUTOMATED_MOVE },
    ])
  })

  it('keeps the configured view when the map is big enough to hold the zones', () => {
    const { map, moves } = stubMap(8.4)

    goToOpeningView(map, SETTINGS, ZONE_BOUNDS, true)

    expect(moves.fitBounds).toEqual([])
    // Tagged, so the `moveend` it fires isn't saved as a viewport the reader chose.
    expect(moves.flyTo).toEqual([
      { options: { center: [-120.2, 39.05], zoom: 8, animate: true }, eventData: AUTOMATED_MOVE },
    ])
  })

  it('keeps the configured view before the zones have arrived', () => {
    const { map, moves } = stubMap(7.5)

    goToOpeningView(map, SETTINGS, null, false)

    expect(moves.fitBounds).toEqual([])
    expect(moves.flyTo).toHaveLength(1)
  })

  // Mapbox returns no camera for a box it can't frame at all — a map with no size yet, say.
  it('keeps the configured view when nothing frames the zones', () => {
    const { map, moves } = stubMap(undefined)

    goToOpeningView(map, SETTINGS, ZONE_BOUNDS, false)

    expect(moves.fitBounds).toEqual([])
    expect(moves.flyTo).toHaveLength(1)
  })
})

describe('useOpeningView', () => {
  /** jsdom starts every test at the same URL; the map only ever uses `replaceState`. */
  function atUrl(search: string) {
    window.history.replaceState(null, '', `/weather/stations/map${search}`)
  }

  it('opens at the viewport the link pinned', () => {
    atUrl('?at=39.0000,-120.0000,11.00')

    const { result } = renderHook(() => useOpeningView(SETTINGS))

    expect(result.current.view).toEqual({ center: { lat: 39, lng: -120 }, zoom: 11 })
    expect(result.current.pinned).toBe(true)
  })

  // Only a starting point: with nothing pinned, the zones re-frame it once they arrive.
  it('opens at the configured view when the link pinned nothing', () => {
    atUrl('')

    const { result } = renderHook(() => useOpeningView(SETTINGS))

    expect(result.current.view).toEqual({ center: SETTINGS.center, zoom: SETTINGS.zoom })
    expect(result.current.pinned).toBe(false)
  })
})

describe('useZones', () => {
  /** `unpin` records that reset takes the viewport back out of the link. */
  function opening(pinned: boolean) {
    const unpin = jest.fn()
    return { pinned, unpin }
  }

  /** The map is built before the zones are fetched, so the opening frame waits for them. */
  it('frames the zones when they arrive on a visit whose link pinned nothing', () => {
    const { map, moves } = stubMap(7.5)

    const { rerender } = renderHook(
      ({ view }) => useZones(map, false, view, [], SETTINGS, opening(false)),
      { initialProps: { view: NO_ZONES } },
    )
    expect(moves.fitBounds).toEqual([])

    rerender({ view: ZONES })

    expect(moves.fitBounds).toHaveLength(1)
  })

  it('leaves a pinned viewport alone', () => {
    const { map, moves } = stubMap(7.5)

    const { rerender } = renderHook(
      ({ view }) => useZones(map, false, view, [], SETTINGS, opening(true)),
      { initialProps: { view: NO_ZONES } },
    )
    rerender({ view: ZONES })

    expect(moves.fitBounds).toEqual([])
    expect(moves.flyTo).toEqual([])
  })

  // A `?zone=` link is framed by the zone filter, which is tighter than the whole center.
  it('defers to a chosen zone, and does not remember its frame', () => {
    const { map, moves } = stubMap(7.5)

    const { rerender } = renderHook(
      ({ view }) => useZones(map, false, view, ['Central Sierra Nevada'], SETTINGS, opening(false)),
      { initialProps: { view: NO_ZONES } },
    )
    rerender({ view: ZONES })

    // One fit, from the zone filter, and it frames the chosen zone rather than the opening view.
    expect(moves.fitBounds).toHaveLength(1)
    expect(moves.flyTo).toEqual([])
    // Tagged, so the zone's frame is never written to the link as a viewport the reader chose.
    expect(moves.fitBounds[0].eventData).toBe(AUTOMATED_MOVE)
  })

  it('takes the viewport back out of the link when the map is reset', () => {
    const { map } = stubMap(7.5)
    const link = opening(true)

    const { result } = renderHook(() => useZones(map, false, ZONES, [], SETTINGS, link))
    result.current(true)

    expect(link.unpin).toHaveBeenCalled()
  })
})
