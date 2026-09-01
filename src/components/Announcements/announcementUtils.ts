import type { Announcement } from '@/payload-types'

// Shared definition of the mobile/desktop split so banners and pop-ups target
// devices by the same rule. Viewports narrower than this (px) count as mobile.
export const MOBILE_BREAKPOINT = 768

export function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < MOBILE_BREAKPOINT
}

export function matchesDevice(target: Announcement['deviceTarget']): boolean {
  if (!target || target === 'all') return true
  if (target === 'mobile_only') return isMobile()
  if (target === 'desktop_only') return !isMobile()
  return true
}

export function matchesPage(
  pageScope: Announcement['pageScope'],
  pathname: string,
  center: string,
): boolean {
  if (!pageScope || pageScope === 'all_pages') return true
  if (pageScope === 'homepage_only') {
    return pathname === '/' || pathname === `/${center}`
  }
  return true
}

export function shouldShow(popup: Announcement, visitCount: number): boolean {
  const frequency = popup.displayFrequency ?? 'once'

  if (frequency === 'every_session') return true

  if (frequency === 'once') return visitCount === 0

  if (frequency === 'every_n_views') {
    const interval = popup.displayInterval ?? 3
    return visitCount % interval === 0
  }

  return false
}
