import { accessByTenantRole, byTenantRole } from '@/access/byTenantRole'
import { revalidateForm, revalidateFormDelete } from '@/hooks/revalidateForm'
import { Page, Post } from '@/payload-types'
import { getEnvironmentFriendlyName } from '@/utilities/getEnvironmentFriendlyName'
import { getURL } from '@/utilities/getURL'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { sentryPlugin } from '@payloadcms/plugin-sentry'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { GenerateURL } from '@payloadcms/plugin-seo/types'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import * as Sentry from '@sentry/nextjs'
import { Plugin } from 'payload'
import tenantFieldPlugin from './multiTenant'

const generateURL: GenerateURL<Post | Page> = ({ doc }) => {
  const url = getURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

export const plugins: Plugin[] = [
  seoPlugin({
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formOverrides: {
      admin: { group: 'Content' },
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [...rootFeatures]
                },
              }),
            }
          }
          return field
        })
      },
      access: accessByTenantRole('forms'),
      hooks: {
        afterChange: [revalidateForm],
        afterDelete: [revalidateFormDelete],
      },
    },
    formSubmissionOverrides: {
      access: {
        create: ({ req }) => {
          const isAdminPanel = req.url?.includes('admin')
          return !isAdminPanel
        }, // world creatable outside of the admin panel
        read: byTenantRole('read', 'form-submissions'),
        update: () => false,
        delete: byTenantRole('delete', 'form-submissions'),
      },
      admin: { group: 'Content' },
    },
  }),
  tenantFieldPlugin({
    collections: [{ slug: 'forms' }, { slug: 'form-submissions' }],
  }),
  vercelBlobStorage({
    enabled: !!process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
    collections: {
      documents: {
        prefix: getEnvironmentFriendlyName(),
      },
      media: {
        prefix: getEnvironmentFriendlyName(),
      },
    },
    clientUploads: true,
    token: process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
  }),
  sentryPlugin({ Sentry }),
]
