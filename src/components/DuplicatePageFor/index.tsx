import { byGlobalRole } from '@/access/byGlobalRole'
import { byTenantRole } from '@/access/byTenantRole'
import { EditMenuItemsServerProps } from 'payload'
import { DuplicatePageForDrawer } from './DuplicatePageForDrawer'

export const DuplicatePageFor = ({ user }: EditMenuItemsServerProps) => {
  const isSuperAdmin = byGlobalRole('*', '*')
  const userRolesTenant = user?.roles?.docs?.map((r) => typeof r !== 'number' && r.tenant)
  const isMultiTenantUser = userRolesTenant ?? 0 > 1
  const isContributorWithMultiTenants = byTenantRole('*', 'pages') && isMultiTenantUser

  if (!isSuperAdmin && !isContributorWithMultiTenants) return null
  return <DuplicatePageForDrawer />
}
