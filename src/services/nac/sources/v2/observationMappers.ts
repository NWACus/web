/**
 * Pure mappers from the observation API's wire shapes to the observation model. The unit-tested
 * seam, as `./mappers.ts` is for the forecast products: everything the API gets loose — booleans in
 * JSON columns, numbers stored as text, half-null locations, hidden names that are sometimes `""`
 * — is settled here once, so no component carries the check.
 */
import { boundsOfGeometries } from '@/utilities/geo/bounds'

import type {
  AspectElevationRose,
  Avalanche,
  AvalancheImpacts,
  AvalancheStats,
  LatLng,
  Observation,
  ObservationInstability,
  ObservationPage,
  ObservationWeather,
  ObservationZoneOption,
  ObservationZoneRef,
  ObservedProblem,
  StatCount,
  StatsAggregation,
  StatsBucket,
} from '../../model/observation'
import type {
  AvalancheRecordWire,
  AvalancheStatsWire,
  CombinedZonesWire,
  ObservationInstabilityWire,
  ObservationRecordWire,
  ObservedProblemWire,
} from '../../types/observationSchemas'

type LooseNumber = number | string | null | undefined

/** A trimmed string, or null for absent and blank. */
function text(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/** A number stored as either type; blank and non-numeric text are null. */
export function toNumber(value: LooseNumber): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const trimmed = value.trim()
  if (trimmed === '') return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

/** A value the form stores as either type, as display text. */
function toText(value: LooseNumber): string | null {
  if (value === null || value === undefined) return null
  return text(String(value))
}

function toLocation(point: { lat?: number | null; lng?: number | null } | null | undefined) {
  if (!point || typeof point.lat !== 'number' || typeof point.lng !== 'number') return null
  const location: LatLng = { lat: point.lat, lng: point.lng }
  return location
}

function toZone(id: string | number | null | undefined, name: string | null | undefined) {
  const zone: ObservationZoneRef = {
    id: id === null || id === undefined || id === '' ? null : String(id),
    name: text(name),
  }
  return zone
}

/** The name only when the submitter chose to show it; the API sometimes sends `""` for hidden. */
function shownName(name: string | null | undefined, showName: boolean | null | undefined) {
  return showName ? text(name) : null
}

/**
 * A destructive size without the `D` some records carry (`"D2"` → `"2"`), so every consumer can
 * prefix its own. The widget printed `D` + the stored value, which showed those as "DD2".
 */
// Strips one leading D or d.
export function normalizeDSize(value: LooseNumber): string | null {
  const raw = toText(value)
  return raw ? raw.replace(/^[Dd]/, '') || null : null
}

/** What a record with no `instability` at all reports: nothing. */
const NO_INSTABILITY: NonNullable<ObservationInstabilityWire> = {
  avalanches_observed: false,
  avalanches_triggered: false,
  avalanches_caught: false,
  cracking: false,
  cracking_description: null,
  collapsing: false,
  collapsing_description: null,
}

function toInstability(wire: ObservationInstabilityWire): ObservationInstability {
  const instability = wire ?? NO_INSTABILITY
  return {
    avalanchesObserved: instability.avalanches_observed,
    avalanchesTriggered: instability.avalanches_triggered,
    avalanchesCaught: instability.avalanches_caught,
    cracking: instability.cracking,
    crackingDescription: text(instability.cracking_description),
    collapsing: instability.collapsing,
    collapsingDescription: text(instability.collapsing_description),
  }
}

/** Who submitted a record; only an observation carries its organization's URL. */
function toObserver(
  wire: Pick<ObservationRecordWire, 'observer_type' | 'name' | 'show_name' | 'organization'>,
  organizationUrl: string | null,
) {
  return {
    type: text(wire.observer_type) ?? 'public',
    name: shownName(wire.name, wire.show_name),
    organization: text(wire.organization),
    organizationUrl,
  }
}

function toImpacts(wire: AvalancheRecordWire): AvalancheImpacts {
  const count = (value: LooseNumber) => toNumber(value) ?? 0
  return {
    humansCaught: count(wire.humans_caught),
    humansPartBuriedNonCritical: count(wire.humans_part_buried_non_crit),
    humansPartBuriedCritical: count(wire.humans_part_buried_crit),
    humansFullyBuried: count(wire.humans_fully_buried),
    humansInjured: count(wire.humans_injured),
    humansKilled: count(wire.humans_killed),
    vehiclesHit: count(wire.vehicles_hit),
    vehiclesFullyBuried: count(wire.vehicles_fully_buried),
    vehiclesDamaged: count(wire.vehicles_damaged),
    vehiclesDamageCost: count(wire.vehicles_damage_cost),
    structuresHit: count(wire.structures_hit),
    structuresDamaged: count(wire.structures_damaged),
    structuresDestroyed: count(wire.structures_destroyed),
    structuresDamageCost: count(wire.structures_damage_cost),
  }
}

export function mapAvalanche(wire: AvalancheRecordWire): Avalanche {
  return {
    kind: 'avalanche',
    id: wire.id,
    observationId: text(wire.observation_id),
    centerId: text(wire.center_id),
    obsSource: text(wire.obs_source),
    createdAt: wire.created_at,
    observer: toObserver(wire, null),
    forecasterVerified: wire.forecaster_verified ?? false,
    forecasterEdited: wire.forecaster_edited ?? false,
    forecasterEditedReason: text(wire.forecaster_edited_reason),
    obsDate: text(wire.obs_date),
    date: text(wire.date),
    dateKnown: wire.date_known ?? false,
    time: text(wire.time),
    timeKnown: wire.time_known ?? false,
    location: toLocation(wire.location_point),
    locationName: text(wire.location_name),
    zone: toZone(wire.zone_id, wire.zone_name),
    number: toNumber(wire.number),
    aspect: text(wire.aspect),
    aspectRange: wire.aspect_range ?? [],
    elevation: toNumber(wire.elevation),
    avalancheType: text(wire.avalanche_type),
    avalancheProblem: text(wire.avalanche_problem),
    trigger: text(wire.trigger),
    cause: text(wire.cause),
    bedSurface: text(wire.bed_sfc),
    avgCrownDepth: toNumber(wire.avg_crown_depth),
    dSize: normalizeDSize(wire.d_size),
    rSize: normalizeRSize(wire.r_size),
    weakLayerDate: text(wire.weak_layer_date),
    weakLayerType: text(wire.weak_layer_type),
    width: toNumber(wire.width),
    verticalFall: toNumber(wire.vertical_fall),
    slopeAngle: toNumber(wire.slope_angle),
    terminus: text(wire.terminus),
    media: wire.media,
    attachmentUrl: text(wire.attachment_url),
    attachmentDescription: text(wire.attachment_description),
    comments: text(wire.comments),
    impacts: toImpacts(wire),
    impactsComments: text(wire.impacts_comments),
  }
}

// Strips one leading R or r, as `normalizeDSize` does for D.
function normalizeRSize(value: LooseNumber): string | null {
  const raw = toText(value)
  return raw ? raw.replace(/^[Rr]/, '') || null : null
}

function toTimeInField(fields: ObservationRecordWire['advanced_fields']) {
  const start = toNumber(fields?.time_in_field?.start)
  const end = toNumber(fields?.time_in_field?.end)
  return start === null || end === null ? null : { start, end }
}

function toWeather(fields: ObservationRecordWire['advanced_fields']): ObservationWeather | null {
  const weather = fields?.weather
  if (!weather) return null
  return {
    airTemp: toText(weather.air_temp),
    cloudCover: text(weather.cloud_cover),
    windLoading: text(weather.wind_loading),
    rainElevation: toText(weather.rain_elevation),
    recentSnowfall: toText(weather.recent_snowfall),
    snowAvailableForTransport: text(weather.snow_avail_for_transport),
  }
}

/** One end of a problem's size range as the widget reads it: a number, `""` or `"unknown"`. */
function sizeEnd(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function toProblem(wire: ObservedProblemWire): ObservedProblem | null {
  const type = text(wire.type)
  // A problem with no type is an empty row the long form left behind; there is nothing to title.
  if (!type) return null
  const [min, max] = wire.d_size ?? []
  return {
    type,
    depth: toText(wire.depth),
    layer: text(wire.layer),
    size: [sizeEnd(min), sizeEnd(max)],
    comments: text(wire.comments),
    locations: wire.location ?? [],
    sensitivity: text(wire.sensitivity),
    distribution: text(wire.distribution),
  }
}

export function mapObservation(wire: ObservationRecordWire): Observation {
  const fields = wire.advanced_fields
  return {
    kind: 'observation',
    id: wire.id,
    centerId: text(wire.center_id),
    obsSource: text(wire.obs_source),
    createdAt: wire.created_at,
    observer: toObserver(wire, text(wire.organization_url)),
    startDate: text(wire.start_date),
    endDate: text(wire.end_date),
    timeInField: toTimeInField(fields),
    activity: wire.activity ?? [],
    location: toLocation(wire.location_point),
    locationName: text(wire.location_name),
    route: text(wire.route),
    zone: toZone(wire.zone_id, wire.zone_name),
    instability: toInstability(wire.instability),
    instabilitySummary: text(wire.instability_summary),
    summary: text(wire.observation_summary),
    media: wire.media,
    urls: (wire.urls ?? []).filter((url) => url.trim() !== ''),
    avalanchesSummary: text(wire.avalanches_summary),
    avalanches: (wire.avalanches ?? []).map(mapAvalanche),
    weather: toWeather(fields),
    weatherSummary: text(fields?.weather_summary),
    snowpackSummary: text(fields?.snowpack_summary),
    snowpackMedia: fields?.snowpack_media ?? [],
    problems: (fields?.avalanche_problems ?? []).flatMap((problem) => toProblem(problem) ?? []),
    problemsComments: text(fields?.avalanche_problems_comments),
  }
}

interface ListEnvelopeWire<T> {
  total: number
  pages: number
  current_page: number
  avalanche_total_number?: number | null
  results: T[]
}

export function mapPage<W, M>(
  wire: ListEnvelopeWire<W>,
  mapItem: (item: W) => M,
): ObservationPage<M> {
  return {
    items: wire.results.map(mapItem),
    total: wire.total,
    pages: wire.pages,
    page: wire.current_page,
    avalancheCount: wire.avalanche_total_number ?? null,
  }
}

/**
 * The zone filter's options: forecast zones first, then observation zones, each by name — the
 * widget's order (priority, then name). Obs-only zones can be shared between centers.
 */
export function mapCombinedZones(wire: CombinedZonesWire): ObservationZoneOption[] {
  return wire
    .map((zone): ObservationZoneOption => {
      const type = zone.zone_type === 'obs_zone' ? 'observation' : 'forecast'
      return {
        id: zone.zone_id,
        name: zone.name,
        type,
        centerIds: zone.center_id ?? [],
        priority: zone.priority ?? (type === 'forecast' ? 1 : 2),
        bounds: zone.geom ? boundsOfGeometries([zone.geom]) : null,
      }
    })
    .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name))
}

// ─── Stats ──────────────────────────────────────────────────────────────────

function toStatCount(wire: { name: string; num_avalanches: number; show_label?: boolean | null }) {
  const count: StatCount = {
    name: wire.name,
    count: wire.num_avalanches,
    showLabel: wire.show_label === true,
  }
  return count
}

type StatsWire = AvalancheStatsWire['stats']

/** Buckets with a `period_end` are weeks or months; a plain day is its own period. */
function toBucket<K extends string>(
  wire: { date: string; period_end?: string | null },
  counts: Record<K, number>,
): StatsBucket<K> {
  return { date: wire.date, periodEnd: wire.period_end ?? wire.date, counts }
}

function sizeBuckets(series: StatsWire['time_series']) {
  return series.map((bucket) =>
    toBucket(bucket, {
      D1: bucket.D1 ?? 0,
      D2: bucket.D2 ?? 0,
      D3: bucket.D3 ?? 0,
      'D4-5': bucket['D4-5'] ?? 0,
    }),
  )
}

function instabilityBuckets(series: StatsWire['instability_time_series']) {
  return series.map((bucket) =>
    toBucket(bucket, {
      avalanchesObserved: bucket.avalanches_observed ?? 0,
      crackingCollapsing: bucket.cracking_collapsing_observed ?? 0,
      noInstability: bucket.no_instability_observed ?? 0,
    }),
  )
}

/** The API marks every bucket the same way; an unmarked series is daily. */
function aggregationOf(series: StatsWire['time_series']): StatsAggregation {
  return series.find((bucket) => bucket.aggregation)?.aggregation ?? 'daily'
}

/** The bands in index order, each described once however many aspects report it. */
function toRose(wire: StatsWire['aspect_elevation']): AspectElevationRose {
  const bands: AspectElevationRose['bands'] = []
  for (const cell of wire?.aggregated_data ?? []) {
    bands[cell.bin_index] = { label: cell.bin_label, from: cell.bin_start, to: cell.bin_end }
  }
  return {
    bands: bands.map((band) => band ?? { label: '', from: 0, to: 0 }),
    cells: (wire?.aggregated_data ?? []).map((cell) => ({
      aspect: cell.aspect,
      band: cell.bin_index,
      count: cell.count,
    })),
  }
}

export function mapAvalancheStats(wire: AvalancheStatsWire): AvalancheStats {
  const { stats, metadata } = wire
  return {
    totalAvalanches: metadata.total_avalanches ?? 0,
    groupedBy: metadata.aggregation_type === 'center' ? 'center' : 'zone',
    zones: stats.zone.map(toStatCount),
    triggers: stats.trigger.map(toStatCount),
    sizes: stats.size.map(toStatCount),
    problems: stats.problem_type.map(toStatCount),
    aggregation: aggregationOf(stats.time_series),
    avalanchesOverTime: sizeBuckets(stats.time_series),
    instabilityOverTime: instabilityBuckets(stats.instability_time_series),
    rose: toRose(stats.aspect_elevation),
  }
}
