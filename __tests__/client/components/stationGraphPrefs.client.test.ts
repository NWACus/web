import {
  loadChartPrefs,
  reconcileChartPrefs,
  saveChartPrefs,
  swapWithNeighbor,
} from '@/components/WeatherStations/stationGraphPrefs'

describe('reconcileChartPrefs', () => {
  it('drops unknown keys and appends new presets in default position', () => {
    const stored = { order: ['b', 'gone', 'a'], hidden: ['gone', 'b'] }
    expect(reconcileChartPrefs(stored, ['a', 'b', 'c'])).toEqual({
      order: ['b', 'a', 'c'],
      hidden: ['b'],
    })
  })
})

describe('load/save round trip', () => {
  beforeEach(() => window.localStorage.clear())

  it('restores a saved arrangement', () => {
    saveChartPrefs({ order: ['b', 'a'], hidden: ['a'] })
    expect(loadChartPrefs(['a', 'b'])).toEqual({ order: ['b', 'a'], hidden: ['a'] })
  })

  it('falls back to defaults on garbage', () => {
    window.localStorage.setItem('nwac-station-graph-prefs', '{"order": "nope"}')
    expect(loadChartPrefs(['a', 'b'])).toEqual({ order: ['a', 'b'], hidden: [] })
  })
})

describe('swapWithNeighbor', () => {
  const none = () => false

  it('swaps with the adjacent key', () => {
    expect(swapWithNeighbor(['a', 'b', 'c'], 'b', -1, none)).toEqual(['b', 'a', 'c'])
  })

  it('skips keys the caller marks unswappable', () => {
    const skipB = (key: string) => key === 'b'
    expect(swapWithNeighbor(['a', 'b', 'c'], 'a', 1, skipB)).toEqual(['c', 'b', 'a'])
  })

  it('returns the order untouched at a boundary', () => {
    const order = ['a', 'b']
    expect(swapWithNeighbor(order, 'a', -1, none)).toBe(order)
    const skipA = (key: string) => key === 'a'
    expect(swapWithNeighbor(order, 'b', -1, skipA)).toBe(order)
  })
})
