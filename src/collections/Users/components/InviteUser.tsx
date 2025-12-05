import { canManageProviders } from '@/utilities/rbac/canManageProviders'
import {
  hasGlobalOrTenantRolePermission,
  hasGlobalRolePermission,
} from '@/utilities/rbac/hasGlobalOrTenantRolePermission'
import { isProviderManager } from '@/utilities/rbac/isProviderManager'
import type { BeforeListServerProps, PayloadRequest } from 'payload'
import { byGlobalRoleOrTenantRoleAssignmentOrDomain } from '../access/byGlobalRoleOrTenantRoleAssignmentOrDomain'
import { InviteUserDrawer } from './InviteUserDrawer'

export async function InviteUser({ payload, user }: BeforeListServerProps) {
  if (!user) {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockedPayloadReq = {
    user,
    payload,
  } as PayloadRequest

  const canInvite = byGlobalRoleOrTenantRoleAssignmentOrDomain('create')({
    req: mockedPayloadReq,
  })

  if (!canInvite) return null

  const canCreateGlobalRoleAssignments = hasGlobalRolePermission({
    method: 'create',
    collection: 'globalRoleAssignments',
    user,
  })
  const canCreateTenantRoleAssignments = hasGlobalOrTenantRolePermission({
    method: 'create',
    collection: 'roleAssignments',
    user,
  })

  const isManager = await isProviderManager(payload, user)

  // Check if user can manage providers (either through provider manager role or global role permissions)
  const canAssignProviders = await canManageProviders(payload, user)

  return (
    <InviteUserDrawer
      canCreateGlobalRoleAssignments={canCreateGlobalRoleAssignments}
      canCreateTenantRoleAssignments={canCreateTenantRoleAssignments}
      isProviderManager={isManager}
      canAssignProviders={canAssignProviders}
    />
  )
}
