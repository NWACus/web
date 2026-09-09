import { AnnouncementBanners } from '@/components/Announcements/AnnouncementBanners.client'
import type { Announcement } from '@/payload-types'
import { AnnouncementBannerProvider } from '@/providers/AnnouncementBannerProvider'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

// The real one pulls the whole block registry, and none of these banners carry content.
jest.mock('../../../src/components/RichText', () => ({
  __esModule: true,
  default: () => null,
}))

// 375px is a phone-width viewport, well under the 768px mobile/desktop split.
const MOBILE_WIDTH = 375
const STORAGE_KEY = 'announcement-banners'

function makeBanner(overrides: Partial<Announcement> = {}): Announcement {
  return {
    id: 1,
    tenant: 1,
    title: 'Test banner',
    type: 'banner',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

function renderBanners(banners: Announcement[]) {
  return render(
    <AnnouncementBannerProvider banners={banners}>
      <AnnouncementBanners />
    </AnnouncementBannerProvider>,
  )
}

function storedSeenIds(): number[] {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored).seenIds : []
}

describe('AnnouncementBanners', () => {
  const originalWidth = window.innerWidth

  beforeAll(() => {
    // jsdom has no ResizeObserver; the banners only use it to measure their own height.
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  })

  beforeEach(() => {
    localStorage.clear()
    Object.defineProperty(window, 'innerWidth', {
      value: MOBILE_WIDTH,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      value: originalWidth,
      writable: true,
      configurable: true,
    })
  })

  it('renders banners targeted at this device', () => {
    renderBanners([makeBanner({ title: 'Mobile banner', deviceTarget: 'mobile_only' })])

    expect(screen.getByText('Mobile banner')).toBeInTheDocument()
    expect(storedSeenIds()).toEqual([1])
  })

  it('does not render a banner targeted at the other device', () => {
    renderBanners([makeBanner({ title: 'Desktop banner', deviceTarget: 'desktop_only' })])

    expect(screen.queryByText('Desktop banner')).not.toBeInTheDocument()
  })

  it('does not mark an other-device banner as seen', () => {
    renderBanners([
      makeBanner({ id: 1, title: 'Mobile banner', deviceTarget: 'mobile_only' }),
      makeBanner({ id: 2, title: 'Desktop banner', deviceTarget: 'desktop_only' }),
    ])

    // Banner 2 was never shown here, so it must still auto-expand on a desktop visit.
    expect(storedSeenIds()).toEqual([1])
  })

  it('leaves stored state alone when no banner targets this device', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ collapsed: true, seenIds: [2] }))

    renderBanners([makeBanner({ id: 2, title: 'Desktop banner', deviceTarget: 'desktop_only' })])

    expect(storedSeenIds()).toEqual([2])
  })
})
