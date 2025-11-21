import { byGlobalRole } from '@/access/byGlobalRole'
import type { BeforeListServerProps, PayloadRequest } from 'payload'
import { byGlobalRoleOrTenantRoleAssignmentOrDomain } from '../access/byGlobalRoleOrTenantRoleAssignmentOrDomain'
import { InviteUserDrawer } from './InviteUserDrawer'

export function InviteUser({ payload, user }: BeforeListServerProps) {
  if (!user) {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockedPayloadReq: PayloadRequest = {
    user,
    payload,
  } as PayloadRequest

  const canInvite = byGlobalRoleOrTenantRoleAssignmentOrDomain('create')({
    req: mockedPayloadReq,
  })

  const canCreateGlobalRoleAssignments = !!byGlobalRole(
    'create',
    'globalRoleAssignments',
  )({ req: mockedPayloadReq })

  if (!canInvite) return null

  return <InviteUserDrawer canCreateGlobalRoleAssignments={canCreateGlobalRoleAssignments} />
}
