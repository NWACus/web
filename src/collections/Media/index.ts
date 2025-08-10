import type { CollectionConfig } from 'payload'

import { accessByTenantRoleWithPermissiveRead } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { getEnvironmentFriendlyName } from '@/utilities/getEnvironmentFriendlyName'
import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'
import { generateBlurDataUrl } from './hooks/generateBlurDataUrl'
import { prefixFilenameWithTenant } from './hooks/prefixFilenameWithTenant'
import { revalidateMedia, revalidateMediaDelete } from './hooks/revalidateMedia'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: 'media',
  access: accessByTenantRoleWithPermissiveRead('media'),
  admin: {
    baseListFilter: filterByTenant,
    group: 'Content',
  },
  fields: [
    tenantField(),
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
    contentHashField(),
    {
      name: 'blurDataUrl',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'prefix',
      type: 'text',
      defaultValue: getEnvironmentFriendlyName(),
      admin: {
        hidden: true,
        readOnly: true,
      },
    },
  ],
  upload: {
    staticDir: path.resolve(dirname, '../../../public/media'),
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
      },
      {
        name: 'square',
        width: 500,
        height: 500,
      },
      {
        name: 'small',
        width: 600,
      },
      {
        name: 'medium',
        width: 900,
      },
      {
        name: 'large',
        width: 1400,
      },
      {
        name: 'xlarge',
        width: 1920,
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        crop: 'center',
      },
    ],
  },
  hooks: {
    beforeOperation: [prefixFilenameWithTenant],
    beforeChange: [generateBlurDataUrl],
    afterChange: [revalidateMedia],
    afterDelete: [revalidateMediaDelete],
  },
}
