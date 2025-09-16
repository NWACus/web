import type { Media, Tenant } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'

export const sponsors: (
  tenant: Tenant,
  image: Media,
) => RequiredDataFromCollectionSlug<'sponsors'> = (
  tenant: Tenant,
  image: Media,
): RequiredDataFromCollectionSlug<'sponsors'> => ({
  tenant: tenant.id,
  name: 'Acme Corp.',
  photo: image.id,
  link: 'https://acme.com/',
  startDate: null,
  endDate: null,
})
