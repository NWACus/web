// Section-level behaviors: derived snow display, the live high-below-low
// flag, and the QPF-driven snow/freezing designation with manual override.
import {
  emptyForecast,
  type ForecastPoint,
  type MwfForecast,
  type Zone,
} from '@/utilities/mwf/mwfData'
import { PrecipGrid, SnowLevelTable, TempTable } from '@/views/MwfEditor/sections'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

const ZONES: Zone[] = [{ id: 'olympics', name: 'Olympics' }]
const POINTS: ForecastPoint[] = [
  { code: 'HUR', name: 'Hurricane Ridge', zone: 'olympics', lat: 47.9, lng: -123.4 },
]

function makeForecast(): MwfForecast {
  const fc = emptyForecast(ZONES, POINTS, 'morning', new Date(2026, 7, 25))
  fc.meta.initialDate = '2026-08-25'
  return fc
}

function renderWithMutate(
  ui: (props: {
    forecast: MwfForecast
    zones: Zone[]
    points: ForecastPoint[]
    extendedZones: Zone[]
    mutate: (fn: (fc: MwfForecast) => void) => void
  }) => React.ReactElement,
  fc: MwfForecast,
) {
  const mutations: Array<(f: MwfForecast) => void> = []
  const mutate = (fn: (f: MwfForecast) => void) => {
    mutations.push(fn)
    fn(fc)
  }
  const view = render(ui({ forecast: fc, zones: ZONES, points: POINTS, extendedZones: [], mutate }))
  return { view, mutations, fc }
}

describe('PrecipGrid', () => {
  it('derives snow from QPF and density, read-only on the Snow view', () => {
    const fc = makeForecast()
    fc.precip.HUR.d1.qpf = 0.5
    fc.precip.HUR.d1.density = 10
    renderWithMutate((p) => <PrecipGrid {...p} />, fc)
    fireEvent.click(screen.getByRole('button', { name: 'Snow' }))
    // 0.5" QPF at 10:1 → 5.0" snow; no inputs on the derived view.
    expect(screen.getAllByText('5.0').length).toBeGreaterThan(0)
    expect(screen.queryByLabelText('HUR D1 QPF')).not.toBeInTheDocument()
  })

  it('the Density view carries the SLR inputs and quick-sets', () => {
    const fc = makeForecast()
    renderWithMutate((p) => <PrecipGrid {...p} />, fc)
    fireEvent.click(screen.getByRole('button', { name: 'Density' }))
    expect(screen.getByLabelText('HUR D1 density')).toBeInTheDocument()
    fireEvent.click(screen.getByTitle("Set every point's D1 SLR to 10"))
    expect(fc.precip.HUR.d1.density).toBe(10)
  })

  it('flags over-precise QPF entries', () => {
    const fc = makeForecast()
    fc.precip.HUR.d1.qpf = 0.125
    renderWithMutate((p) => <PrecipGrid {...p} />, fc)
    expect(screen.getByLabelText('HUR D1 QPF')).toHaveAttribute('aria-invalid', 'true')
  })
})

describe('TempTable', () => {
  it('flags a high below its low live', () => {
    const fc = makeForecast()
    fc.temps.olympics.d1.high = 20
    fc.temps.olympics.d1.low = 30
    renderWithMutate((p) => <TempTable {...p} />, fc)
    expect(screen.getByLabelText('olympics D1 high')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('olympics D1 low')).toHaveAttribute('aria-invalid', 'true')
  })

  it('does not flag an isothermal (equal) pair', () => {
    const fc = makeForecast()
    fc.temps.olympics.d1.high = 30
    fc.temps.olympics.d1.low = 30
    renderWithMutate((p) => <TempTable {...p} />, fc)
    expect(screen.getByLabelText('olympics D1 high')).not.toHaveAttribute('aria-invalid')
  })
})

describe('SnowLevelTable', () => {
  it('labels a block snow when the zone QPF exceeds the threshold, freezing when dry', () => {
    const fc = makeForecast()
    fc.precip.HUR.d1.qpf = 0.5 // wet day 1 → am1/pm1 read as snow
    renderWithMutate((p) => <SnowLevelTable {...p} />, fc)
    expect(screen.getByLabelText('olympics am1 designation: snow')).toBeInTheDocument()
    // ev1 belongs to the (dry) n1 period → freezing
    expect(screen.getByLabelText('olympics ev1 designation: freezing')).toBeInTheDocument()
  })

  it('clicking the designation toggles a manual override', () => {
    const fc = makeForecast()
    const { view } = renderWithMutate((p) => <SnowLevelTable {...p} />, fc)
    fireEvent.click(screen.getByLabelText('olympics am1 designation: freezing'))
    expect(fc.snowLevel.olympics.am1.mode).toBe('snow')
    view.unmount()
  })
})
