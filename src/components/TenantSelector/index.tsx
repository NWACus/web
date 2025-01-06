import React from 'react'

import { cookies as getCookies } from 'next/headers'

import { CustomComponent, PayloadServerReactComponent, OptionObject } from 'payload'

import { TenantSelector } from './index.client'
import { roleAssignmentsForUser } from '@/utilities/rbac/roleAssignmentsForUser'
import { globalRolesForUser } from '@/utilities/rbac/globalRolesForUser'
import { ruleMatches } from '@/utilities/rbac/ruleMatches'

// TenantSelector exposes a selection element for scoping the admin panel down to values from
// one tenant, even if the logged-in user has permissions to content from many tenants.
// Two side-channel mechanisms exists for ease-of-use:
// - when a user logs into the system using an e-mail associated with the domain of a tenant,
//   they have a 'payload-tenant' cookie saved by default associating them with the tenant
// - when the admin panel is viewed through a tenant's domain, Next.js middleware rewrites the
//   request to encode the tenant in the 'default-payload-tenant' query parameter
//
// The behavior of this element is to ensure that the 'payload-tenant' cookie is set whenever
// possible, to ensure a clean admin UI. Specifically, the cookie is set to:
// - the value of 'default-payload-tenant', if provided
//   - no selector is shown in this case as a tenant-scoped admin panel should not show other data
// - the tenant to which the user has access, if they only have access to one tenant
//   - no selector is shown in this case as the user has no choice to make
// - nothing, if the user has access to many tenants
//   - the selector is shown in this case as the user has a choice to make
// - the value of 'payload-tenant', passed through from the server, to allow authenticated reads
//   for users to their own tenant without explicit role assignments
//   - the selector is shown if the user has access to more than one tenant
export const TenantSelectorRSC: PayloadServerReactComponent<CustomComponent> = async ({
  payload,
  searchParams,
  user,
}) => {
  const cookies = await getCookies()
  const defaultTenant = cookies.get('payload-tenant')?.value

  let scopedTenant: string | undefined = undefined
  if (searchParams && searchParams['default-payload-tenant']) {
    if (typeof searchParams['default-payload-tenant'] === 'string') {
      scopedTenant = searchParams['default-payload-tenant']
    } else if (searchParams['default-payload-tenant']?.length > 0) {
      scopedTenant = searchParams['default-payload-tenant'][0]
    }
  }
  // filter to the scoped domain, if set, or to the logged-in domain, if present
  let cookieValue: string | undefined = scopedTenant || defaultTenant
  let options: OptionObject[] = []
  if (!scopedTenant) {
    if (user) {
      if (user.globalRoles && user.globalRoles.docs && user.globalRoles.docs.length > 0) {
        // if the user has any global roles for tenant-scoped data, they act across all tenants
        // TODO: the check here is brittle, as we need to filter out global roles for global data
        // like roles, which most users have and does not indicate any need to access other tenants.
        // Instead of filtering out roles for global data, we white-list tenant-scoped data, so
        // errors in updating this list cause this selector to fail closed instead of failing open.
        const globalRoles = globalRolesForUser(payload.logger, user)
        let globallyAccessesTenantData = false
        // TODO: correct this list
        for (const collection of ['roleAssignments', 'posts', 'pages', 'categories']) {
          globallyAccessesTenantData =
            globallyAccessesTenantData ||
            globalRoles
              .map((role) => role.rules)
              .flat()
              .some(ruleMatches('*', collection))
        }
        // TODO: filter out role and user viewer - do we use a well-known name? check for something?
        // if the user has any global roles, they necessarily act across all tenants
        if (globallyAccessesTenantData) {
          const tenants = await payload.find({
            collection: 'tenants',
            pagination: false,
          })
          options = tenants.docs.map((tenant) => ({ label: tenant.name, value: tenant.slug }))
        }
      }
      if (user.roles && user.roles.docs && user.roles.docs.length > 0) {
        // otherwise, the tenant options they have are defined by their roles
        const tenants = roleAssignmentsForUser(payload.logger, user)
          .map((role) => role.tenant)
          .filter((tenant) => typeof tenant !== 'number')

        options = tenants.map((tenant) => ({ label: tenant.name, value: tenant.slug }))
        if (tenants.length == 1) {
          // default the tenant to which the user has access to, if there's just one
          cookieValue = tenants[0].slug
        }
      }
    }
  }

  return <TenantSelector cookieValue={cookieValue} options={options} />
}
