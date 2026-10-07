/**
 * The widget's two-click marker: the first click selects, the second opens. Opening goes to a new
 * tab, as the card's buttons do, so the map and its selection stay put.
 */
jest.mock('mapbox-gl', () => ({ __esModule: true, default: {} }))
jest.mock('../../../src/utilities/useAnalytics', () => ({
  useAnalytics: () => ({ captureWithTenant: jest.fn() }),
}))

import { usePointInteractions } from '@/components/stationMap/usePointInteractions'
import type { MapPoint } from '@/services/snowobs/stationMap/filters'
import { renderHook } from '@testing-library/react'

const STATION: MapPoint = {
  kind: 'station',
  id: 'station-502',
  station: {
    stid: '502',
    name: 'Green Lake',
    source: 'snotel',
    coordinates: [-121.17, 46.55],
    elevation: 5920,
    observedAt: null,
    data: {},
    zone: 'Other',
    href: '/weather/stations/station/snotel/502',
    areaHref: null,
  },
}

function interactions(selectedId: string | null) {
  const setSelectedId = jest.fn()
  const { result } = renderHook(() =>
    usePointInteractions({
      map: null,
      wrapperRef: { current: null },
      selection: { selectedId, setSelectedId, clear: jest.fn() },
      track: jest.fn(),
    }),
  )
  return { ...result.current, setSelectedId }
}

let openSpy: jest.SpyInstance

beforeEach(() => {
  openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
})

afterEach(() => openSpy.mockRestore())

describe('usePointInteractions', () => {
  it('selects a marker on the first click, without leaving the map', () => {
    const { clickPoint, setSelectedId } = interactions(null)
    clickPoint(STATION)
    expect(setSelectedId).toHaveBeenCalledWith('station-502')
    expect(openSpy).not.toHaveBeenCalled()
  })

  it("opens the selected station's page in a new tab on the second click", () => {
    const { clickPoint } = interactions('station-502')
    clickPoint(STATION)
    expect(openSpy).toHaveBeenCalledWith(
      '/weather/stations/station/snotel/502',
      '_blank',
      'noopener',
    )
  })

  it('does nothing on a second click on a webcam with images, whose card shows them', () => {
    const webcam: MapPoint = {
      kind: 'webcam',
      id: 'webcam-1',
      webcam: {
        id: 1,
        title: 'Dirtyface cam',
        coordinates: [-121, 48],
        zone: 'Other',
        images: [{ id: 1, title: 'North', type: 'image', source: 'https://example.com/n.jpg' }],
      },
    }
    const { clickPoint } = interactions('webcam-1')
    clickPoint(webcam)
    expect(openSpy).not.toHaveBeenCalled()
  })
})
