import { matchTimezone } from '@/utilities/timezones'
import type { CollectionBeforeChangeHook } from 'payload'

export const syncTimezoneFromNac: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation === 'create' && data.slug && !data.timezone) {
    try {
      // Lazy import to avoid circular dependency (nac.ts imports @payload-config)
      const { getAvalancheCenterMetadata } = await import('@/services/nac/nac')
      const metadata = await getAvalancheCenterMetadata(data.slug)
      const timezone = matchTimezone(metadata.timezone)
      if (timezone) {
        return { ...data, timezone }
      }
    } catch (err) {
      req.payload.logger.warn(
        `Failed to fetch timezone from NAC for ${data.slug}: ${err instanceof Error ? err.message : err}`,
      )
    }
  }
  return data
}
