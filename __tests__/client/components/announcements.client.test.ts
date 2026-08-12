import { matchesPage, shouldShow } from '@/components/Announcements/announcementUtils'
import { isExpired } from '@/components/Announcements/isExpired'
import { scrollAnnouncementsIntoView } from '@/components/Announcements/scrollAnnouncementsIntoView'
import type { Announcement } from '@/payload-types'

function makeAnnouncement(overrides: Partial<Announcement> = {}): Announcement {
  return {
    id: 1,
    tenant: 1,
    title: 'Test',
    type: 'popup',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

describe('isExpired', () => {
  it('returns false when no endDate is set', () => {
    expect(isExpired(makeAnnouncement())).toBe(false)
  })

  it('returns false when endDate is in the future', () => {
    const future = new Date(Date.now() + 86400000).toISOString()
    expect(isExpired(makeAnnouncement({ endDate: future }))).toBe(false)
  })

  it('returns true when endDate is in the past', () => {
    const past = new Date(Date.now() - 86400000).toISOString()
    expect(isExpired(makeAnnouncement({ endDate: past }))).toBe(true)
  })
})

describe('matchesPage', () => {
  it('matches all pages when pageScope is null', () => {
    expect(matchesPage(null, '/nwac/some-page', 'nwac')).toBe(true)
  })

  it('matches all pages when pageScope is all_pages', () => {
    expect(matchesPage('all_pages', '/nwac/some-page', 'nwac')).toBe(true)
  })

  it('matches homepage at root path', () => {
    expect(matchesPage('homepage_only', '/', 'nwac')).toBe(true)
  })

  it('matches homepage at center path', () => {
    expect(matchesPage('homepage_only', '/nwac', 'nwac')).toBe(true)
  })

  it('does not match non-homepage for homepage_only', () => {
    expect(matchesPage('homepage_only', '/nwac/about', 'nwac')).toBe(false)
  })

  it('does not match a different center homepage', () => {
    expect(matchesPage('homepage_only', '/dvac', 'nwac')).toBe(false)
  })
})

describe('shouldShow', () => {
  it('always returns true when frequency is every_session', () => {
    const popup = makeAnnouncement({ displayFrequency: 'every_session' })
    expect(shouldShow(popup, 0)).toBe(true)
    expect(shouldShow(popup, 5)).toBe(true)
    expect(shouldShow(popup, 100)).toBe(true)
  })

  it('shows only on the first view when frequency is once', () => {
    const popup = makeAnnouncement({ displayFrequency: 'once' })
    expect(shouldShow(popup, 0)).toBe(true)
    expect(shouldShow(popup, 1)).toBe(false)
    expect(shouldShow(popup, 10)).toBe(false)
  })

  it('defaults to once when displayFrequency is not set', () => {
    const popup = makeAnnouncement({ displayFrequency: undefined })
    expect(shouldShow(popup, 0)).toBe(true)
    expect(shouldShow(popup, 1)).toBe(false)
  })

  it('shows every N views with every_n_views', () => {
    const popup = makeAnnouncement({ displayFrequency: 'every_n_views', displayInterval: 3 })
    expect(shouldShow(popup, 0)).toBe(true)
    expect(shouldShow(popup, 1)).toBe(false)
    expect(shouldShow(popup, 2)).toBe(false)
    expect(shouldShow(popup, 3)).toBe(true)
    expect(shouldShow(popup, 4)).toBe(false)
    expect(shouldShow(popup, 5)).toBe(false)
    expect(shouldShow(popup, 6)).toBe(true)
  })

  it('shows on every view when displayInterval is 1', () => {
    const popup = makeAnnouncement({ displayFrequency: 'every_n_views', displayInterval: 1 })
    expect(shouldShow(popup, 0)).toBe(true)
    expect(shouldShow(popup, 1)).toBe(true)
    expect(shouldShow(popup, 2)).toBe(true)
  })

  it('defaults interval to 3 when displayInterval is not set', () => {
    const popup = makeAnnouncement({ displayFrequency: 'every_n_views' })
    expect(shouldShow(popup, 0)).toBe(true)
    expect(shouldShow(popup, 1)).toBe(false)
    expect(shouldShow(popup, 2)).toBe(false)
    expect(shouldShow(popup, 3)).toBe(true)
  })
})

describe('scrollAnnouncementsIntoView', () => {
  const scrollTo = jest.fn()
  let reducedMotion = false

  beforeEach(() => {
    scrollTo.mockClear()
    reducedMotion = false

    Object.defineProperty(window, 'scrollTo', { value: scrollTo, writable: true })
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: query.includes('prefers-reduced-motion') && reducedMotion,
        media: query,
      }),
    })
  })

  function setScrollY(value: number) {
    Object.defineProperty(window, 'scrollY', { value, writable: true })
  }

  it('does nothing when the page is already at the top', () => {
    setScrollY(0)

    scrollAnnouncementsIntoView()

    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('scrolls back to the banners when the page is scrolled away from them', () => {
    setScrollY(1200)

    scrollAnnouncementsIntoView()

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })

  it('jumps without animating when the reader prefers reduced motion', () => {
    setScrollY(1200)
    reducedMotion = true

    scrollAnnouncementsIntoView()

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' })
  })
})
