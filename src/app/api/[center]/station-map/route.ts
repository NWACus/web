// False positive: fallow reads `(payload)/api/[...slug]` and `api/[center]` as one dynamic path
// and predicts a runtime crash. Route groups keep the two trees separate — verified against a
// production build for the sibling danger-map and freshness routes.
// fallow-ignore-file dynamic-segment-name-conflicts
import { STATIONS_TENANT_SLUG } from '@/constants/weatherStations'
import { getZoneMapLayer } from '@/services/nac/dangerMap/mapLayer'
import { getAvalancheCenterMetadata } from '@/services/nac/nac'
import { AvalancheForecastZoneStatus } from '@/services/nac/types/schemas'
import type { SnowObsUnits } from '@/services/snowobs/snowobs'
import { fetchCurrentStationData, fetchWebcams } from '@/services/snowobs/snowobs'
import { fetchAlternateZones } from '@/services/snowobs/stationMap/alternateZones'
import { variableDisplayName } from '@/services/snowobs/stationMap/format'
import {
  alternateZoneNames,
  mapStations,
  mapWebcams,
  orderZoneNames,
  zonesFromMapLayer,
} from '@/services/snowobs/stationMap/mappers'
import type { StationMapData, StationMapZone } from '@/services/snowobs/stationMap/model'
import { resolveStationMapSettings } from '@/services/snowobs/stationMap/settings'
import { NO_STORE, unknownCenterResponse } from '@/utilities/apiResponses'
import { isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { NextRequest, NextResponse } from 'next/server'

// Reads a query param, so it must not be cached at the route level — the upstream fetches are
// where caching happens.
export const dynamic = 'force-dynamic'

const UNITS: SnowObsUnits[] = ['default', 'english', 'metric']

/** The requested units, or `default` — an unknown value is not forwarded to SnowObs. */
function requestedUnits(request: NextRequest): SnowObsUnits {
  const units = request.nextUrl.searchParams.get('units')
  return UNITS.find((known) => known === units) ?? 'default'
}

/**
 * The forecast-zone outlines, or none. The legacy map draws them, but it is a map of *stations*:
 * a map layer that fails to load costs the outlines (and, without alternates, the zone filter),
 * not the map.
 */
async function loadOutlines(center: string): Promise<StationMapZone[]> {
  try {
    return zonesFromMapLayer(await getZoneMapLayer(center))
  } catch {
    return []
  }
}

interface Grouping {
  zones: StationMapZone[]
  zoneNames: string[]
}

/**
 * What stations are grouped by. A center with `alternate_zones` groups by its own KML polygons
 * (the widget replaces the forecast zones with them outright; only the drawn outlines stay); one
 * without — or whose KML fails — groups by the forecast zones in the center's own order.
 */
async function loadGrouping(
  alternateZonesUrl: string | null,
  outlines: StationMapZone[],
  activeZoneNames: string[],
): Promise<Grouping> {
  const alternate = alternateZonesUrl ? await fetchAlternateZones(alternateZonesUrl) : null
  if (alternate) return { zones: alternate, zoneNames: alternateZoneNames(alternate) }
  return { zones: outlines, zoneNames: orderZoneNames(activeZoneNames, outlines) }
}

/**
 * The station map's data endpoint.
 *
 * Mapbox GL is browser-only, so the map is a client component and fetches on mount — the same
 * fetch-per-page-load the legacy widget did, and what keeps readings current on a page that is
 * statically generated. Fetching here keeps the browser off SnowObs: the center's token, the zod
 * validation and the zone classification all stay server-side.
 *
 * Stations are the product; the response is a 502 without them. Webcams and zone outlines are
 * decoration and degrade independently.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ center: string }> },
) {
  const { center } = await params
  if (!isValidTenantSlug(center)) return unknownCenterResponse()

  const units = requestedUnits(request)

  try {
    const [metadata, current, outlines, webcamResult] = await Promise.all([
      getAvalancheCenterMetadata(center),
      fetchCurrentStationData(center, units),
      loadOutlines(center),
      fetchWebcams(center).then(
        (response) => ({ response, failed: false }),
        () => ({ response: { webcam: [] }, failed: true }),
      ),
    ])

    const activeZoneNames = metadata.zones.flatMap((zone) =>
      zone.status === AvalancheForecastZoneStatus.Active ? [zone.name] : [],
    )
    const settings = resolveStationMapSettings(metadata.widget_config.stations)
    const { zones, zoneNames } = await loadGrouping(
      settings.alternateZones,
      outlines,
      activeZoneNames,
    )

    const body: StationMapData = {
      stations: mapStations(current, {
        centerSlug: center,
        stationsTenantSlug: STATIONS_TENANT_SLUG,
        zones,
      }),
      webcams: mapWebcams(webcamResult.response, zones),
      zones,
      zoneNames,
      outlines,
      variables: current.properties.variables.map((variable) => ({
        variable: variable.variable,
        longName: variableDisplayName(variable.long_name),
      })),
      units: current.properties.units,
      timezone: metadata.timezone,
      webcamsUnavailable: webcamResult.failed,
    }

    return NextResponse.json(body, {
      // Matches the upstream cache window so a burst of viewers shares one SnowObs request.
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=300' },
    })
  } catch {
    // The map renders its own error state; there is nothing useful to say beyond "not available".
    return NextResponse.json(
      { error: 'Station data unavailable' },
      { status: 502, headers: NO_STORE },
    )
  }
}
