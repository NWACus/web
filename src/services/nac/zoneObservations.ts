/**
 * The zone's last 7 days of observations and avalanches, from the obs API's REST lists (what NAC's
 * newer observations viewer reads): the API filters by forecast zone, and the records are sorted
 * newest date first, then newest submitted.
 *
 * Server-only: the obs API rejects requests without an allowlisted `Origin`, which a server fetch
 * can send from any host, previews included.
 */
import { unstable_cache } from 'next/cache'
import { z } from 'zod'

import { ALLOWLISTED_ORIGIN, nacApiHost } from './hosts'

import type {
  MediaThumbnail,
  ZoneAvalanche,
  ZoneObservation,
  ZoneObservations,
} from './model/zoneObservations'
import { getAvalancheCenterMetadata, getAvalancheCenterPlatforms } from './nac'

const WINDOW_DAYS = 7

/** Matches the route's edge window: a new observation shows within 5 minutes. */
const CACHE_SECONDS = 300

/** Longer than the obs API ever takes when it's up; a hung request shouldn't hold the function. */
const UPSTREAM_TIMEOUT_MS = 10_000

/** The API's largest page. A zone's week has never come close, so later pages aren't read. */
const PAGE_SIZE = 100

const mediaSchema = z
  .object({
    type: z.string().optional(),
    url: z
      .union([
        z.string(),
        z.object({ thumbnail: z.string().optional(), medium: z.string().optional() }),
      ])
      .optional(),
  })
  .catch({})

const mediaListSchema = z.array(mediaSchema).nullable().catch([])

const observationSchema = z.object({
  id: z.string(),
  start_date: z.string(),
  created_at: z.string().nullable().catch(null),
  location_name: z.string().nullable(),
  observer_type: z.string().nullable(),
  organization: z.string().nullable(),
  instability: z
    .object({
      cracking: z.boolean().optional(),
      collapsing: z.boolean().optional(),
      avalanches_observed: z.boolean().optional(),
    })
    .nullable()
    .catch(null),
  media: mediaListSchema,
  avalanches: z
    .array(z.object({ media: mediaListSchema }))
    .nullable()
    .catch([]),
})

const avalancheSchema = z.object({
  id: z.string(),
  date: z.string(),
  created_at: z.string().nullable().catch(null),
  location_name: z.string().nullable(),
  number: z.number().nullable(),
  aspect: z.string().nullable(),
  elevation: z.number().nullable(),
  d_size: z.string().nullable(),
  trigger: z.string().nullable(),
  media: mediaListSchema,
})

const listSchema = <T extends z.ZodTypeAny>(record: T) => z.object({ results: z.array(record) })

type Media = z.infer<typeof mediaSchema>

/**
 * Whether the center shows the zone's Observations and Avalanches tabs: its `obs_tab` switch, as
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

function imageSrc(item: Media): string | null {
  if (typeof item.url === 'string') return item.url
  return item.url?.thumbnail ?? item.url?.medium ?? null
}

/**
 * The widget's choice: the first `image`, else the first item, drawn by its type as `Thumbnail`
 * draws it (a photo or video frame, a link or PDF tile, or nothing for any other type).
 */
export function thumbnailOf(media: Media[]): MediaThumbnail | null {
  const item = media.find((m) => m.type === 'image') ?? media[0]
  if (!item) return null

  const src = imageSrc(item)
  if ((item.type === 'image' || item.type === 'photo') && src) return { kind: 'image', src }
  if (item.type === 'video') return { kind: 'video', src }
  if (item.type === 'pdf' || item.type === 'external') return { kind: item.type }
  return { kind: 'unknown' }
}

function withMedia(media: Media[]) {
  return { thumbnail: thumbnailOf(media), mediaCount: media.length }
}

/**
 * The widget's `media`: an observation with no media of its own shows none, even when its
 * avalanches have some; otherwise its avalanches' media follows its own.
 */
export function observationMedia(own: Media[], avalanches: { media: Media[] | null }[]): Media[] {
  if (own.length === 0) return []
  return [...own, ...avalanches.flatMap((a) => a.media ?? [])]
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

function toObservation(r: z.infer<typeof observationSchema>): ZoneObservation & Sortable {
  const instability = r.instability ?? {}
  return {
    id: r.id,
    date: r.start_date,
    createdAt: r.created_at,
    location: r.location_name || null,
    observerType: r.observer_type || null,
    organization: r.organization || null,
    avalanchesObserved: Boolean(instability.avalanches_observed),
    instability: Boolean(instability.cracking || instability.collapsing),
    ...withMedia(observationMedia(r.media ?? [], r.avalanches ?? [])),
  }
}

function toAvalanche(r: z.infer<typeof avalancheSchema>): ZoneAvalanche & Sortable {
  return {
    id: r.id,
    date: r.date,
    createdAt: r.created_at,
    location: r.location_name || null,
    number: r.number,
    aspect: r.aspect,
    elevation: r.elevation,
    dSize: r.d_size,
    trigger: r.trigger,
    ...withMedia(r.media ?? []),
  }
}

function sorted<T extends Sortable>(items: T[]): Omit<T, 'createdAt'>[] {
  return newestFirst(items).map(({ createdAt: _createdAt, ...rest }) => rest)
}

/** A list response's observations, mapped to what the cards read, newest first. */
export function toObservations(body: unknown): ZoneObservation[] {
  return sorted(listSchema(observationSchema).parse(body).results.map(toObservation))
}

/** A list response's avalanches, mapped to what the cards read, newest first. */
export function toAvalanches(body: unknown): ZoneAvalanche[] {
  return sorted(listSchema(avalancheSchema).parse(body).results.map(toAvalanche))
}

/**
 * A REST list's URL for the zone and week. The operator forms are required: the plain
 * `start_date`/`end_date` params filter differently, and the avalanche list ignores them.
 */
export function listUrl(
  list: 'observation' | 'avalanche_observation',
  centerId: string,
  zoneId: number,
  window: { from: string; to: string },
): string {
  const dateField = list === 'observation' ? 'start_date' : 'date'
  const params = new URLSearchParams({
    'center_id[eq]': centerId.toLowerCase(),
    // A forecast zone's `zone_id` is its NAC zone id as a string.
    'zone_id[in]': String(zoneId),
    [`${dateField}[gte]`]: window.from,
    [`${dateField}[lte]`]: window.to,
    page_size: String(PAGE_SIZE),
    sort_by: dateField,
    sort_order: 'DESC',
  })
  // The trailing slash is required.
  return `${nacApiHost}/obs/v1/public/${list}/list/?${params}`
}

async function fetchList(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { origin: ALLOWLISTED_ORIGIN },
    cache: 'no-store',
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`Observations request failed with status ${res.status}`)
  return res.json()
}

async function fetchZoneWeek(
  centerId: string,
  zoneId: number,
  window: { from: string; to: string },
): Promise<ZoneObservations> {
  const [observations, avalanches] = await Promise.all([
    fetchList(listUrl('observation', centerId, zoneId, window)),
    fetchList(listUrl('avalanche_observation', centerId, zoneId, window)),
  ])
  return {
    window,
    observations: toObservations(observations),
    avalanches: toAvalanches(avalanches),
  }
}

/**
 * The zone's records for the week ending today, cached per zone. Throws when a request fails; the
 * caller answers with an error state.
 */
export async function getZoneObservations(
  /** The NAC center id from the center's metadata (`SNFAC`). */
  centerId: string,
  zoneId: number,
  timeZone: string,
): Promise<ZoneObservations> {
  const window = weekWindow(new Date(), timeZone)
  return unstable_cache(
    () => fetchZoneWeek(centerId, zoneId, window),
    ['zone-observations', centerId, String(zoneId), window.from, window.to],
    { revalidate: CACHE_SECONDS },
  )()
}
