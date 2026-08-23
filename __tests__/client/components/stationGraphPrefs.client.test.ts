import {
  defaultChartPrefs,
  moveToKey,
  swapWithNeighbor,
} from '@/components/WeatherStations/stationGraphPrefs'
import type { GraphPreset } from '@/components/WeatherStations/stationGraphPresets'

const preset = (key: string, defaultHidden?: boolean): GraphPreset => ({
  key,
  title: key,
  variables: [key],
  ...(defaultHidden ? { defaultHidden } : {}),
})

describe('defaultChartPrefs', () => {
  it('orders by the preset list and hides the default-hidden charts', () => {
    expect(defaultChartPrefs([preset('a'), preset('b', true), preset('c')])).toEqual({
      order: ['a', 'b', 'c'],
      hidden: ['b'],
    })
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
