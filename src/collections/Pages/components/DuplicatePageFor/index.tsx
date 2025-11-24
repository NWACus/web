import { byGlobalRole } from '@/access/byGlobalRole'
import { User } from '@/payload-types'
import { roleAssignmentsForUser } from '@/utilities/rbac/roleAssignmentsForUser'
import { ruleMatches } from '@/utilities/rbac/ruleMatches'
import { EditMenuItemsServerProps, PayloadRequest } from 'payload'
import { DuplicatePageForDrawer } from './DuplicatePageForDrawer'

export const DuplicatePageFor = ({ user, payload }: EditMenuItemsServerProps) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockedPayloadReq = {
    user,
    payload,
  } as PayloadRequest
  const isSuperAdmin = byGlobalRole('*', '*')({ req: mockedPayloadReq })

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const roleAssignments = roleAssignmentsForUser(payload.logger, user as User)
  const matchingTenantIds = roleAssignments
    .filter(
      (assignment) =>
        assignment.role &&
        typeof assignment.role !== 'number' &&
        assignment.role.rules.some(ruleMatches('create', 'pages')),
    )
    .map((assignment) => assignment.tenant)
    .filter((tenant) => typeof tenant !== 'number')
    .map((tenant) => tenant.id)

  const canCreatePagesInMultipleTenants = matchingTenantIds.length > 1

  if (!isSuperAdmin && !canCreatePagesInMultipleTenants) return null
  return <DuplicatePageForDrawer />
}
