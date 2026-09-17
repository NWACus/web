/**
 * What `MapMarker` hands to Mapbox.
 *
 * Mapbox stamps `role="img"` and `aria-label="Map marker"` on whatever element it is given, so the
 * only way to keep several hundred markers out of the accessibility tree is for that element to
 * arrive already hidden. A stub Marker captures it; the real one needs a live map.
 */
import type { Map as MapboxMap } from 'mapbox-gl'

const markerElements: HTMLElement[] = []

jest.mock('mapbox-gl', () => ({
  __esModule: true,
  default: {
    Marker: class {
      constructor({ element }: { element: HTMLElement }) {
        markerElements.push(element)
      }
      setLngLat() {
        return this
      }
      addTo() {
        return this
      }
      remove() {}
    },
  },
}))

import { MapMarker } from '@/components/stationMap/MapMarker'
import '@testing-library/jest-dom'
import { render, within } from '@testing-library/react'

// Only the identity matters: the mocked Marker never touches it.
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const map = {} as unknown as MapboxMap

describe('MapMarker', () => {
  beforeEach(() => {
    markerElements.length = 0
  })

  it('hands Mapbox an element that is hidden from assistive tech', () => {
    render(
      <MapMarker map={map} lngLat={[-121, 47]}>
        <button data-testid="marker-content">Paradise</button>
      </MapMarker>,
    )

    expect(markerElements).toHaveLength(1)
    expect(markerElements[0]).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders its children into that element', () => {
    render(
      <MapMarker map={map} lngLat={[-121, 47]}>
        <button data-testid="marker-content">Paradise</button>
      </MapMarker>,
    )

    expect(within(markerElements[0]).getByTestId('marker-content')).toHaveTextContent('Paradise')
  })

  it('raises only the selected marker above its neighbours', () => {
    const { rerender } = render(
      <MapMarker map={map} lngLat={[-121, 47]}>
        <span />
      </MapMarker>,
    )
    expect(markerElements[0].style.zIndex).toBe('')

    rerender(
      <MapMarker map={map} lngLat={[-121, 47]} raised>
        <span />
      </MapMarker>,
    )
    expect(markerElements[0].style.zIndex).toBe('1')
  })
})
