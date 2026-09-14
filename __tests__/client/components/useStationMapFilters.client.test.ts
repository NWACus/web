import { readStationMapPrefs, writeStationMapPrefs } from '@/components/stationMap/stationMapPrefs'
import { useStationMapFilters } from '@/components/stationMap/useStationMapState'
import { DEFAULT_FILTERS } from '@/services/snowobs/stationMap/filters'
import { act, renderHook } from '@testing-library/react'

describe('useStationMapFilters', () => {
  beforeEach(() => window.localStorage.clear())

  it('starts from the reader’s saved preferences', () => {
    writeStationMapPrefs('nwac', { variable: 'air_temp', withinMinutes: 60, units: 'metric' })

    const { result } = renderHook(() => useStationMapFilters('nwac'))

    expect(result.current.filters).toEqual({
      ...DEFAULT_FILTERS,
      variable: 'air_temp',
      withinMinutes: 60,
      units: 'metric',
    })
  })

  it('persists a changed filter', () => {
    const { result } = renderHook(() => useStationMapFilters('nwac'))

    act(() => result.current.changeFilters({ variable: 'air_temp' }))

    expect(result.current.filters.variable).toBe('air_temp')
    expect(readStationMapPrefs('nwac').variable).toBe('air_temp')
  })

  // The viewport shares the preferences entry and has its own reset control on the map.
  it('resets the filters without discarding the remembered viewport', () => {
    writeStationMapPrefs('nwac', {
      variable: 'air_temp',
      withinMinutes: 60,
      center: { lat: 47, lng: -121 },
      zoom: 8,
    })
    const { result } = renderHook(() => useStationMapFilters('nwac'))

    act(() => result.current.resetFilters())

    expect(result.current.filters).toEqual(DEFAULT_FILTERS)
    expect(readStationMapPrefs('nwac')).toEqual({
      variable: DEFAULT_FILTERS.variable,
      withinMinutes: DEFAULT_FILTERS.withinMinutes,
      units: DEFAULT_FILTERS.units,
      center: { lat: 47, lng: -121 },
      zoom: 8,
    })
  })
})
