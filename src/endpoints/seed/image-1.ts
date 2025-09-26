import type { Tenant } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'

export const image1: (tenant: Tenant) => RequiredDataFromCollectionSlug<'media'> = (
  tenant: Tenant,
): RequiredDataFromCollectionSlug<'media'> => {
  return {
    tenant: tenant.id,
    alt: 'image1',
  }
}
