/**
 * Recursively removes `id` keys from an object to prepare it for duplication.
 * Payload auto-generates row IDs — stripping them ensures new IDs are assigned on create.
 * Only strips the exact 'id' key, not fields like 'videoId'.
 */
export const removeIdKey = <T>(obj: T): T => {
  if (Array.isArray(obj)) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return obj.map(removeIdKey) as T
  }
  if (obj && typeof obj === 'object') {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([k]) => k !== 'id')
        .map(([k, v]) => [k, removeIdKey(v)]),
    ) as T
  }
  return obj
}
