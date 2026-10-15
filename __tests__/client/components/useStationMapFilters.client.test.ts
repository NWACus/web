import { readUnitsPref, writeUnitsPref } from '@/components/stationMap/stationMapPrefs'
import { useStationMapFilters } from '@/components/stationMap/useStationMapState'
import { DEFAULT_FILTERS } from '@/services/snowobs/stationMap/filters'
import { act, renderHook } from '@testing-library/react'
import { useLayoutEffect } from 'react'

/** jsdom starts every test at the same URL; the map only ever uses `replaceState`. */
function atUrl(search: string) {
  window.history.replaceState(null, '', `/weather/stations/map${search}`)
}

describe('useStationMapFilters', () => {
  beforeEach(() => {
    window.localStorage.clear()
    atUrl('')
  })

  it('starts from the link, with the reader’s own units', () => {
    atUrl('?variable=air_temp&within=60')
    writeUnitsPref('nwac', 'metric')

    const { result } = renderHook(() => useStationMapFilters('nwac'))

    expect(result.current.filters).toEqual({
      ...DEFAULT_FILTERS,
      variable: 'air_temp',
      withinMinutes: 60,
      units: 'metric',
    })
  })

  it('puts a changed filter in the link, so the map can be shared as it looks', () => {
    const { result } = renderHook(() => useStationMapFilters('nwac'))

    act(() => result.current.changeFilters({ variable: 'air_temp' }))

    expect(result.current.filters.variable).toBe('air_temp')
    expect(window.location.search).toBe('?variable=air_temp')
  })

  // Units describes the reader, not the view: it is the one thing that outlives the link.
  it('saves units rather than linking it', () => {
    const { result } = renderHook(() => useStationMapFilters('nwac'))

    act(() => result.current.changeFilters({ units: 'metric' }))

    expect(result.current.filters.units).toBe('metric')
    expect(readUnitsPref('nwac')).toBe('metric')
    expect(window.location.search).toBe('')
  })

  it('resets the filters, keeping the units the reader chose', () => {
    atUrl('?variable=air_temp&within=60&zone=Olympics')
    writeUnitsPref('nwac', 'metric')
    const { result } = renderHook(() => useStationMapFilters('nwac'))

    act(() => result.current.resetFilters())

    expect(result.current.filters).toEqual({ ...DEFAULT_FILTERS, units: 'metric' })
    expect(readUnitsPref('nwac')).toBe('metric')
    expect(window.location.search).toBe('')
  })

  // The viewport has its own control on the map, and is nobody else's to clear.
  it('resets the filters without dropping the viewport from the link', () => {
    atUrl('?zone=Olympics&at=47.0000,-121.0000,8.00')
    const { result } = renderHook(() => useStationMapFilters('nwac'))

    act(() => result.current.resetFilters())

    expect(window.location.search).toBe('?at=47.0000%2C-121.0000%2C8.00')
  })

  /**
   * Next patches `history.replaceState` to update its router, so writing the URL while React is
   * rendering updates one component during another's render ("Cannot update a component
   * (`Router`)…"). A second change in one batch is what makes React run the update in render.
   */
  it('never writes the link while React is rendering', () => {
    let rendering = false
    const original = window.history.replaceState.bind(window.history)
    const writesDuringRender: string[] = []
    const spy = jest
      .spyOn(window.history, 'replaceState')
      .mockImplementation((data, unused, url) => {
        if (rendering) writesDuringRender.push(String(url))
        original(data, unused, url)
      })

    // Flagged from the start of the render that reads the state to its commit.
    const { result } = renderHook(() => {
      rendering = true
      const state = useStationMapFilters('nwac')
      useLayoutEffect(() => {
        rendering = false
      })
      return state
    })
    act(() => {
      result.current.changeFilters({ units: 'metric' })
      result.current.changeFilters({ variable: 'air_temp' })
    })
    spy.mockRestore()

    expect(writesDuringRender).toEqual([])
    expect(result.current.filters).toMatchObject({ units: 'metric', variable: 'air_temp' })
    expect(window.location.search).toBe('?variable=air_temp')
  })
})
