/**
 * The zone's last 7 days of observations and avalanches, read the way the widget's forecast tab
 * reads them (`ObservationTab.vue`): one GraphQL request for the center's week, kept when the
 * record's point falls inside the zone's map-layer polygon, newest date first. Same-day records
 * keep the API's order, which is what the widget shows.
 *
 * Server-only: the obs API rejects requests without an allowlisted `Origin`, which a server fetch
 * can send from any host, previews included.
 */
import { unstable_cache } from 'next/cache'
import { z } from 'zod'

import { pointInPolygon } from '@/utilities/geo/pointInPolygon'
import { getZoneMapLayer } from './dangerMap/mapLayer'
import { ALLOWLISTED_ORIGIN, nacApiHost } from './hosts'

import type { ZoneGeometry } from './model/mapLayer'
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

const pointSchema = z.object({ lat: z.number().nullable(), lng: z.number().nullable() }).nullable()

const observationSchema = z.object({
  id: z.string(),
  startDate: z.string(),
  locationName: z.string().nullable(),
  locationPoint: pointSchema.catch(null),
  observerType: z.string().nullable(),
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
  locationName: z.string().nullable(),
  locationPoint: pointSchema.catch(null),
  number: z.number().nullable(),
  aspect: z.string().nullable(),
  elevation: z.number().nullable(),
  dSize: z.string().nullable(),
  trigger: z.string().nullable(),
  media: mediaListSchema,
})

const responseSchema = z.object({
  data: z.object({
    getObservationList: z.array(observationSchema),
    getAvalancheObservationList: z.array(avalancheSchema),
  }),
})

type Media = z.infer<typeof mediaSchema>
type Point = z.infer<typeof pointSchema>

/** The widget's query (`ObservationTab.vue`), trimmed to the fields its cards read. */
function weekQuery(centerId: string, from: string, to: string): string {
  return `{
    getObservationList(centerId: "${centerId}", startDate: "${from}", endDate: "${to}") {
      id startDate locationName locationPoint { lat lng } observerType organization instability media
      avalanches { media }
    }
    getAvalancheObservationList(centerId: "${centerId}", startDate: "${from}", endDate: "${to}") {
      id date locationName locationPoint { lat lng } number aspect elevation dSize trigger media
    }
  }`
}

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

/** Whether a record's point is inside the zone, as the widget's turf `booleanPointInPolygon` decides. */
export function isInZone(point: Point, geometry: ZoneGeometry): boolean {
  if (point?.lat == null || point.lng == null) return false
  return pointInPolygon([point.lng, point.lat], geometry)
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

/** Newest date first. `sort` is stable, so same-day records keep the API's order, as in the widget. */
export function newestFirst<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.date.localeCompare(a.date))
}

interface Located {
  point: Point
}

type CenterWeek = {
  observations: (ZoneObservation & Located)[]
  avalanches: (ZoneAvalanche & Located)[]
}

function toObservation(r: z.infer<typeof observationSchema>): ZoneObservation & Located {
  const instability = r.instability ?? {}
  return {
    id: r.id,
    date: r.startDate,
    location: r.locationName || null,
    observerType: r.observerType || null,
    organization: r.organization || null,
    avalanchesObserved: Boolean(instability.avalanches_observed),
    instability: Boolean(instability.cracking || instability.collapsing),
    ...withMedia(observationMedia(r.media ?? [], r.avalanches ?? [])),
    point: r.locationPoint,
  }
}

function toAvalanche(r: z.infer<typeof avalancheSchema>): ZoneAvalanche & Located {
  return {
    id: r.id,
    date: r.date,
    location: r.locationName || null,
    number: r.number,
    aspect: r.aspect,
    elevation: r.elevation,
    dSize: r.dSize,
    trigger: r.trigger,
    ...withMedia(r.media ?? []),
    point: r.locationPoint,
  }
}

/** The center's week, mapped to what the cards read; cached once for all of its zones. */
export function toCenterWeek(body: unknown): CenterWeek {
  const { data } = responseSchema.parse(body)
  return {
    observations: data.getObservationList.map(toObservation),
    avalanches: data.getAvalancheObservationList.map(toAvalanche),
  }
}

function keepInZone<T extends Located & { date: string }>(
  items: T[],
  geometry: ZoneGeometry,
): Omit<T, 'point'>[] {
  return newestFirst(items.filter((item) => isInZone(item.point, geometry))).map(
    ({ point: _point, ...rest }) => rest,
  )
}

/** The zone's records from the center's week, newest first, without their points. */
export function inZone(
  week: CenterWeek,
  geometry: ZoneGeometry,
  window: { from: string; to: string },
): ZoneObservations {
  return {
    window,
    observations: keepInZone(week.observations, geometry),
    avalanches: keepInZone(week.avalanches, geometry),
  }
}

async function fetchCenterWeek(
  centerId: string,
  window: { from: string; to: string },
): Promise<CenterWeek> {
  const res = await fetch(`${nacApiHost}/obs/v1/public/graphql`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ALLOWLISTED_ORIGIN },
    body: JSON.stringify({ query: weekQuery(centerId, window.from, window.to) }),
    cache: 'no-store',
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`Observations request failed with status ${res.status}`)
  return toCenterWeek(await res.json())
}

/**
 * The zone's records for the week ending today. Throws when the zone has no outline or the
 * request fails; the caller answers with an error state.
 */
export async function getZoneObservations(
  centerSlug: string,
  /** The NAC center id from the center's metadata (`SNFAC`), which the obs API takes. */
  centerId: string,
  zoneId: number,
  timeZone: string,
): Promise<ZoneObservations> {
  const window = weekWindow(new Date(), timeZone)
  // One upstream request per center and week, shared by every zone's tab.
  const cachedWeek = unstable_cache(
    () => fetchCenterWeek(centerId, window),
    ['zone-observations-week', centerId, window.from, window.to],
    { revalidate: CACHE_SECONDS },
  )

  const [mapLayer, week] = await Promise.all([getZoneMapLayer(centerSlug), cachedWeek()])

  const geometry = mapLayer.features.find((f) => f.id != null && Number(f.id) === zoneId)?.geometry
  if (!geometry) throw new Error(`No map-layer outline for zone ${zoneId}`)

  return inZone(week, geometry, window)
}
