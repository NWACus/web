/**
 * The polygons in a KML file, as station-map zones.
 *
 * A center's `widget_config.stations.alternate_zones` points at a KML of forecaster-drawn station
 * groupings (exported from Google Earth or CalTopo). The legacy widget parses it in the browser
 * with `DOMParser` and `@mapbox/togeojson`; this route runs in Node, and the files are simple
 * enough — one `<Placemark>` per zone, its `<name>`, and one or more `<Polygon>`s — that a small
 * parser over the handful of elements we read beats an XML dependency. Placemarks with no polygon
 * (points, lines, folders) are skipped, as togeojson would have skipped them for our purposes.
 */
import type { PolygonGeometry, Position } from '@/utilities/geo/pointInPolygon'

import type { StationMapZone } from './model'

// Each `<Placemark …>…</Placemark>` block, tags allowed attributes; non-greedy so blocks don't merge.
const PLACEMARK = /<Placemark\b[^>]*>([\s\S]*?)<\/Placemark>/g
// The placemark's own `<name>` — the first one, before any nested element could carry another.
const NAME = /<name\b[^>]*>([\s\S]*?)<\/name>/
// Each `<Polygon>` block inside a placemark (directly, or within `<MultiGeometry>`).
const POLYGON = /<Polygon\b[^>]*>([\s\S]*?)<\/Polygon>/g
// The single outer ring and any inner rings (holes) of a polygon.
const OUTER = /<outerBoundaryIs>[\s\S]*?<coordinates\b[^>]*>([\s\S]*?)<\/coordinates>/
const INNER = /<innerBoundaryIs>[\s\S]*?<coordinates\b[^>]*>([\s\S]*?)<\/coordinates>/g

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
}

/** The five XML entities plus numeric character references, which is all a KML name can carry. */
function decodeEntities(text: string): string {
  return text
    .replace(/&(amp|lt|gt|quot|apos);/g, (entity) => ENTITIES[entity])
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
}

/**
 * KML coordinates are whitespace-separated `lng,lat[,alt]` tuples. The altitude is dropped, and
 * a tuple that doesn't parse (a stray line break inside one, say) is skipped rather than fatal.
 */
function parseRing(text: string): Position[] {
  return text
    .trim()
    .split(/\s+/)
    .flatMap((tuple) => {
      const [lng, lat] = tuple.split(',').map(Number)
      return Number.isFinite(lng) && Number.isFinite(lat) ? [[lng, lat]] : []
    })
}

function parsePolygon(block: string): Position[][] | null {
  const outer = block.match(OUTER)
  if (!outer) return null
  const rings = [parseRing(outer[1])]
  for (const inner of block.matchAll(INNER)) rings.push(parseRing(inner[1]))
  // A ring needs at least a triangle to enclose anything.
  return rings[0].length >= 3 ? rings : null
}

function placemarkGeometry(block: string): PolygonGeometry | null {
  const polygons = Array.from(block.matchAll(POLYGON)).flatMap((match) => {
    const rings = parsePolygon(match[1])
    return rings ? [rings] : []
  })
  if (polygons.length === 0) return null
  if (polygons.length === 1) return { type: 'Polygon', coordinates: polygons[0] }
  return { type: 'MultiPolygon', coordinates: polygons }
}

/** Every placemark with a name and at least one polygon, in document order. */
export function parseKmlZones(kml: string): StationMapZone[] {
  return Array.from(kml.matchAll(PLACEMARK)).flatMap((match) => {
    const block = match[1]
    const name = decodeEntities(block.match(NAME)?.[1] ?? '').trim()
    const geometry = placemarkGeometry(block)
    return name && geometry ? [{ name, geometry }] : []
  })
}
