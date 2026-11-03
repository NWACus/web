import { degreesToRose } from '@/components/WeatherStations/stationGraphOptions'

describe('degreesToRose', () => {
  it('names the 16-point sector and wraps 360 to N', () => {
    expect(degreesToRose(225)).toBe('SW')
    expect(degreesToRose(360)).toBe('N')
  })

  it('marks a reading outside 0–360 as invalid', () => {
    expect(degreesToRose(-20)).toBe('INV')
    expect(degreesToRose(400)).toBe('INV')
  })
})
