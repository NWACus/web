import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { Sponsor } from '@/payload-types'
import { validateExternalUrl } from '@/utilities/validateUrl'
import { CollectionConfig, DateField, DateFieldValidation, ValidateOptions } from 'payload'
import { date } from 'payload/shared'
import { revalidateSponsors, revalidateSponsorsDelete } from './hooks/revalidateSponsors'

const validateDate: DateFieldValidation = (
  value,
  args: ValidateOptions<unknown, unknown, DateField, Date> & { siblingData: Partial<Sponsor> },
) => {
  if (!value) return date(value, args)

  const { siblingData: sponsorData } = args
  const startDate = new Date(value)
  const endDate = sponsorData.endDate ? new Date(sponsorData.endDate) : null

  if (endDate && startDate > endDate) {
    return 'Start date cannot be after end date'
  }

  return date(value, args)
}

export const Sponsors: CollectionConfig = {
  slug: 'sponsors',
  access: accessByTenantRole('sponsors'),
  admin: {
    baseListFilter: filterByTenant,
    group: 'Content',
    useAsTitle: 'name',
  },
  fields: [
    tenantField(),
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'link',
      type: 'text',
      required: true,
      validate: validateExternalUrl,
    },
    {
      name: 'startDate',
      type: 'date',
      label: 'Start Date',
      required: false,
      admin: {
        position: 'sidebar',
      },
      validate: validateDate,
    },
    {
      name: 'endDate',
      type: 'date',
      label: 'End Date',
      required: false,
      admin: {
        position: 'sidebar',
      },
    },
    contentHashField(),
  ],
  hooks: {
    afterChange: [revalidateSponsors],
    afterDelete: [revalidateSponsorsDelete],
  },
}
