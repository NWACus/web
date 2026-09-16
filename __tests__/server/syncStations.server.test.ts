jest.mock('../../src/payload.config', () => ({}))
jest.mock('payload', () => ({ getPayload: jest.fn() }))

import { syncIsDue } from '../../src/services/snowobs/syncStations'

describe('syncIsDue', () => {
  const now = new Date('2026-09-16T12:00:00Z')

  it('is due when nothing has ever synced', () => {
    expect(syncIsDue(null, now)).toBe(true)
    expect(syncIsDue(undefined, now)).toBe(true)
    expect(syncIsDue('not a date', now)).toBe(true)
  })

  it('is due once the last sync is more than a day old', () => {
    expect(syncIsDue('2026-09-15T11:00:00Z', now)).toBe(true)
    expect(syncIsDue('2026-09-15T13:00:00Z', now)).toBe(false)
  })
})
