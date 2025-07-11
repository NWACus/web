import { Button, Gutter } from '@payloadcms/ui'
import type { BeforeListServerProps, PayloadRequest } from 'payload'
import { byGlobalRoleOrTenantRoleAssignmentOrDomain } from '../access/byGlobalRoleOrTenantRoleAssignmentOrDomain'

export function InviteUserButton({ payload, user }: BeforeListServerProps) {
  if (!user) {
    return null
  }

  const mockedPayloadReq = {
    user,
    payload,
  } as PayloadRequest

  const canInvite = byGlobalRoleOrTenantRoleAssignmentOrDomain('create')({
    req: mockedPayloadReq,
  })

  if (!canInvite) return null

  return (
    <Gutter>
      <Button buttonStyle="pill" el="link" to="/admin/users/invite">
        Invite New User
      </Button>
    </Gutter>
  )
}
