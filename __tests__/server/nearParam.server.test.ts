import { formatNearParam, parseNearParam } from '@/utilities/geo/nearParam'

describe('formatNearParam', () => {
  it('writes latitude,longitude to four decimals by default', () => {
    expect(formatNearParam({ latitude: 47.596234, longitude: -120.661512 })).toBe(
      '47.5962,-120.6615',
    )
  })

  it('rounds coarser when asked', () => {
    expect(formatNearParam({ latitude: 47.596234, longitude: -120.661512 }, 2)).toBe(
      '47.60,-120.66',
    )
  })

  it('round-trips through parseNearParam', () => {
    const point = { latitude: 47.25, longitude: -121.5 }
    expect(parseNearParam(formatNearParam(point))).toEqual(point)
  })
})

describe('parseNearParam', () => {
  it('reads a well-formed point', () => {
    expect(parseNearParam('47.6,-122.3')).toEqual({ latitude: 47.6, longitude: -122.3 })
  })

  it.each([
    ['missing', null],
    ['empty', ''],
    ['the device-location marker', 'me'],
    ['one value', '47.6'],
    ['three values', '47.6,-122.3,1'],
    ['not numbers', '47.6,abc'],
    ['latitude out of range', '91,-122.3'],
    ['longitude out of range', '47.6,-181'],
  ])('rejects a point that is %s', (_label, value) => {
    expect(parseNearParam(value)).toBeNull()
  })
})
