import { geocodeAddress } from '@/services/geocodio'
import type { PayloadHandler } from 'payload'

/** Geocodes an address for the location picker, so the admin never handles the Geocodio key. */
export const geocode: PayloadHandler = async (req) => {
  // Admin users only: an MCP API key also signs in, and would otherwise spend the Geocodio quota.
  if (req.user?.collection !== 'users') {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }
  const params = req.url ? new URL(req.url).searchParams : new URLSearchParams()
  const result = await geocodeAddress({
    address: params.get('address'),
    city: params.get('city'),
    state: params.get('state'),
    zip: params.get('zip'),
  })
  if (result.status === 'unavailable') {
    req.payload.logger.warn(`Location picker geocode skipped: ${result.reason}`)
  }
  return Response.json(result)
}
