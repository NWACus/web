import Supercluster, { type ClusterFeature, type PointFeature } from 'supercluster'
import type { EventPlace } from './eventPlaces'

type PlaceProps = { key: string; eventCount: number }
type ClusterProps = { eventCount: number; keys: string[] }

/** Several nearby places drawn as one marker until the map zooms in far enough to split them. */
export type PlaceCluster = {
  id: number
  latitude: number
  longitude: number
  eventCount: number
  /** The places inside, so hovering one of their cards can light the cluster up. */
  keys: string[]
  /** The zoom at which the cluster breaks apart. */
  expansionZoom: number
}

export type MapItem =
  | { kind: 'place'; place: EventPlace }
  | { kind: 'cluster'; cluster: PlaceCluster }

// Pins closer than about a pin's width merge.
const CLUSTER_RADIUS_PX = 40
// From street level in, every place gets its own pin.
const CLUSTER_MAX_ZOOM = 14
const WHOLE_WORLD: [number, number, number, number] = [-180, -85, 180, 85]

export type PlaceClusters = {
  index: Supercluster<PlaceProps, ClusterProps>
  apart: EventPlace[]
  byKey: Map<string, EventPlace>
}

/** Clusters the places, leaving `keepApart` (the selected place) as its own pin so its popup shows. */
export function clusterPlaces(places: EventPlace[], keepApart: string | null): PlaceClusters {
  const index = new Supercluster<PlaceProps, ClusterProps>({
    radius: CLUSTER_RADIUS_PX,
    maxZoom: CLUSTER_MAX_ZOOM,
    map: ({ key, eventCount }) => ({ eventCount, keys: [key] }),
    reduce: (merged, next) => {
      merged.eventCount += next.eventCount
      merged.keys = [...merged.keys, ...next.keys]
    },
  })
  index.load(
    places
      .filter((place) => place.key !== keepApart)
      .map((place) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [place.longitude, place.latitude] },
        properties: { key: place.key, eventCount: place.events.length },
      })),
  )
  return {
    index,
    apart: places.filter((place) => place.key === keepApart),
    byKey: new Map(places.map((place) => [place.key, place])),
  }
}

const isCluster = (
  feature: ClusterFeature<ClusterProps> | PointFeature<PlaceProps>,
): feature is ClusterFeature<ClusterProps> => 'cluster_id' in feature.properties

/** The pins and clusters to draw at `zoom`. */
export function mapItemsAt({ index, apart, byKey }: PlaceClusters, zoom: number): MapItem[] {
  const items = index.getClusters(WHOLE_WORLD, Math.floor(zoom)).flatMap((feature): MapItem[] => {
    if (!isCluster(feature)) {
      const place = byKey.get(feature.properties.key)
      return place ? [{ kind: 'place', place }] : []
    }
    const [longitude = 0, latitude = 0] = feature.geometry.coordinates
    const { cluster_id: id, eventCount, keys } = feature.properties
    const expansionZoom = index.getClusterExpansionZoom(id)
    return [
      { kind: 'cluster', cluster: { id, latitude, longitude, eventCount, keys, expansionZoom } },
    ]
  })
  return [...items, ...apart.map((place): MapItem => ({ kind: 'place', place }))]
}
