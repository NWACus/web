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
    allowOverwrite: true,
    token: process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
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
    // No create/update/delete operations are exposed on any collection/global.
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
    globals: {
      nacWidgetsConfig: { enabled: { find: true } },
    },
    mcp: {
      serverOptions: {
        serverInfo: {
          name: 'AvyWeb Payload CMS',
          version: '1.0.0',
        },
        instructions: [
          'This MCP server provides read-only access to the AvyWeb Payload CMS database.',
          'AvyWeb is a multi-tenant platform serving multiple avalanche centers (NWAC, DVAC, SAC, SNFAC, etc.).',
          '',
          'Data model:',
          '- Every content document (pages, posts, events, etc.) belongs to a tenant.',
          '- Use findTenants to discover available tenants and their IDs/slugs.',
          '- Filter by tenant using where clauses like {"tenant": {"equals": <tenantId>}}.',
          '- Use depth parameter to control relationship population (0 = IDs only, 1+ = resolved objects).',
          '',
          'Common queries:',
          '- "What are the recent NWAC posts?" → findTenants to get NWAC tenant ID, then findPosts with tenant filter, sorted by -updatedAt.',
          '- "Show me the homepage content" → findHomePages filtered by tenant.',
          '- "What events are coming up?" → findEvents filtered by tenant.',
          '- "What navigation items exist?" → findNavigations filtered by tenant.',
          '',
          'Tips:',
          '- Use the select parameter to return only specific fields: \'{"title": true, "slug": true}\'.',
          '- Use sort parameter for ordering: "-createdAt" for newest first, "title" for alphabetical.',
          '- The where clause supports operators: equals, not_equals, contains, like, greater_than, less_than, in, etc.',
        ].join('\n'),
      },
    },
    // Our RBAC access functions need deeply populated user relationships
    // (globalRoleAssignments.docs[].globalRole.rules). The plugin defaults
    // to depth:1 which isn't enough — depth:3 resolves the full chain.
    authDepth: 3,
    // Restrict MCP API key management to super admins only
    overrideApiKeyCollection: (collection) => ({
      ...collection,
      access: {
        ...collection.access,
        create: hasSuperAdminPermissions,
        read: hasSuperAdminPermissions,
        update: hasSuperAdminPermissions,
        delete: hasSuperAdminPermissions,
      },
    }),
  }),
]
