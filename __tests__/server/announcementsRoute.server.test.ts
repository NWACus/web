const mockGetActiveAnnouncements = jest.fn()
jest.mock('../../src/utilities/queries/getActiveAnnouncements', () => ({
  getActiveAnnouncements: (center: string) => mockGetActiveAnnouncements(center),
}))

import { dynamic, GET, revalidate } from '@/app/api/[center]/announcements/route'

const request = new Request('http://x/api/nwac/announcements')
const get = (center: string) => GET(request, { params: Promise.resolve({ center }) })

describe('GET /api/[center]/announcements', () => {
  beforeEach(() => {
    mockGetActiveAnnouncements.mockReset()
  })

  it("returns the center's active banners and popups", async () => {
    const active = { banners: [{ id: 1, title: 'Road closure' }], popups: [{ id: 2 }] }
    mockGetActiveAnnouncements.mockResolvedValue(active)

    const response = await get('nwac')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(active)
    expect(mockGetActiveAnnouncements).toHaveBeenCalledWith('nwac')
  })

  it('answers 404 for an unknown center without reading the database', async () => {
    const response = await get('not-a-center')

    expect(response.status).toBe(404)
    expect(mockGetActiveAnnouncements).not.toHaveBeenCalled()
  })

  // Cached, a save can purge it by path. The window is how late a scheduled start or end can be.
  it('is cached like a page, for a minute', () => {
    expect(dynamic).toBe('force-static')
    expect(revalidate).toBe(60)
  })

  it('does not let the CDN cache the unknown-center reply', async () => {
    expect((await get('not-a-center')).headers.get('Cache-Control')).toBe('no-store')
  })
})
