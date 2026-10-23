// No caller yet: these back the events map's box and area searches (#671).
// fallow-ignore-file unused-file
import type {
  CollectionSlug,
  DataFromCollectionSlug,
  Payload,
  PayloadRequest,
  Sort,
  Where,
} from 'payload'
import { areaBounds, keepInsideArea, type GeoArea } from './area'
import type { BoundingBox, StoredCoordinates } from './distance'
import { andWhere, withinBoxWhere } from './where'

type FindWithinArgs<TSlug extends CollectionSlug> = {
  payload: Payload
  collection: TSlug
  /** Dot path to the group holding `latitude` and `longitude`, e.g. `location.coordinates`. */
  path: string
  where?: Where
  sort?: Sort
  depth?: number
  req?: PayloadRequest
}

/**
 * Docs whose point falls inside a lat/lng box, e.g. the map's current view. Entirely a database
 * query, so it sorts and paginates like any other find, with admin access like any Local API find.
 */
export function findWithinBox<TSlug extends CollectionSlug>({
  payload,
  collection,
  path,
  box,
  where,
  ...options
}: FindWithinArgs<TSlug> & {
  box: BoundingBox
  limit?: number
  page?: number
  pagination?: boolean
}) {
  return payload.find({ collection, where: andWhere(where, withinBoxWhere(path, box)), ...options })
}

/**
 * Docs whose point falls inside a drawn area. The database narrows to the area's bounding box,
 * then the exact inside-the-shape test runs in JS, so every match in that box is loaded.
 */
export async function findWithinArea<TSlug extends CollectionSlug>({
  area,
  getCoordinates,
  ...args
}: FindWithinArgs<TSlug> & {
  area: GeoArea
  getCoordinates: (doc: DataFromCollectionSlug<TSlug>) => StoredCoordinates | null | undefined
}): Promise<DataFromCollectionSlug<TSlug>[]> {
  const { docs } = await findWithinBox({ ...args, box: areaBounds(area), pagination: false })
  return keepInsideArea(docs, area, getCoordinates)
}
