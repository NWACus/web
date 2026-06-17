import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { ButtonBlock } from '@/blocks/Button/config'
import { InlineMediaBlock } from '@/blocks/InlineMedia/config'
import { MediaBlock } from '@/blocks/Media/config'
import { SponsorsBlock } from '@/blocks/Sponsors/config'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { titleField } from '@/fields/title'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { Announcement } from '@/payload-types'
import {
  BlocksFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { CollectionConfig, DateField, DateFieldValidation, ValidateOptions } from 'payload'
import { date } from 'payload/shared'
import { populateStartDate } from './hooks/populateStartDate'
import {
  revalidateAnnouncement,
  revalidateAnnouncementDelete,
} from './hooks/revalidateAnnouncement'

const validateStartBeforeEnd: DateFieldValidation = (
  value,
  args: ValidateOptions<unknown, unknown, DateField, Date> & { data: Partial<Announcement> },
) => {
  if (!value) return date(value, args)

  const { data } = args
  const startDate = new Date(value)
  const endDate = data.endDate ? new Date(data.endDate) : null

  if (endDate && startDate > endDate) {
    return 'Start date cannot be after end date'
  }

  return date(value, args)
}

export const Announcements: CollectionConfig = {
  slug: 'announcements',
  access: accessByTenantRole('announcements'),
  admin: {
    baseListFilter: filterByTenant,
    group: 'Content',
    defaultColumns: ['title', 'type', 'startDate', 'endDate', '_status'],
    useAsTitle: 'title',
  },
  fields: [
    tenantField(),
    titleField(),
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Banner', value: 'banner' },
        { label: 'Pop-up', value: 'popup' },
      ],
      defaultValue: 'banner',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            BlocksFeature({
              blocks: [ButtonBlock, MediaBlock, SponsorsBlock],
              inlineBlocks: [InlineMediaBlock],
            }),
            HorizontalRuleFeature(),
            InlineToolbarFeature(),
          ]
        },
      }),
    },
    {
      name: 'displayFrequency',
      type: 'select',
      defaultValue: 'once',
      options: [
        { label: 'Once ever', value: 'once' },
        { label: 'Once per session', value: 'every_session' },
        { label: 'Every N views', value: 'every_n_views' },
      ],
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) => siblingData?.type === 'popup',
        description: 'How often the pop-up is shown to the same user',
      },
    },
    {
      name: 'displayInterval',
      type: 'number',
      min: 1,
      defaultValue: 3,
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) =>
          siblingData?.type === 'popup' && siblingData?.displayFrequency === 'every_n_views',
        description: 'Show the pop-up every N page views',
      },
    },
    {
      name: 'pageScope',
      type: 'select',
      defaultValue: 'all_pages',
      options: [
        { label: 'All pages', value: 'all_pages' },
        { label: 'Homepage only', value: 'homepage_only' },
      ],
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) => siblingData?.type === 'popup',
      },
    },
    {
      name: 'deviceTarget',
      type: 'select',
      defaultValue: 'all',
      options: [
        { label: 'All devices', value: 'all' },
        { label: 'Mobile only', value: 'mobile_only' },
        { label: 'Desktop only', value: 'desktop_only' },
      ],
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) => siblingData?.type === 'popup',
      },
    },
    {
      name: 'startDate',
      type: 'date',
      label: 'Start Date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      validate: validateStartBeforeEnd,
    },
    {
      name: 'endDate',
      type: 'date',
      label: 'End Date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
    },
    contentHashField(),
  ],
  hooks: {
    beforeChange: [populateStartDate, populatePublishedAt],
    afterChange: [revalidateAnnouncement],
    afterDelete: [revalidateAnnouncementDelete],
  },
  versions: {
    drafts: true,
    maxPerDoc: 10,
  },
}
