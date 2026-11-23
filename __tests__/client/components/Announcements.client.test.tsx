import { Announcements } from '@/components/Announcements/Announcements.client'
import type { Announcement } from '@/payload-types'
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'

// The real one pulls the whole block registry, and none of these announcements carry content.
jest.mock('../../../src/components/RichText', () => ({
  __esModule: true,
  default: () => null,
}))

function makeBanner(overrides: Partial<Announcement> = {}): Announcement {
  return {
    id: 1,
    tenant: 1,
    title: 'Road closure',
    type: 'banner',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

const mockFetch = jest.fn()

function respondWith(body: unknown, ok = true) {
  mockFetch.mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => body })
}

function renderAnnouncements() {
  return render(
    <Announcements center="nwac">
      <header>Site header</header>
    </Announcements>,
  )
}

describe('Announcements', () => {
  beforeAll(() => {
    // jsdom has neither; the strip and the banners only use ResizeObserver to measure height.
    global.fetch = mockFetch
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  })

  beforeEach(() => {
    mockFetch.mockReset()
    localStorage.clear()
  })

  it("reads the center's announcements from its API route", async () => {
    respondWith({ banners: [makeBanner()], popups: [] })

    renderAnnouncements()

    expect(await screen.findByText('Road closure')).toBeInTheDocument()
    expect(mockFetch).toHaveBeenCalledWith('/api/nwac/announcements', expect.anything())
  })

  it('renders the header before the announcements arrive', () => {
    mockFetch.mockReturnValue(new Promise(() => {}))

    renderAnnouncements()

    expect(screen.getByText('Site header')).toBeInTheDocument()
    expect(screen.queryByText('Road closure')).not.toBeInTheDocument()
  })

  it('leaves out a banner that expired after the response was cached', async () => {
    const past = new Date(Date.now() - 60_000).toISOString()
    respondWith({
      banners: [makeBanner({ id: 1 }), makeBanner({ id: 2, title: 'Expired', endDate: past })],
      popups: [],
    })

    renderAnnouncements()

    expect(await screen.findByText('Road closure')).toBeInTheDocument()
    expect(screen.queryByText('Expired')).not.toBeInTheDocument()
  })

  it('shows the page without announcements when the read fails', async () => {
    respondWith({ error: 'boom' }, false)

    renderAnnouncements()

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    expect(screen.getByText('Site header')).toBeInTheDocument()
    expect(screen.queryByText('Road closure')).not.toBeInTheDocument()
  })
})
