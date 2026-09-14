/**
 * The archive browser's URL contract, shared by the route (which loads it) and the filter
 * controls (which write it), so the two cannot disagree about a key or a format.
 *
 * `nuqs/server` rather than `nuqs`: it carries the parsers without React, so this file is safe to
 * import from server components and client components alike.
 */
import { createSerializer, parseAsArrayOf, parseAsInteger, parseAsString } from 'nuqs/server'

export const archiveSearchParams = {
  /** The season's ending year; absent means the current season. */
  season: parseAsInteger,
  /** `yyyy-MM-dd` range within the season; absent means the season's defaults. */
  from: parseAsString,
  to: parseAsString,
  /** Zone slugs, danger levels (0–5) and product types; empty means all. */
  zone: parseAsArrayOf(parseAsString).withDefault([]),
  danger: parseAsArrayOf(parseAsInteger).withDefault([]),
  type: parseAsArrayOf(parseAsString).withDefault([]),
  page: parseAsInteger.withDefault(1),
}

/** Serializes a query back to `?…`, for links that change one key (pagination). */
export const serializeArchiveSearchParams = createSerializer(archiveSearchParams)
