import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { tenantField } from '@/fields/tenantField'
import type { CollectionConfig } from 'payload'
import { revalidateDelete, revalidateEventType } from './hooks/revalidateEventType'

export const EventTypes: CollectionConfig = {
  slug: 'event-types',
  access: accessByTenantRole('event-types'),
  admin: {
    useAsTitle: 'title',
    group: 'Events',
    baseListFilter: filterByTenant,
  },
  fields: [
    tenantField(),
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'text',
    },
    {
      name: 'icon',
      type: 'select',
      options: [
        { label: 'Course', value: 'course' },
        { label: 'Workshop', value: 'workshop' },
        { label: 'Awareness', value: 'awareness' },
        { label: 'Fundraiser', value: 'fundraiser' },
      ],
    },
    // CRM Integration fields (future)
    {
      name: 'salesforceCampaignType',
      type: 'text',
      admin: {
        description: 'Maps to Salesforce Campaign Type for future CRM integration',
      },
    },
    {
      name: 'trackAttendance',
      type: 'checkbox',
      admin: {
        description: 'Whether to track individual attendance for this event type',
      },
    },
    {
      name: 'generateRevenue',
      type: 'checkbox',
      admin: {
        description: 'Whether this type typically generates revenue',
      },
    },
    // @ts-expect-error Expect ts error here because of typescript mismatching Partial<TextField> with TextField
    slugField(),
    contentHashField(),
  ],
  hooks: {
    afterChange: [revalidateEventType],
    afterDelete: [revalidateDelete],
  },
}
