import {
  loadChartPrefs,
  moveToKey,
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
  it('swaps with the adjacent key', () => {
    expect(swapWithNeighbor(['a', 'b', 'c'], 'b', -1)).toEqual(['b', 'a', 'c'])
  })

  it('returns the order untouched at a boundary', () => {
    const order = ['a', 'b']
    expect(swapWithNeighbor(order, 'a', -1)).toBe(order)
    expect(swapWithNeighbor(order, 'b', 1)).toBe(order)
  })
})

describe('moveToKey', () => {
  it('moves a key to the target position, shifting the keys between', () => {
    expect(moveToKey(['a', 'b', 'c', 'd'], 'a', 'c')).toEqual(['b', 'c', 'a', 'd'])
    expect(moveToKey(['a', 'b', 'c', 'd'], 'd', 'b')).toEqual(['a', 'd', 'b', 'c'])
  })

  it('returns the order untouched for unknown or identical keys', () => {
    const order = ['a', 'b']
    expect(moveToKey(order, 'a', 'a')).toBe(order)
    expect(moveToKey(order, 'x', 'a')).toBe(order)
    expect(moveToKey(order, 'a', 'x')).toBe(order)
  })
})
