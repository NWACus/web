import { formatBoxParam, parseBoxParam } from '@/utilities/geo/boxParam'

describe('formatBoxParam', () => {
  it('writes west,south,east,north rounded outward to four decimals', () => {
    expect(
      formatBoxParam({ west: -122.44331, south: 47.12341, east: -121.00001, north: 48.77159 }),
    ).toBe('-122.4434,47.1234,-121.0000,48.7716')
  })

  it('round-trips through parseBoxParam', () => {
    const box = { west: -122.5, south: 47.25, east: -121, north: 48.75 }
    expect(parseBoxParam(formatBoxParam(box))).toEqual(box)
  })
})

describe('parseBoxParam', () => {
  it('reads a well-formed box', () => {
    expect(parseBoxParam('-122.6,47.1,-121.2,48.8')).toEqual({
      west: -122.6,
      south: 47.1,
      east: -121.2,
      north: 48.8,
    })
  })

  it.each([
    ['missing', null],
    ['empty', ''],
    ['too few values', '-122,47,-121'],
    ['too many values', '-122,47,-121,48,1'],
    ['not numbers', '-122,abc,-121,48'],
    ['blank values', ',,,'],
    ['south above north', '-122,49,-121,48'],
    ['west east of east', '-121,47,-122,48'],
    ['latitude out of range', '-122,-91,-121,48'],
    ['longitude out of range', '-181,47,-121,48'],
  ])('rejects a box that is %s', (_label, value) => {
    expect(parseBoxParam(value)).toBeNull()
  })
})
