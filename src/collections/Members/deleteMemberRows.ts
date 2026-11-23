import { MEMBER_AUTH_TABLES } from '@/auth/members/schema'
import { eq } from '@payloadcms/db-sqlite/drizzle'
import type { Payload } from 'payload'

const OWNED_COLLECTIONS = ['deliveries', 'subscriptions', 'devices', 'memberships'] as const

/**
 * Removes everything a Member owns, explicitly: Turso ignores FK pragmas inside transactions
 * (docs/migration-safety.md), so ON DELETE CASCADE is not relied on. Used by Better Auth's
 * `deleteUser.beforeDelete` and by the collection's own `beforeDelete` for admin deletions.
 */
export async function deleteMemberRows(payload: Payload, memberId: string): Promise<void> {
  for (const collection of OWNED_COLLECTIONS) {
    await payload.delete({
      collection,
      where: { member: { equals: memberId } },
      depth: 0,
    })
  }
}

/** Better Auth deletes its own rows on `deleteUser`; admin deletions through Payload must too. */
export async function deleteMemberAuthRows(payload: Payload, memberId: string): Promise<void> {
  const { drizzle, tables } = payload.db
  for (const key of [MEMBER_AUTH_TABLES.session, MEMBER_AUTH_TABLES.account]) {
    const table = tables[key]
    await drizzle.delete(table).where(eq(table.userId, memberId))
  }
}
