import type { Tenant } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'

export const imageMountain: (tenant: Tenant) => RequiredDataFromCollectionSlug<'media'> = (
  tenant: Tenant,
): RequiredDataFromCollectionSlug<'media'> => {
  return {
    alt: 'Mountain snow',
    tenant: tenant.id,
  }
}
