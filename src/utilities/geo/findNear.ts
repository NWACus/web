import type {
  CollectionSlug,
  DataFromCollectionSlug,
  Payload,
  PayloadRequest,
  Where,
} from 'payload'
import { boundingBox, rankByDistance, type LatLng, type StoredCoordinates } from './distance'

/** A Payload `where` matching docs whose `<path>.latitude`/`.longitude` fall in the radius's bounding box. */
export function nearWhere(path: string, center: LatLng, radiusKm: number): Where {
  const { south, north, west, east } = boundingBox(center, radiusKm)
  return {
    and: [
      { [`${path}.latitude`]: { greater_than_equal: south, less_than_equal: north } },
      { [`${path}.longitude`]: { greater_than_equal: west, less_than_equal: east } },
    ],
  }
}

type FindNearArgs<TSlug extends CollectionSlug> = {
  payload: Payload
  collection: TSlug
  /** Dot path to the group holding `latitude` and `longitude`, e.g. `location.coordinates`. */
  path: string
  getCoordinates: (doc: DataFromCollectionSlug<TSlug>) => StoredCoordinates | null | undefined
  center: LatLng
  radiusKm: number
  where?: Where
  limit?: number
  depth?: number
  req?: PayloadRequest
}

/**
 * Payload's `near` operator is Postgres-only, so on SQLite we narrow by bounding box in the
 * database, then compute exact distances and sort in JS. Access control applies as for any find.
 */
export async function findNear<TSlug extends CollectionSlug>({
  payload,
  collection,
  path,
  getCoordinates,
  center,
  radiusKm,
  where,
  limit,
  depth,
  req,
}: FindNearArgs<TSlug>) {
  const near = nearWhere(path, center, radiusKm)
  const { docs } = await payload.find({
    collection,
    where: where ? { and: [where, near] } : near,
    pagination: false,
    depth,
    req,
  })

  const ranked = rankByDistance(docs, center, radiusKm, getCoordinates)
  return limit ? ranked.slice(0, limit) : ranked
}
