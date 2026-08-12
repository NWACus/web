jest.mock('../../src/payload.config', () => ({}))

jest.mock('payload', () => ({
  getPayload: jest.fn(),
}))

import { afpFetch, nacFetch } from '@/services/nac/nac'

const ONE_DAY_IN_SECONDS = 24 * 60 * 60

let fetchSpy: jest.SpiedFunction<typeof globalThis.fetch>

function initFor(callIndex = 0): RequestInit {
  const init = fetchSpy.mock.calls[callIndex]?.[1]
  if (!init) {
    throw new Error(`fetch was not called with an init object at call ${callIndex}`)
  }
  return init
}

beforeEach(() => {
  // A fresh Response per call — a single instance's body can only be read once.
  fetchSpy = jest
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async () => new Response(JSON.stringify({ ok: true })))
})

afterEach(() => {
  fetchSpy.mockRestore()
})

describe.each([
  ['nacFetch', nacFetch],
  ['afpFetch', afpFetch],
])('services: %s cache options', (_name, doFetch) => {
  it('defaults revalidate to one day expressed in seconds', async () => {
    await doFetch('/v2/public/avalanche-center/NWAC')

    expect(initFor().next?.revalidate).toBe(ONE_DAY_IN_SECONDS)
  })

  it('passes an explicit cachedTime through unchanged', async () => {
    await doFetch('/v2/public/avalanche-center/NWAC', { cachedTime: 30 * 60 })

    expect(initFor().next?.revalidate).toBe(30 * 60)
  })

  it('honors cachedTime: false to cache indefinitely', async () => {
    await doFetch('/v2/public/avalanche-center/NWAC', { cachedTime: false })

    expect(initFor().next?.revalidate).toBe(false)
  })

  it('sets next.tags to the tag array so revalidateTag applies', async () => {
    await doFetch('/v2/public/avalanche-center/NWAC', { tags: ['nac-metadata', 'nwac'] })

    expect(initFor().next?.tags).toEqual(['nac-metadata', 'nwac'])
  })

  it('omits tags entirely when none are given', async () => {
    await doFetch('/v2/public/avalanche-center/NWAC')
    await doFetch('/v2/public/avalanche-center/NWAC', { tags: [] })

    expect(initFor(0).next).not.toHaveProperty('tags')
    expect(initFor(1).next).not.toHaveProperty('tags')
  })
})
