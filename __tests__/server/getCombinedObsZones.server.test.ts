jest.mock('../../src/payload.config', () => ({}))

jest.mock('payload', () => ({
  getPayload: jest.fn(),
}))

import { getCombinedObsZones } from '@/services/nac/nac'

let fetchSpy: jest.SpiedFunction<typeof globalThis.fetch>

function respondWith(response: () => Response) {
  fetchSpy = jest.spyOn(globalThis, 'fetch').mockImplementation(async () => response())
}

function request(): { url: string; init: RequestInit } {
  const [url, init] = fetchSpy.mock.calls[0] ?? []
  if (typeof url !== 'string' || !init) throw new Error('fetch was not called with a URL and init')
  return { url, init }
}

const boise = {
  zone_id: '54f0aec6-b98f-4fa3-bcaf-19e1cb14da71',
  name: 'Boise Mountains',
  center_id: ['SNFAC'],
  status: 'active',
  zone_type: 'obs_zone',
  priority: 2,
  created_at: '2025-12-16T21:18:30.415226Z',
  geom: { type: 'Polygon', coordinates: [] },
}

afterEach(() => {
  fetchSpy.mockRestore()
})

describe('getCombinedObsZones', () => {
  it('sends an allowed Origin, which the obs API requires', async () => {
    respondWith(() => new Response(JSON.stringify([boise])))

    await getCombinedObsZones('snfac')

    const { url, init } = request()
    expect(url).toContain('/obs/v1/public/obs_zone/combined_zones/?center_id=SNFAC')
    expect(new Headers(init.headers).get('origin')).toBe('https://avy-fx.org')
    expect(init.cache).toBe('no-store')
  })

  it("looks DVAC up as NWAC, like the center's other NAC data", async () => {
    respondWith(() => new Response(JSON.stringify([])))

    await getCombinedObsZones('dvac')

    expect(request().url).toContain('center_id=NWAC')
  })

  it('drops each zone outline', async () => {
    respondWith(() => new Response(JSON.stringify([boise])))

    const [zone] = await getCombinedObsZones('snfac')

    expect(zone).toEqual({
      zone_id: boise.zone_id,
      name: 'Boise Mountains',
      status: 'active',
      zone_type: 'obs_zone',
      priority: 2,
    })
  })

  it('returns no zones when the center has none (204)', async () => {
    respondWith(() => new Response(null, { status: 204 }))

    expect(await getCombinedObsZones('snfac')).toEqual([])
  })
})
