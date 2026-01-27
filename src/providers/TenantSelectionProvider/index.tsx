import type { CollectionSlug, OptionObject, Payload, TypedUser } from 'payload'

import { cookies as getCookies } from 'next/headers.js'

import { isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { getTenantOptions } from '@/utilities/tenancy/getTenantOptions'
import { TenantSelectionProviderClient } from './index.client'

type Args = {
  children: React.ReactNode
  payload: Payload
  tenantsCollectionSlug: CollectionSlug
  useAsTitle: string
  user: TypedUser
}

export const TenantSelectionProvider = async ({
  children,
  payload,
  tenantsCollectionSlug,
  useAsTitle,
  user,
}: Args) => {
  let tenantOptions: OptionObject[] = []

  try {
    const { docs } = await getTenantOptions({
      limit: 0,
      payload,
      tenantsCollectionSlug,
      useAsTitle,
      user,
    })
    tenantOptions = docs.map((doc) => ({
      label: String(doc[useAsTitle]),
      value: doc.slug,
    }))
  } catch (_) {
    // user likely does not have access
  }

  const cookies = await getCookies()
  const tenantCookie = cookies.get('payload-tenant')?.value
  let initialValue: string | undefined = undefined

  // Validate the cookie contains a valid tenant slug that the user has access to
  if (tenantCookie && isValidTenantSlug(tenantCookie)) {
    const matchingOption = tenantOptions.find((option) => option.value === tenantCookie)
    if (matchingOption) {
      initialValue = tenantCookie
    }
  }

  // If no valid cookie or user doesn't have access to that tenant, auto-select if only one option
  if (!initialValue) {
    initialValue = tenantOptions.length === 1 ? tenantOptions[0]?.value : undefined
  }

  return (
    <TenantSelectionProviderClient
      initialTenantOptions={tenantOptions}
      initialValue={initialValue}
      tenantsCollectionSlug={tenantsCollectionSlug}
    >
      {children}
    </TenantSelectionProviderClient>
  )
}
