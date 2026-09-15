/**
 * SnowObs and NAC responses → the station map model.
 *
 * Pure functions, so the seam is unit tested: a station with no coordinates is dropped (it cannot
 * be placed), every station is classified into the forecast zone it sits in, and the stations
 * this center has native pages for get their link here rather than in the component.
 */
import { getStationGroupByStid } from '@/constants/weatherStations'
import type { ZoneMapLayer } from '@/services/nac/model/mapLayer'
import { pointInPolygon } from '@/utilities/geo/pointInPolygon'

import type { SnowObsCurrentGeojson, SnowObsWebcamResponse } from '../types/schemas'
import { normalizeSource } from './format'
import type {
  StationMapStation,
  StationMapWebcam,
  StationMapWebcamImage,
  StationMapZone,
} from './model'

/** The zone a point outside every polygon lands in, as the widget names it. */
export const OTHER_ZONE = 'Other'

export function classifyZone(coordinates: [number, number], zones: StationMapZone[]): string {
  return zones.find((zone) => pointInPolygon(coordinates, zone.geometry))?.name ?? OTHER_ZONE
}

/** Zones with drawable geometry; a zone whose outline failed validation upstream has no shape. */
export function zonesFromMapLayer(mapLayer: ZoneMapLayer): StationMapZone[] {
  return mapLayer.features.flatMap((feature) =>
    feature.geometry ? [{ name: feature.properties.name, geometry: feature.geometry }] : [],
  )
}

/**
 * The filter's names for a center's alternate zones: the KML's placemarks in file order, then
 * `Other` for everything outside them — the widget's `zoneNames` when alternates are loaded.
 */
export function alternateZoneNames(zones: StationMapZone[]): string[] {
  return Array.from(new Set([...zones.map((zone) => zone.name), OTHER_ZONE]))
}

/**
 * Zone names in the order the center lists them, with any the map layer knows but the center's
 * list doesn't at the end. The widget's zone filter walks the center's own active list.
 */
export function orderZoneNames(activeZoneNames: string[], zones: StationMapZone[]): string[] {
  const known = new Set(zones.map((zone) => zone.name))
  const listed = activeZoneNames.filter((name) => known.has(name))
  const rest = zones.map((zone) => zone.name).filter((name) => !listed.includes(name))
  return Array.from(new Set([...listed, ...rest]))
}

function toCoordinates(coordinates: number[] | null | undefined): [number, number] | null {
  if (!coordinates || coordinates.length < 2) return null
  const [lng, lat] = coordinates
  return Number.isFinite(lng) && Number.isFinite(lat) ? [lng, lat] : null
}

function numericReadings(data: Record<string, number | string | null>): {
  observedAt: string | null
  readings: Record<string, number | null>
} {
  const readings: Record<string, number | null> = {}
  let observedAt: string | null = null
  for (const [variable, value] of Object.entries(data)) {
    if (variable === 'date_time') {
      observedAt = typeof value === 'string' ? value : null
    } else if (typeof value === 'number' || value === null) {
      readings[variable] = value
    }
  }
  return { observedAt, readings }
}

/**
 * The native station page for a SnowObs station, when this center has one.
 *
 * The registry is NWAC's (see `STATIONS_TENANT_SLUG`); a station whose stid it lists links to
 * that group's page, and every other station — other centers' loggers, SNOTEL, Synoptic — has
 * no native page to go to.
 */
export function stationHref(
  centerSlug: string,
  stid: string,
  stationsTenantSlug: string,
): string | null {
  if (centerSlug !== stationsTenantSlug) return null
  const group = getStationGroupByStid(stid)
  return group ? `/weather/stations/${group.slug}` : null
}

export interface MapStationsOptions {
  centerSlug: string
  stationsTenantSlug: string
  zones: StationMapZone[]
}

export function mapStations(
  geojson: SnowObsCurrentGeojson,
  { centerSlug, stationsTenantSlug, zones }: MapStationsOptions,
): StationMapStation[] {
  return geojson.features.flatMap((feature) => {
    const { properties } = feature
    const coordinates =
      toCoordinates(feature.geometry?.coordinates) ??
      toCoordinates([properties.longitude ?? NaN, properties.latitude ?? NaN])
    if (!coordinates) return []

    const { observedAt, readings } = numericReadings(properties.data)
    return [
      {
        stid: properties.stid,
        name: properties.name ?? properties.stid,
        source: normalizeSource(properties.source),
        coordinates,
        elevation: properties.elevation ?? null,
        observedAt,
        data: readings,
        zone: classifyZone(coordinates, zones),
        href: stationHref(centerSlug, properties.stid, stationsTenantSlug),
      },
    ]
  })
}

function mapWebcamImages(
  images: SnowObsWebcamResponse['webcam'][number]['webcam_image'],
): StationMapWebcamImage[] {
  return images.flatMap((image) =>
    image.image_source
      ? [
          {
            id: image.id,
            title: image.image_title ?? '',
            type: image.image_type,
            source: image.image_source,
          },
        ]
      : [],
  )
}

export function mapWebcams(
  response: SnowObsWebcamResponse,
  zones: StationMapZone[],
): StationMapWebcam[] {
  return response.webcam.flatMap((webcam) => {
    const coordinates = toCoordinates(webcam.location?.geometry?.coordinates)
    if (!coordinates) return []
    return [
      {
        id: webcam.id,
        title: webcam.webcam_title ?? 'Webcam',
        coordinates,
        images: mapWebcamImages(webcam.webcam_image),
        zone: classifyZone(coordinates, zones),
      },
    ]
  })
}
