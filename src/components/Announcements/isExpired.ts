import type { Announcement } from '@/payload-types'

export function isExpired(announcement: Announcement): boolean {
  if (!announcement.endDate) return false
  return new Date(announcement.endDate) < new Date()
}
