import { accessByTenantRole, byTenantRole } from '@/access/byTenantRole'
import { hasSuperAdminPermissions } from '@/access/hasSuperAdminPermissions'
import { revalidateForm, revalidateFormDelete } from '@/hooks/revalidateForm'
import { Page, Post } from '@/payload-types'
import { getEnvironmentFriendlyName } from '@/utilities/getEnvironmentFriendlyName'
import { getURL } from '@/utilities/getURL'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { sentryPlugin } from '@payloadcms/plugin-sentry'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { GenerateURL } from '@payloadcms/plugin-seo/types'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import * as Sentry from '@sentry/nextjs'
import { Plugin } from 'payload'
import tenantFieldPlugin from './tenantFieldPlugin'

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
    addRandomSuffix: true,
  }),
  sentryPlugin({
    Sentry,
    options: {
      debug: true,
      // >= 500 status codes are captured automatically in addition to these
      captureErrors: [400, 401, 403, 404],
    },
  }),
  mcpPlugin({
    // Read-only access for AI-assisted development and content querying.
    // No create/update/delete operations are exposed on any collection.
    collections: {
      pages: { enabled: { find: true } },
      posts: { enabled: { find: true } },
      homePages: { enabled: { find: true } },
      events: { enabled: { find: true } },
      media: { enabled: { find: true } },
      teams: { enabled: { find: true } },
      biographies: { enabled: { find: true } },
      sponsors: { enabled: { find: true } },
      tags: { enabled: { find: true } },
      documents: { enabled: { find: true } },
      forms: { enabled: { find: true } },
      navigations: { enabled: { find: true } },
      settings: { enabled: { find: true } },
      tenants: { enabled: { find: true } },
      eventGroups: { enabled: { find: true } },
      eventTags: { enabled: { find: true } },
    },
    // Expose globals as read-only
    globals: {
      nacWidgetsConfig: { enabled: { find: true } },
    },
    // Restrict MCP API key management to super admins only
    overrideApiKeyCollection: (collection) => ({
      ...collection,
      admin: {
        ...collection.admin,
        group: 'Admin',
      },
      access: {
        ...collection.access,
        create: hasSuperAdminPermissions,
        read: hasSuperAdminPermissions,
        update: hasSuperAdminPermissions,
        delete: hasSuperAdminPermissions,
      },
    }),
    // The MCP plugin fetches the API key's user at depth:1, which doesn't
    // populate the nested joins (globalRoleAssignments.docs[].globalRole.rules)
    // that our RBAC access functions need. Re-fetch the user at depth:3 so
    // byTenantRole can see the full role chain.
    overrideAuth: async (req, getDefaultMcpAccessSettings) => {
      const defaultSettings = await getDefaultMcpAccessSettings()
      const userId =
        typeof defaultSettings.user === 'object' && defaultSettings.user !== null
          ? defaultSettings.user.id
          : undefined

      if (userId) {
        const fullyPopulatedUser = await req.payload.findByID({
          collection: 'users',
          id: userId,
          depth: 3,
        })
        req.user = fullyPopulatedUser
        return { ...defaultSettings, user: fullyPopulatedUser }
      }

      return defaultSettings
    },
  }),
]
