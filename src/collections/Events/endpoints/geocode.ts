import { geocodeAddress } from '@/services/geocodio'
import { hasGlobalOrTenantRolePermission } from '@/utilities/rbac/hasGlobalOrTenantRolePermission'
import type { PayloadHandler } from 'payload'

// Longer than any real address line; anything past it is not worth a Geocodio lookup.
const MAX_PART_LENGTH = 200

/** Geocodes an address for the location picker, so the admin never handles the Geocodio key. */
export const geocode: PayloadHandler = async (req) => {
  // Admin users only: an MCP API key also signs in, and would otherwise spend the Geocodio quota.
  if (req.user?.collection !== 'users') {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }
  if (
    !hasGlobalOrTenantRolePermission({ method: 'update', collection: 'events', user: req.user })
  ) {
    return Response.json({ error: 'Not allowed to edit events' }, { status: 403 })
  }
  const params = req.url ? new URL(req.url).searchParams : new URLSearchParams()
  const part = (name: string) => params.get(name)?.slice(0, MAX_PART_LENGTH)
  const result = await geocodeAddress({
    address: part('address'),
    city: part('city'),
    state: part('state'),
    zip: part('zip'),
  })
  if (result.status === 'unavailable') {
    req.payload.logger.warn(`Location picker geocode skipped: ${result.reason}`)
  }
  return Response.json(result)
}
