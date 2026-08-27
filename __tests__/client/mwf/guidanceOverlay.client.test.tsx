// Guidance overlay interactions in the precip grid: click-to-fill, whole-
// column fill, the Prev reference, and the entered-matches-guidance
// highlight (entered zeros excluded).
import {
  applyGuidance,
  clearGuidanceOverlays,
  emptyForecast,
  type ForecastPoint,
  type MwfForecast,
  type SerializedForecast,
  type Zone,
} from '@/utilities/mwf/mwfData'
import { PrecipGrid } from '@/views/MwfEditor/sections'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

const ZONES: Zone[] = [{ id: 'olympics', name: 'Olympics' }]
const POINTS: ForecastPoint[] = [
  { code: 'HUR', name: 'Hurricane Ridge', zone: 'olympics', lat: 1, lng: 2 },
  { code: 'OLY2', name: 'Second Olympic', zone: 'olympics', lat: 1, lng: 2 },
]

function setup(prev?: Partial<SerializedForecast>) {
  const fc = emptyForecast(ZONES, POINTS, 'morning', new Date(2026, 7, 25))
  fc.meta.initialDate = '2026-08-25'
  fc.precip.HUR.d1.guidance = { WRF: 0.25 }
  fc.precip.OLY2.d1.guidance = { WRF: 0.4 }
  const mutate = (fn: (f: MwfForecast) => void) => fn(fc)
  render(
    <PrecipGrid
      forecast={fc}
      zones={ZONES}
      points={POINTS}
      extendedZones={[]}
      mutate={mutate}
      previousBody={prev ?? null}
      previousLabel={prev ? '2026-08-24 afternoon' : null}
    />,
  )
  return fc
}

describe('precip guidance overlay', () => {
  it('clicking a model chip fills that cell', () => {
    const fc = setup()
    fireEvent.click(screen.getAllByTitle('WRF: click to fill')[0])
    expect(fc.precip.HUR.d1.qpf).toBe(0.25)
  })

  it('clicking the column header fills every point from that model', () => {
    const fc = setup()
    fireEvent.click(screen.getByTitle("Fill every point's D1 QPF from WRF"))
    expect(fc.precip.HUR.d1.qpf).toBe(0.25)
    expect(fc.precip.OLY2.d1.qpf).toBe(0.4)
  })

  it('shows and fills from the Prev reference', () => {
    const prev: Partial<SerializedForecast> = {
      precip: { HUR: { d1: { qpf: 0.15, density: 10 } } },
    }
    const fc = setup(prev)
    fireEvent.click(screen.getByTitle('Prev: click to fill'))
    expect(fc.precip.HUR.d1.qpf).toBe(0.15)
  })

  it('highlights an entered value matching guidance, but never a zero', () => {
    const fc = setup()
    fc.precip.HUR.d1.qpf = 0.25
    fc.precip.OLY2.d1.qpf = 0
    fc.precip.OLY2.d1.guidance = { WRF: 0 }
    render(
      <PrecipGrid
        forecast={fc}
        zones={ZONES}
        points={POINTS}
        extendedZones={[]}
        mutate={(fn) => fn(fc)}
        previousBody={null}
        previousLabel={null}
      />,
    )
    const values = screen.getAllByTitle('WRF: click to fill')
    const matched = values.filter((c) => c.className.includes('mwf-guidance-val--matched'))
    expect(matched).toHaveLength(1)
    expect(matched[0]).toHaveTextContent('0.25')
  })
})

describe('clearGuidanceOverlays (re-poll wholesale replacement)', () => {
  it('clears every overlay map but leaves entered values alone', () => {
    const fc = emptyForecast(ZONES, POINTS, 'morning', new Date(2026, 7, 25))
    fc.precip.HUR.d1.qpf = 0.5
    fc.precip.HUR.d1.guidance = { WRF: 0.25, 'HRRR 3km': 0.3 }
    fc.temps.olympics.d1.guidance = { WRF: { high: 30, low: 20 } }
    fc.wind.olympics.am1.guidance = { WRF: { speed: 10, dir: 'SW' } }
    clearGuidanceOverlays(fc)
    expect(fc.precip.HUR.d1.guidance).toEqual({})
    expect(fc.temps.olympics.d1.guidance).toEqual({})
    expect(fc.wind.olympics.am1.guidance).toEqual({})
    expect(fc.precip.HUR.d1.qpf).toBe(0.5)
  })

  it('clear + re-apply drops a model that vanished from the fresh artifact', () => {
    const fc = emptyForecast(ZONES, POINTS, 'morning', new Date(2026, 7, 25))
    fc.precip.HUR.d1.guidance = { 'NBM ~5km': 0.3 }
    clearGuidanceOverlays(fc)
    applyGuidance(fc, { periods: [{ points: { HUR: { WRF: 0.25 } } }] })
    expect(fc.precip.HUR.d1.guidance).toEqual({ WRF: 0.25 })
  })
})
