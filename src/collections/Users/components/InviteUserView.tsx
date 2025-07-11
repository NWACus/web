import type { AdminViewServerProps } from 'payload'

import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { notFound, redirect } from 'next/navigation'
import { byGlobalRoleOrTenantRoleAssignmentOrDomain } from '../access/byGlobalRoleOrTenantRoleAssignmentOrDomain'

import InviteUserForm from './InviteUserForm'

// // Server action to create a user
// export async function inviteUserAction({ email }: { email: string }) {
//   'use server'
//   const payload = await getPayload({ config })
//   try {
//     const user = await payload.create({
//       collection: 'users',
//       data: { email, name: '' },
//     })
//     return { success: true, user }
//   } catch (error: any) {
//     return { success: false, error: error.message || 'Failed to invite user.' }
//   }
// }

export async function InviteUserView({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps) {
  const {
    permissions: { canAccessAdmin },
    req,
  } = initPageResult

  const { payload, user } = req

  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = payload

  const canCreateUsers = byGlobalRoleOrTenantRoleAssignmentOrDomain('create')({ req })

  if (!user || (user && !canAccessAdmin)) {
    return redirect(`${adminRoute}/unauthorized`)
  }

  if (!canCreateUsers) {
    return notFound()
  }

  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={initPageResult.req.user || undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <Gutter>
        <h1>Invite a New User</h1>
        <InviteUserForm />
      </Gutter>
    </DefaultTemplate>
  )
}
