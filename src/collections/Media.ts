import type { CollectionConfig } from 'payload'

import { accessByTenantWithPermissiveRead } from '@/access/byTenant'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

type BeforeOperationHook = Exclude<
  Exclude<CollectionConfig['hooks'], undefined>['beforeOperation'],
  undefined
>[number]
const prefixFilename: BeforeOperationHook = async ({ req }) => {
  if (req.file) {
    req.payload.logger.debug(`media: have data ${JSON.stringify(req.data)}`)
    const media = req.data
    let tenantSlug: string | undefined = undefined
    if (media && 'tenant' in media && typeof media.tenant === 'number') {
      req.payload.logger.debug(`media: fetching slug for tenant ${media.tenant}`)
      const tenant = await req.payload.find({
        collection: 'tenants',
        select: {
          slug: true,
        },
        where: {
          id: {
            equals: media.tenant,
          },
        },
      })
      req.payload.logger.debug(
        `media: got ${tenant.docs ? tenant.docs.length : 0} documents querying for tenant ${media.tenant}`,
      )
      if (tenant.docs && tenant.docs.length > 0) {
        tenantSlug = tenant.docs[0].slug
        req.payload.logger.debug(`media: using result slug for tenant ${tenant.docs[0].slug}`)
      }
    } else if (media && 'tenant' in media && typeof media.tenant === 'object') {
      req.payload.logger.debug(`media: using literal slug for tenant ${media.tenant.slug}`)
      tenantSlug = media.tenant.slug
    } else {
      req.payload.logger.debug(
        `media: unknown tenant, have media ${!!media}, tenant in media: ${media && 'tenant' in media}, type of tenant ${media && 'tenant' in media ? typeof media.tenant : 'unknown'}, tenant: ${media && 'tenant' in media ? JSON.stringify(media.tenant) : 'unknown'}`,
      )
    }
    if (tenantSlug) {
      req.file.name = `${tenantSlug}-` + req.file.name
      req.payload.logger.debug(`updated media filename to ${req.file.name}`)
    }
  }
}

export const Media: CollectionConfig = {
  slug: 'media',
  access: accessByTenantWithPermissiveRead('media'),
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
  ],
  upload: {
    staticDir: path.resolve(dirname, '../../public/media'),
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
  // In the future, PayloadCMS might support having different staticDir entries based on the
  // content of a media item. Until then, though, we cannot do this. In order to make sure that
  // tenants can't step on each others' toes by uploading the same file name, this beforeOperation
  // hook prepends the tenants' slug to the file.
  // TODO: this doesn't seem to work
  hooks: {
    beforeOperation: [prefixFilename],
  },
}
