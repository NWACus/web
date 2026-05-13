import { matchesPage, shouldShow } from '@/components/Announcements/announcementUtils'
import { isExpired } from '@/components/Announcements/isExpired'
import type { Announcement } from '@/payload-types'

function makeAnnouncement(overrides: Partial<Announcement> = {}): Announcement {
  return {
    id: 1,
    title: 'Test',
    type: 'popup',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  } as Announcement
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
  it('shows on every visit when frequency is every_visit', () => {
    const popup = makeAnnouncement({ displayFrequency: 'every_visit' })
    expect(shouldShow(popup, 0)).toBe(true)
    expect(shouldShow(popup, 5)).toBe(true)
    expect(shouldShow(popup, 100)).toBe(true)
  })

  it('shows only on first visit when frequency is once', () => {
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

  it('shows every N visits with every_n_visits', () => {
    const popup = makeAnnouncement({ displayFrequency: 'every_n_visits', displayInterval: 3 })
    expect(shouldShow(popup, 0)).toBe(true)
    expect(shouldShow(popup, 1)).toBe(false)
    expect(shouldShow(popup, 2)).toBe(false)
    expect(shouldShow(popup, 3)).toBe(true)
    expect(shouldShow(popup, 4)).toBe(false)
    expect(shouldShow(popup, 5)).toBe(false)
    expect(shouldShow(popup, 6)).toBe(true)
  })

  it('defaults interval to 3 when displayInterval is not set', () => {
    const popup = makeAnnouncement({ displayFrequency: 'every_n_visits' })
    expect(shouldShow(popup, 0)).toBe(true)
    expect(shouldShow(popup, 1)).toBe(false)
    expect(shouldShow(popup, 2)).toBe(false)
    expect(shouldShow(popup, 3)).toBe(true)
  })
})
