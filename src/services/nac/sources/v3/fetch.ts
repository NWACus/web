/**
 * The shared read path for products-api v3: host, error handling and schema parsing in one place,
 * so every v3 source reads the same way.
 *
 * A failure always throws. v3 answers "nothing published" with a 200, so a source can keep an
 * absent product (`null`) apart from one it could not read, which v2's sources cannot.
 *
 * v3 sends a weak ETag and `Cache-Control` on every read. Neither is used: Next's data cache holds
 * the response, and freshness is decided on a fingerprint of the normalized model, so no
 * conditional request is ever sent and a 304 never comes back.
 */
import type { z } from 'zod'

import { v3ApiHost } from '../../hosts'
import { logNacError, NACError, nacFetch } from '../../nac'

type V3FetchOptions = Omit<NonNullable<Parameters<typeof nacFetch>[1]>, 'host'>

/** GET `/v3/public/<path>` and parse it. Throws `NACError` on any failure. */
export async function v3Fetch<Schema extends z.ZodTypeAny>(
  path: string,
  schema: Schema,
  options: V3FetchOptions = {},
): Promise<z.infer<Schema>> {
  const data: unknown = await nacFetch(`/v3/public/${path}`, { ...options, host: v3ApiHost })
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    await logNacError(parsed.error, `Failed to parse NAC v3 response for ${path}`)
    throw new NACError('NAC v3 response failed schema validation', parsed.error, { path })
  }
  return parsed.data
}
