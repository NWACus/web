/**
 * What a list card shows, cut down from the full record on the server so the list response a
 * browser downloads carries 25 cards rather than 25 full observations (summaries, weather,
 * problems, nested avalanches). The rules are the widget's `ObservationCard.vue`.
 */
import { MediaType } from '../model/forecast'
import type { Avalanche, MediaItem, Observation } from '../model/observation'
import { triggerGroupOf, type TriggerGroup } from './options'

interface CardMedia {
  /** The first image, else the first item of any kind. */
  thumbnail: MediaItem | null
  count: number
}

export interface ObservationCardData {
  kind: 'observation'
  id: string
  date: string | null
  locationName: string | null
  zoneName: string | null
  observerType: string
  organization: string | null
  avalanchesObserved: boolean
  crackingOrCollapsing: boolean
  media: CardMedia
}

export interface AvalancheCardData {
  kind: 'avalanche'
  id: string
  date: string | null
  locationName: string | null
  zoneName: string | null
  number: number | null
  aspect: string | null
  elevation: number | null
  dSize: string | null
  /** The trigger as the filter groups it ("Human", "Natural", …); a Human trigger gets a badge. */
  trigger: TriggerGroup | null
  media: CardMedia
}

export type CardData = ObservationCardData | AvalancheCardData

export function cardMedia(media: MediaItem[]): CardMedia {
  return {
    thumbnail: media.find((item) => item.type === MediaType.Image) ?? media[0] ?? null,
    count: media.length,
  }
}

/**
 * The media an observation's card counts: its own, then its avalanches' — but only when it has
 * media of its own, which is how the widget counts.
 */
export function observationCardMedia(observation: Observation): CardMedia {
  if (observation.media.length === 0) return cardMedia([])
  return cardMedia([
    ...observation.media,
    ...observation.avalanches.flatMap((avalanche) => avalanche.media),
  ])
}

export function observationCard(observation: Observation): ObservationCardData {
  return {
    kind: 'observation',
    id: observation.id,
    date: observation.startDate,
    locationName: observation.locationName,
    zoneName: observation.zone.name ?? 'Other',
    observerType: observation.observer.type,
    organization: observation.observer.organization,
    avalanchesObserved: observation.instability.avalanchesObserved,
    crackingOrCollapsing: observation.instability.cracking || observation.instability.collapsing,
    media: observationCardMedia(observation),
  }
}

export function avalancheCard(avalanche: Avalanche): AvalancheCardData {
  return {
    kind: 'avalanche',
    id: avalanche.id,
    date: avalanche.date,
    locationName: avalanche.locationName,
    zoneName: avalanche.zone.name ?? 'Other',
    number: avalanche.number,
    aspect: avalanche.aspect,
    elevation: avalanche.elevation,
    dSize: avalanche.dSize,
    trigger: triggerGroupOf(avalanche.trigger),
    media: cardMedia(avalanche.media),
  }
}

/** What the list endpoint answers: one page of cards, and the totals across every page. */
export interface ObservationListResponse {
  items: CardData[]
  total: number
  pages: number
  /** The page served — page 1 when the one asked for no longer exists. */
  page: number
  /** The avalanches tab's headline figure, which sums each report's `number`. */
  avalancheCount: number | null
}
