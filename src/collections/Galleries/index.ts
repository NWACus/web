import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { documentReferencesField } from '@/fields/documentReferencesField'
import { tenantField } from '@/fields/tenantField'
import { titleField } from '@/fields/title'
import { populateDocumentReferences } from '@/hooks/populateDocumentReferences'
import { CollectionConfig } from 'payload'
import { revalidateGallery, revalidateGalleryDelete } from './hooks/revalidateGallery'

export const Galleries: CollectionConfig = {
  slug: 'galleries',
  access: accessByTenantRole('galleries'),
  admin: {
    baseListFilter: filterByTenant,
    group: 'Content',
    useAsTitle: 'title',
  },
  labels: {
    singular: 'Gallery',
    plural: 'Galleries',
  },
  fields: [
    tenantField(),
    titleField({
      description: 'A name to identify this gallery in the admin. Not shown on the page.',
    }),
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      labels: {
        singular: 'Item',
        plural: 'Items',
      },
      admin: {
        initCollapsed: true,
        description: 'Photos, uploaded videos, and YouTube videos shown in the gallery grid.',
      },
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          defaultValue: 'upload',
          options: [
            { label: 'Image or video upload', value: 'upload' },
            { label: 'YouTube video', value: 'youtube' },
          ],
        },
        {
          name: 'media',
          type: 'upload',
          relationTo: 'media',
          required: true,
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'upload',
          },
        },
        {
          name: 'youtubeUrl',
          label: 'YouTube URL',
          type: 'text',
          required: true,
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'youtube',
            description: 'e.g. https://www.youtube.com/watch?v=… or https://youtu.be/…',
          },
        },
        {
          name: 'youtubeTitle',
          label: 'YouTube title',
          type: 'text',
          required: true,
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'youtube',
            description: 'Describes the video for screen readers. Important for accessibility.',
          },
        },
        {
          name: 'caption',
          type: 'text',
          required: false,
          admin: {
            description: 'Optional. Shown beneath the item in the full-screen view.',
          },
        },
      ],
    },
    contentHashField(),
    documentReferencesField(),
  ],
  hooks: {
    beforeChange: [populateDocumentReferences],
    afterChange: [revalidateGallery],
    afterDelete: [revalidateGalleryDelete],
  },
}
