import { findStationConflict } from '@/collections/StationPages/hooks/ensureStationsUnique'

const ref = (stid: string, source = 'nwac') => ({ stid, source })

describe('findStationConflict', () => {
  it('accepts a page whose stations are on no other page', () => {
    expect(findStationConflict([ref('1'), ref('2')], [])).toBeNull()
  })

  it('rejects the same station listed twice on one page', () => {
    expect(findStationConflict([ref('1'), ref('1')], [])).toMatch(/listed twice/)
  })

  it('rejects a station another page already shows, naming that page', () => {
    const other = { displayName: 'Alpental Ski Area', stations: [ref('1')] }
    expect(findStationConflict([ref('1')], [other])).toMatch(/"Alpental Ski Area"/)
  })

  it('tells a stid apart by source', () => {
    const other = { displayName: 'Nooksack', stations: [ref('1', 'snotel')] }
    expect(findStationConflict([ref('1', 'nwac')], [other])).toBeNull()
  })
})
