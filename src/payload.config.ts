import { sqliteAdapter } from '@payloadcms/db-sqlite'

import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Brands } from '@/collections/Brands'
import { Categories } from '@/collections/Categories'
import { GlobalRoleAssignments } from '@/collections/GlobalRoleAssignments'
import { Media } from '@/collections/Media'
import { Navigations } from '@/collections/Navigations'
import { Pages } from '@/collections/Pages'
import { Palettes } from '@/collections/Palettes'
import { Posts } from '@/collections/Posts'
import { RoleAssignments } from '@/collections/RoleAssignments'
import { Roles } from '@/collections/Roles'
import { Tenants } from '@/collections/Tenants'
import { Themes } from '@/collections/Themes'
import { Users } from '@/collections/Users'
import { defaultLexical } from '@/fields/defaultLexical'
import { Footer } from './Footer/config'
import { plugins } from './plugins'
import { getServerSideURL } from './utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeLogin` statement on line 15.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeDashboard` statement on line 15.
      beforeDashboard: ['@/components/BeforeDashboard'],
      beforeNavLinks: [
        {
          clientProps: { label: 'Avalanche Center' },
          path: '@/components/TenantSelector',
        },
      ],
      providers: [
        {
          clientProps: {
            tenantsCollectionSlug: 'tenants',
            useAsTitle: 'name',
          },
          path: '@payloadcms/plugin-multi-tenant/rsc#TenantSelectionProvider',
        },
      ],
      actions: [
        {
          path: '@payloadcms/plugin-multi-tenant/rsc#GlobalViewRedirect',
          serverProps: {
            globalSlugs: ['settings', 'brands', 'navigations'],
            tenantFieldName: 'tenant',
            tenantsCollectionSlug: 'tenants',
            useAsTitle: 'slug',
          },
        },
      ],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || '',
      authToken: process.env.DATABASE_AUTH_TOKEN || '',
      // concurrency: 1,
    },
  }),
  collections: [
    Categories,
    Media,
    Pages,
    Posts,
    Users,
    Tenants,
    Roles,
    RoleAssignments,
    GlobalRoleAssignments,
    Brands,
    Themes,
    Palettes,
    Navigations,
  ],
  cors: ['api.avalanche.org', 'api.snowobs.com', getServerSideURL()].filter(Boolean),
  globals: [Footer],
  plugins: [...plugins],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  debug: true,
})
