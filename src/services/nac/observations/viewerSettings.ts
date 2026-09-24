/**
 * The observation viewer's per-center configuration, normalized from the center's NAC metadata
 * (`widget_config.observation_viewer`, written by dashboard-v2) the way the legacy widget's
 * `center` store resolves it, so a center sees the same viewer here as in its embed.
 */
import type { LatLng, ObservationZoneOption } from '../model/observation'
import type { AvalancheCenter } from '../types/schemas'
import { DEFAULT_START_SEASON } from './filters'

export interface ObservationViewerSettings {
  /** The upstream center id, uppercase (`NWAC`; dvac reads NWAC's records). */
  centerId: string
  /** How "Only {center}" names it; the widget shortens a couple of ids. */
  centerLabel: string
  /** The center's timezone: "today", and every date the viewer shows, are the center's. */
  timezone: string
  /** Opening camera before the responsive adjustment; null when the center configures neither. */
  mapCenter: LatLng | null
  mapZoom: number | null
  showZoneFilter: boolean
  /** Outline every NAC center's zones, not only this center's. */
  allZones: boolean
  startSeason: number
  /** Forecast zones in the center's rank order, then observation zones by name. */
  zones: ObservationZoneOption[]
}

/** The widget's display names for two ids whose public names differ. */
const CENTER_LABELS: Record<string, string> = { SNFAC: 'SAC', COAA: 'COAC' }

type Widgets = AvalancheCenter['widget_config']
type ViewerConfig = NonNullable<Widgets['observation_viewer']>

function finite(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function toLatLng(point: { lat?: number | null; lng?: number | null } | undefined): LatLng | null {
  if (!point) return null
  const lat = finite(point.lat)
  const lng = finite(point.lng)
  return lat === null || lng === null ? null : { lat, lng }
}

/** The danger map's zoom is on Google's scale, one level in from Mapbox's. */
function dangerMapZoom(widgets: Widgets): number | null {
  const zoom = finite(widgets.danger_map?.zoom)
  return zoom === null ? null : zoom - 1
}

function cameraCenter(viewer: ViewerConfig | undefined, widgets: Widgets): LatLng | null {
  return toLatLng(viewer?.map_center) ?? toLatLng(widgets.danger_map?.center)
}

function cameraZoom(viewer: ViewerConfig | undefined, widgets: Widgets): number | null {
  return finite(viewer?.map_zoom) ?? dangerMapZoom(widgets)
}

/** The widget's camera fallbacks: the observation viewer's own settings, else the danger map's. */
function openingCamera(widgets: Widgets) {
  const viewer = widgets.observation_viewer
  return { mapCenter: cameraCenter(viewer, widgets), mapZoom: cameraZoom(viewer, widgets) }
}

function startSeason(viewer: ViewerConfig | undefined): number {
  const year = Number(viewer?.obs_start_year)
  return Number.isInteger(year) && year > 2000 ? year : DEFAULT_START_SEASON
}

/** A flag the dashboard writes only to turn something off; unset means on. */
function unlessOff(value: boolean | undefined): boolean {
  return value !== false
}

function rankIn(centerZones: AvalancheCenter['zones'], zone: ObservationZoneOption): number {
  const match = centerZones.find(
    (candidate) => candidate.name === zone.name && candidate.status === 'active',
  )
  return match && 'rank' in match && match.rank !== null ? match.rank : 9999
}

/**
 * Forecast zones in the order the center ranks them (the widget's `forecastZonesList`), then the
 * observation-only zones alphabetically.
 */
export function orderZones(
  zones: ObservationZoneOption[],
  centerZones: AvalancheCenter['zones'],
): ObservationZoneOption[] {
  const forecast = zones
    .filter((zone) => zone.type === 'forecast')
    .map((zone) => ({ zone, rank: rankIn(centerZones, zone) }))
    .sort((a, b) => a.rank - b.rank)
    .map(({ zone }) => zone)
  const observation = zones
    .filter((zone) => zone.type === 'observation')
    .sort((a, b) => a.name.localeCompare(b.name))
  return [...forecast, ...observation]
}

export function resolveObservationViewerSettings(
  metadata: AvalancheCenter,
  zones: ObservationZoneOption[],
): ObservationViewerSettings {
  const viewer = metadata.widget_config.observation_viewer
  const centerId = metadata.id.toUpperCase()
  return {
    centerId,
    centerLabel: CENTER_LABELS[centerId] ?? centerId,
    timezone: metadata.timezone,
    ...openingCamera(metadata.widget_config),
    showZoneFilter: unlessOff(viewer?.show_zone_filter),
    allZones: unlessOff(viewer?.show_all_zones),
    startSeason: startSeason(viewer),
    zones: orderZones(zones, metadata.zones),
  }
}
