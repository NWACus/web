import type { Announcement } from '@/payload-types'

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

  if (frequency === 'every_visit') return true

  if (frequency === 'once') return visitCount === 0

  if (frequency === 'every_n_visits') {
    const interval = popup.displayInterval ?? 3
    return visitCount % interval === 0
  }

  return false
}
