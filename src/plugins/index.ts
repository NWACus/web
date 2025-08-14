import { accessByTenantRole, accessForFormSubmission } from '@/access/byTenantRole'
import { revalidateForm, revalidateFormDelete } from '@/hooks/revalidateForm'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { Page, Post } from '@/payload-types'
import { getEnvironmentFriendlyName } from '@/utilities/getEnvironmentFriendlyName'
import { getURL } from '@/utilities/getURL'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { sentryPlugin } from '@payloadcms/plugin-sentry'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import * as Sentry from '@sentry/nextjs'
import { Plugin } from 'payload'
import tenantFieldPlugin from './tenantFieldPlugin'

const generateTitle: GenerateTitle<Post | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | AvyFx` : 'AvyFx'
}

const generateURL: GenerateURL<Post | Page> = ({ doc }) => {
  const url = getURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

export const plugins: Plugin[] = [
  redirectsPlugin({
    collections: ['pages', 'posts'],
    overrides: {
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'from') {
            return {
              ...field,
              admin: {
                description: 'You will need to rebuild the website when changing this field.',
              },
            }
          }
          return field
        })
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
      access: accessByTenantRole('redirects'),
    },
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formOverrides: {
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
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
      access: accessForFormSubmission('form-submissions'),
    },
  }),
  tenantFieldPlugin({
    collections: [
      {
        slug: 'forms',
      },
      { slug: 'form-submissions' },
      { slug: 'redirects' },
    ],
  }),
  vercelBlobStorage({
    enabled: !!process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
    collections: {
      media: {
        prefix: getEnvironmentFriendlyName(),
      },
    },
    token: process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
  }),
  sentryPlugin({ Sentry }),
]
