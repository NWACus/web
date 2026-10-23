import type { Where } from 'payload'
import type { BoundingBox } from './distance'

/** A Payload `where` matching docs whose `<path>.latitude`/`.longitude` fall inside the box. */
export function withinBoxWhere(path: string, { south, north, west, east }: BoundingBox): Where {
  return {
    and: [
      { [`${path}.latitude`]: { greater_than_equal: south, less_than_equal: north } },
      { [`${path}.longitude`]: { greater_than_equal: west, less_than_equal: east } },
    ],
  }
}

/** Adds a constraint to an optional caller-supplied `where`. */
export function andWhere(where: Where | undefined, constraint: Where): Where {
  return where ? { and: [where, constraint] } : constraint
}
