const mockGetActiveAnnouncements = jest.fn()
jest.mock('../../src/utilities/queries/getActiveAnnouncements', () => ({
  getActiveAnnouncements: (center: string) => mockGetActiveAnnouncements(center),
}))

import { GET } from '@/app/api/[center]/announcements/route'

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

  // The CDN window is the whole schedule tolerance: stale-while-revalidate would let a center
  // nobody has visited for hours answer with hours-old announcements.
  it('lets the CDN hold an answer for a minute and never serve it stale', async () => {
    mockGetActiveAnnouncements.mockResolvedValue({ banners: [], popups: [] })

    const cacheControl = (await get('nwac')).headers.get('Cache-Control')

    expect(cacheControl).toContain('s-maxage=60')
    expect(cacheControl).not.toContain('stale-while-revalidate')
  })

  it('does not let the CDN cache the unknown-center reply', async () => {
    expect((await get('not-a-center')).headers.get('Cache-Control')).toBe('no-store')
  })
})
