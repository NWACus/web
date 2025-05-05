import type { Tenant } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'

export const imageHero1: (tenant: Tenant) => RequiredDataFromCollectionSlug<'media'> = (
  tenant: Tenant,
): RequiredDataFromCollectionSlug<'media'> => {
  return {
    alt: 'Straight metallic shapes with a blue gradient',
    tenant: tenant.id,
  }
}
