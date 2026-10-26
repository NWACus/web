import { type CollectionConfig } from 'payload'

import { accessBySharedContentWithPermissiveRead } from '@/access/bySharedContent'
import {
  getSharedMediaBlobPrefix,
  SHARED_CONTENT_ADMIN_GROUP,
  SHARED_CONTENT_EDIT_CONTROLS,
} from '@/constants/sharedContent'
import { contentHashField } from '@/fields/contentHashField'
import { referenceCountField } from '@/fields/referenceCountField'
import { getEnvironmentFriendlyName } from '@/utilities/getEnvironmentFriendlyName'
import { canReadSharedContent } from '@/utilities/rbac/canReadSharedContent'
import path from 'path'
import { fileURLToPath } from 'url'
import { generateBlurDataUrl } from '../Media/hooks/generateBlurDataUrl'
import { revalidateSharedMedia, revalidateSharedMediaDelete } from './hooks/revalidateSharedMedia'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const SharedMedia: CollectionConfig = {
  slug: 'sharedMedia',
  labels: {
    singular: 'Shared Media',
    plural: 'Shared Media',
  },
  access: accessBySharedContentWithPermissiveRead('sharedMedia'),
  admin: {
    group: SHARED_CONTENT_ADMIN_GROUP,
    components: {
      edit: {
        beforeDocumentControls: SHARED_CONTENT_EDIT_CONTROLS,
      },
    },
    hidden: ({ user }) => !canReadSharedContent({ collection: 'sharedMedia', user }),
    defaultColumns: ['filename', 'alt', 'credit', 'referenceCount'],
    // A shared library grows past what a filename search can find
    listSearchableFields: ['filename', 'alt', 'credit', 'keywords'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description:
          'Alternative text that describes the image for screen readers and when the image cannot be displayed. This is important for accessibility and SEO.',
      },
    },
    {
      name: 'credit',
      type: 'text',
      admin: {
        description:
          'Who took the photo or video. Shown wherever a center chooses to display a credit.',
      },
    },
    {
      name: 'keywords',
      type: 'text',
      admin: {
        description:
          'Words an editor at any center might search for when looking for this photo, e.g. "cornice wind slab cascades".',
      },
    },
    referenceCountField(),
    {
      name: 'whereThisIsUsed',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/SharedContent/WhereThisIsUsed#WhereThisIsUsed',
        },
        // There is no value on the row to render: the answer comes from querying every collection
        // that tracks documentReferences, which is a per-document question, not a per-row one.
        disableListColumn: true,
      },
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
      defaultValue: getSharedMediaBlobPrefix(getEnvironmentFriendlyName()),
      admin: {
        hidden: true,
        readOnly: true,
      },
    },
  ],
  upload: {
    staticDir: path.resolve(dirname, '../../../public/shared-media'),
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    mimeTypes: ['image/*', 'video/*'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
        withoutEnlargement: false, // we always want a thumbnail to be generated since we have adminThumbnail: 'thumbnail'
      },
    ],
  },
  hooks: {
    beforeChange: [generateBlurDataUrl],
    afterChange: [revalidateSharedMedia],
    afterDelete: [revalidateSharedMediaDelete],
  },
}
