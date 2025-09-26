import type { Tenant } from '@/payload-types'
import type { RequiredDataFromCollectionSlug } from 'payload'

export const builtInPage: (
  tenant: Tenant,
  title: string,
  url: string,
) => RequiredDataFromCollectionSlug<'builtInPages'> = (
  tenant: Tenant,
  title: string,
  url: string,
): RequiredDataFromCollectionSlug<'builtInPages'> => {
  return {
    tenant: tenant.id,
    title: title,
    url: url,
    createdAt: new Date().toISOString(),
  }
}
