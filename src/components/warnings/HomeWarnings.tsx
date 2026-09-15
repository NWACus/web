/**
 * The home page's warnings slot, and the place the control axes for this product are resolved:
 *
 * - the per-tenant native rollout flag (Control 1) chooses the native banner over the legacy
 *   `warnings` widget, so a tenant can be rolled back instantly;
 * - the center's upstream `warnings` capability gates both — a center that doesn't issue alerts
 *   gets nothing at all rather than a surface that permanently renders empty.
 */
import { NACWidget } from '@/components/NACWidget'
import { getAvalancheCenterPlatforms } from '@/services/nac/nac'
import { getNativeProductFlag } from '@/utilities/getNativeProductFlag'

import { CenterWarnings } from './CenterWarnings'

interface HomeWarningsProps {
  centerSlug: string
}

export async function HomeWarnings({ centerSlug }: HomeWarningsProps) {
  const [platforms, useNative] = await Promise.all([
    getAvalancheCenterPlatforms(centerSlug),
    getNativeProductFlag(centerSlug, 'warning'),
  ])

  if (!platforms.warnings) return null
  if (!useNative) return <NACWidget center={centerSlug} widget="warnings" />

  return <CenterWarnings centerSlug={centerSlug} />
}
