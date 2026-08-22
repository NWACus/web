import { runSync } from '../../../src/collections/Settings/components/SyncStationsButton'

// The button's whole job is turning a sync response into a sentence, so that is
// what is worth pinning: the counts a good run reports, and the two ways it can
// fail without leaving the operator guessing.
describe('runSync', () => {
  const mockFetch = (value: unknown, ok = true) => {
    global.fetch = jest.fn().mockResolvedValue({ ok, json: async () => value })
  }

  it('reports the counts a successful sync returns', async () => {
    mockFetch({ created: 2, updated: 1, unchanged: 57 })
    expect(await runSync(2)).toEqual({
      text: '2 added, 1 updated, 57 unchanged.',
      failed: false,
    })
  })

  it('surfaces the server’s reason for refusing', async () => {
    mockFetch({ error: 'Add a SnowObs source and token before syncing.' }, false)
    expect(await runSync(2)).toEqual({
      text: 'Add a SnowObs source and token before syncing.',
      failed: true,
    })
  })

  it('falls back to a generic message when the error has no reason', async () => {
    mockFetch({}, false)
    expect(await runSync(2)).toEqual({ text: 'Sync failed.', failed: true })
  })

  it('says so when the request never lands', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline'))
    expect(await runSync(2)).toEqual({ text: 'Could not reach the server.', failed: true })
  })
})
