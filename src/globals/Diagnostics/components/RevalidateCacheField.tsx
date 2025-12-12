import { hasSuperAdminPermissions } from '@/access/hasSuperAdminPermissions'
import type { UIFieldServerProps } from 'payload'
import { RevalidateCache } from './RevalidateCache.client'

export async function RevalidateCacheField({ req }: UIFieldServerProps) {
  if (!req.user) {
    return null
  }

  const isSuperAdmin = await hasSuperAdminPermissions({ req })

  if (!isSuperAdmin) {
    return null
  }

  return <RevalidateCache />
}
