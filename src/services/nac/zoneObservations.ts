/**
 * The zone's last 7 days of observations and avalanches, read through the observation viewer's
 * source (`getObservationSource()`): the same obs-API client, schemas and mappers, asked for one
 * zone and week instead of a map viewport. Records are sorted newest date first, then newest
 * submitted.
 */
import { unstable_cache } from 'next/cache'

import { getThumbnailUrl } from '@/components/forecast/mediaItem'

import { MediaType, type MediaItem } from './model/forecast'
import type { Avalanche, Observation, ObservationKind } from './model/observation'
import type {
  MediaThumbnail,
  ZoneAvalanche,
  ZoneObservation,
  ZoneObservations,
} from './model/zoneObservations'
import { getAvalancheCenterMetadata, getAvalancheCenterPlatforms } from './nac'
import { cardMedia, observationCardMedia } from './observations/cards'
import { DEFAULT_LIST_STATE, defaultFilters } from './observations/filters'
import type { ListRequest } from './observations/listParams'
import { getObservationSource } from './sources'

const WINDOW_DAYS = 7

/** Matches the route's edge window: a new observation shows within 5 minutes. */
const CACHE_SECONDS = 300

/** The API's largest page. A zone's week has never come close, so later pages aren't read. */
const PAGE_SIZE = 100

/**
 * Whether a center shows the zone's Observations and Avalanches tabs: its `obs_tab` switch, as
 * the widget reads it, and an observations platform, without which `/observations` 404s.
 */
export async function showsZoneObservationTabs(centerSlug: string): Promise<boolean> {
  const [metadata, platforms] = await Promise.all([
    getAvalancheCenterMetadata(centerSlug),
    getAvalancheCenterPlatforms(centerSlug),
  ])
  return metadata.widget_config?.observation_viewer?.obs_tab === true && Boolean(platforms.obs)
}

/** Today and the six days before it, `YYYY-MM-DD` in the center's timezone. */
export function weekWindow(now: Date, timeZone: string): { from: string; to: string } {
  // en-CA formats a date as YYYY-MM-DD.
  const to = new Intl.DateTimeFormat('en-CA', { timeZone }).format(now)
  // Calendar-day arithmetic on the local date, so a DST change can't stretch or shrink the week.
  const from = new Date(`${to}T00:00:00Z`)
  from.setUTCDate(from.getUTCDate() - (WINDOW_DAYS - 1))
  return { from: from.toISOString().slice(0, 10), to }
}

/** The viewer's filters narrowed to this center's records in one zone and week. */
export function zoneListRequest<K extends ObservationKind>(
  kind: K,
  zoneId: number,
  window: { from: string; to: string },
): ListRequest & { kind: K } {
  return {
    kind,
    // A forecast zone's obs-API `zone_id` is its NAC zone id as a string.
    filters: { ...defaultFilters(window.to), ...window, zones: [String(zoneId)], onlyCenter: true },
    list: DEFAULT_LIST_STATE,
    pageSize: PAGE_SIZE,
  }
}

/** The card's thumbnail, drawn by its type as the widget's `Thumbnail` draws it. */
export function thumbnailOf(item: MediaItem | null): MediaThumbnail | null {
  if (!item) return null
  if (item.type === MediaType.Image || item.type === MediaType.Photo) {
    const src = getThumbnailUrl(item)
    return src ? { kind: 'image', src } : { kind: 'unknown' }
  }
  if (item.type === MediaType.Video) return { kind: 'video', src: getThumbnailUrl(item) }
  if (item.type === MediaType.PDF) return { kind: 'pdf' }
  if (item.type === MediaType.External) return { kind: 'external' }
  return { kind: 'unknown' }
}

interface Sortable {
  id: string
  date: string
  createdAt: string | null
}

function submittedMs(item: Sortable): number {
  return item.createdAt ? Date.parse(item.createdAt) || 0 : 0
}

/**
 * Newest date first, then newest submitted, then by id. The API's same-day order is arbitrary
 * (not its `created_at`), so the tie-breaks keep a refresh from reshuffling a day's cards.
 */
export function newestFirst<T extends Sortable>(items: T[]): T[] {
  return [...items].sort(
    (a, b) =>
      b.date.localeCompare(a.date) || submittedMs(b) - submittedMs(a) || a.id.localeCompare(b.id),
  )
}

function sorted<T extends Sortable>(items: T[]): Omit<T, 'createdAt'>[] {
  return newestFirst(items).map(({ createdAt: _createdAt, ...rest }) => rest)
}

export function toZoneObservation(observation: Observation): ZoneObservation & Sortable {
  const media = observationCardMedia(observation)
  return {
    id: observation.id,
    // Every record in a date-filtered list has its date.
    date: observation.startDate ?? '',
    createdAt: observation.createdAt,
    location: observation.locationName,
    observerType: observation.observer.type,
    organization: observation.observer.organization,
    avalanchesObserved: observation.instability.avalanchesObserved,
    instability: observation.instability.cracking || observation.instability.collapsing,
    thumbnail: thumbnailOf(media.thumbnail),
    mediaCount: media.count,
  }
}

export function toZoneAvalanche(avalanche: Avalanche): ZoneAvalanche & Sortable {
  const media = cardMedia(avalanche.media)
  return {
    id: avalanche.id,
    date: avalanche.date ?? '',
    createdAt: avalanche.createdAt,
    location: avalanche.locationName,
    number: avalanche.number,
    aspect: avalanche.aspect,
    elevation: avalanche.elevation,
    dSize: avalanche.dSize,
    trigger: avalanche.trigger,
    thumbnail: thumbnailOf(media.thumbnail),
    mediaCount: media.count,
  }
}

async function fetchZoneWeek(
  centerSlug: string,
  zoneId: number,
  window: { from: string; to: string },
): Promise<ZoneObservations> {
  const source = getObservationSource()
  const [observations, avalanches] = await Promise.all([
    source.listObservations(centerSlug, zoneListRequest('observation', zoneId, window)),
    source.listAvalanches(centerSlug, zoneListRequest('avalanche', zoneId, window)),
  ])
  return {
    window,
    observations: sorted(observations.items.map(toZoneObservation)),
    avalanches: sorted(avalanches.items.map(toZoneAvalanche)),
  }
}

/**
 * The zone's records for the week ending today, cached per zone. Throws when a request fails; the
 * caller answers with an error state.
 */
export async function getZoneObservations(
  centerSlug: string,
  zoneId: number,
  timeZone: string,
): Promise<ZoneObservations> {
  const window = weekWindow(new Date(), timeZone)
  return unstable_cache(
    () => fetchZoneWeek(centerSlug, zoneId, window),
    ['zone-observations', centerSlug, String(zoneId), window.from, window.to],
    { revalidate: CACHE_SECONDS },
  )()
}
