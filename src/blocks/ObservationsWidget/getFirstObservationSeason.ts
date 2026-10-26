'use server'

import { getAvalancheCenterMetadata } from '@/services/nac/nac'
import { isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'

// What the widget falls back to when a center hasn't set its first season
const WIDGET_DEFAULT_FIRST_SEASON = 2023

// The end year of the oldest season the center's observations widget offers
export async function getFirstObservationSeason(centerSlug: string): Promise<number | null> {
  if (!isValidTenantSlug(centerSlug)) return null

  const metadata = await getAvalancheCenterMetadata(centerSlug)
  return metadata.widget_config.observation_viewer?.obs_start_year ?? WIDGET_DEFAULT_FIRST_SEASON
}
