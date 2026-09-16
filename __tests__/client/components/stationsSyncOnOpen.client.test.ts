import { runSync } from '../../../src/collections/Stations/components/StationsSyncOnOpen'

// The control's whole job is turning a sync response into a sentence, so that
// is what is worth pinning: the counts a run reports, silence when the server
// judged the last run fresh, and the ways it can fail without leaving the
// operator guessing.
describe('runSync', () => {
  const mockFetch = (value: unknown, ok = true) => {
    global.fetch = jest.fn().mockResolvedValue({ ok, json: async () => value })
  }

  it('always asks for a stale-only run and reports the counts', async () => {
    mockFetch({ created: 2, updated: 1, unchanged: 57 })
    expect(await runSync()).toEqual({
      text: 'Updated from SnowObs: 2 added, 1 updated, 57 unchanged.',
      failed: false,
    })
    expect(global.fetch).toHaveBeenCalledWith('/api/stations/sync?ifStale', expect.anything())
  })

  it('stays quiet when the server skipped a fresh-enough sync', async () => {
    mockFetch({ skipped: true, lastSyncedAt: '2026-09-16T00:00:00Z' })
    expect(await runSync()).toBeNull()
  })

  it('surfaces the server’s reason for refusing', async () => {
    mockFetch({ error: 'Select a center first.' }, false)
    expect(await runSync()).toEqual({ text: 'Select a center first.', failed: true })
  })

  it('falls back to a generic message when the error has no reason', async () => {
    mockFetch({}, false)
    expect(await runSync()).toEqual({ text: 'Update from SnowObs failed.', failed: true })
  })

  it('says so when the request never lands', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline'))
    expect(await runSync()).toEqual({
      text: 'Could not reach the server to update from SnowObs.',
      failed: true,
    })
  })
})
