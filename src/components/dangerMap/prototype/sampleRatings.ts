/**
 * PROTOTYPE ONLY — every zone is off-season in September, so the prototype paints fake ratings
 * to judge the designs against a realistic mid-winter map. Toggle off with `?ratings=live`.
 */
import { zoneStyle } from '@/services/nac/dangerMap/dangerMapZones'
import { dangerColor, dangerLevelFromRating } from '@/services/nac/dangerScale'
import type { DangerLevel } from '@/services/nac/types/forecastSchemas'

import type { ZoneCollection } from '../useDangerMap'

const NAMES: Record<number, string> = {
  1: 'low',
  2: 'moderate',
  3: 'considerable',
  4: 'high',
}

function levelFor(id: number | string | null): DangerLevel {
  const n = Number(id) || 0
  // Deterministic spread weighted toward Moderate/Considerable, like a typical winter day.
  const pick = [1, 2, 2, 3, 3, 3, 4][(n * 3) % 7]
  return dangerLevelFromRating(pick ?? 2)
}

/** Naive-UTC timestamp, the shape the map layer sends. */
function naiveUtc(offsetHours: number) {
  return new Date(Date.now() + offsetHours * 3_600_000).toISOString().slice(0, 19)
}

export function withSampleRatings(zones: ZoneCollection | null): ZoneCollection | null {
  if (!zones) return null
  return {
    ...zones,
    features: zones.features.map((feature) => {
      const level = levelFor(feature.id)
      const properties = {
        ...feature.properties,
        off_season: false,
        danger_level: level,
        danger: NAMES[level] ?? 'moderate',
        color: dangerColor(level),
        stroke: '#484848',
        start_date: naiveUtc(-8),
        end_date: naiveUtc(16),
        timezone: 'America/Los_Angeles',
      }
      return { ...feature, properties: { ...properties, ...zoneStyle(properties) } }
    }),
  }
}
