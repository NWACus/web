import type { BasePayload } from 'payload'

const STATION_COLLECTIONS = ['stationPages']

/**
 * Let each center's Admin role manage the station pages.
 *
 * Tenant roles list their collections explicitly, so a new collection is
 * invisible to every existing Admin until someone edits the role. Finds the
 * rule that already grants full access to `settings` (the marker of an admin
 * rule) and appends the station collections to it, once. Super admins are
 * unaffected: their `*` already covers everything.
 */
export async function grantStationAccess(payload: BasePayload): Promise<number> {
  const { docs: roles } = await payload.find({
    collection: 'roles',
    where: { name: { equals: 'Admin' } },
    limit: 1000,
    depth: 0,
  })

  let updated = 0
  for (const role of roles) {
    let changed = false
    const rules = (role.rules ?? []).map((rule) => {
      const collections = rule.collections ?? []
      const isAdminRule = collections.includes('settings') && (rule.actions ?? []).includes('*')
      const missing = STATION_COLLECTIONS.filter((slug) => !collections.includes(slug))
      if (!isAdminRule || missing.length === 0) return rule
      changed = true
      return { ...rule, collections: [...collections, ...missing] }
    })
    if (!changed) continue
    await payload.update({ collection: 'roles', id: role.id, data: { rules } })
    updated++
  }
  return updated
}
