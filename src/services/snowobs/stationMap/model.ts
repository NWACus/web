/**
 * The station map's normalized model.
 *
 * What the map renders from: stations with their latest readings, the center's webcams, and the
 * forecast-zone outlines used to group them. Built server-side by `./mappers` from the SnowObs
 * and NAC responses; the client only ever sees this.
 */
import type { PolygonGeometry } from '@/utilities/geo/pointInPolygon'

/** The units SnowObs will report in. `default` lets the center's own configuration decide. */
export type StationMapUnits = 'default' | 'english' | 'metric'

export interface StationMapStation {
  /** SnowObs station id, unique within the center's source set. */
  stid: string
  name: string
  source: string
  /** `[lng, lat]`. */
  coordinates: [number, number]
  /** Feet in english units, meters in metric — whatever SnowObs was asked for. */
  elevation: number | null
  /** ISO-UTC time of the latest reading, or null when the station has never reported. */
  observedAt: string | null
  /** Latest reading per sensor. Absent sensors are absent; a sensor that read nothing is null. */
  data: Record<string, number | null>
  /** The forecast zone the station sits in, or `Other` when it is outside every zone. */
  zone: string
  /** The native station page, when this center has one for the station. */
  href: string | null
}

export interface StationMapWebcamImage {
  id: number
  title: string
  /** 'image', 'youtube' or 'url' — anything else is unknown and not rendered. */
  type: string
  source: string
}

export interface StationMapWebcam {
  id: number
  title: string
  coordinates: [number, number]
  images: StationMapWebcamImage[]
  zone: string
}

export interface StationMapZone {
  name: string
  geometry: PolygonGeometry
}

export interface StationMapVariable {
  variable: string
  longName: string
}

export interface StationMapData {
  stations: StationMapStation[]
  webcams: StationMapWebcam[]
  zones: StationMapZone[]
  /** Zone names in the center's own order, for the filter. */
  zoneNames: string[]
  variables: StationMapVariable[]
  /** Raw SnowObs unit per variable, e.g. `air_temp: 'fahrenheit'`. */
  units: Record<string, string>
  /** IANA timezone reading times are shown in — the center's, per inventory row X2. */
  timezone: string
  /** `true` when the webcam request failed; the map still renders, without them. */
  webcamsUnavailable: boolean
}
