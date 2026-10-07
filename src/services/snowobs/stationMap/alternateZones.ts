/**
 * A center's alternate station-map zones, from the KML its `widget_config.stations.alternate_zones`
 * points at.
 *
 * Fetched server-side with the same caching discipline as the other upstream reads. A failure of
 * any kind — bad URL, unreachable host, a file with no polygons — resolves to `null`, and the
 * caller falls back to the forecast zones, so a broken KML degrades the zone filter rather than
 * the map.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { parseKmlZones } from './kml'
import type { StationMapZone } from './model'

/** Forecasters redraw these rarely; an hour matches the webcam list. */
const ALTERNATE_ZONES_REVALIDATE = 3600

/** Only web URLs — the config is forecaster-entered text, not something to hand `fetch` blindly. */
function isHttpUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url)
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

// Best-effort logging: bootstrapping payload must never mask the original failure.
async function logFailure(url: string, error: unknown): Promise<void> {
  try {
    const payload = await getPayload({ config })
    payload.logger.warn({ err: error, url }, 'Alternate station-map zones unavailable')
  } catch {
    console.error('Alternate station-map zones unavailable (payload logger unavailable)', {
      url,
      error,
    })
  }
}

async function loadKmlZones(url: string): Promise<StationMapZone[]> {
  if (!isHttpUrl(url)) throw new Error('Not an http(s) URL')
  const res = await fetch(url, { next: { revalidate: ALTERNATE_ZONES_REVALIDATE } })
  if (!res.ok) throw new Error(`KML request failed with status ${res.status}`)
  const zones = parseKmlZones(await res.text())
  if (zones.length === 0) throw new Error('KML contains no named polygons')
  return zones
}

export async function fetchAlternateZones(url: string): Promise<StationMapZone[] | null> {
  try {
    return await loadKmlZones(url)
  } catch (error) {
    await logFailure(url, error)
    return null
  }
}
