import { sqliteAdapter } from '@payloadcms/db-sqlite'

import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Biographies } from '@/collections/Biographies'
import { Brands } from '@/collections/Brands'
import { Footer } from '@/collections/Footer/config'
import { GlobalRoleAssignments } from '@/collections/GlobalRoleAssignments'
import { Media } from '@/collections/Media'
import { Navigations } from '@/collections/Navigations'
import { Pages } from '@/collections/Pages'
import { Palettes } from '@/collections/Palettes'
import { Posts } from '@/collections/Posts'
import { RoleAssignments } from '@/collections/RoleAssignments'
import { Roles } from '@/collections/Roles'
import { Teams } from '@/collections/Teams'
import { Tenants } from '@/collections/Tenants'
import { Themes } from '@/collections/Themes'
import { Users } from '@/collections/Users'
import { defaultLexical } from '@/fields/defaultLexical'
import { NACWidgetsConfig } from './globals/NACWidgetsConfig/config'
import { plugins } from './plugins'
import { getServerSideURL } from './utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      beforeDashboard:
        process.env.NODE_ENV === 'production' ? undefined : ['@/components/BeforeDashboard'],
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
            globalSlugs: ['settings', 'brands', 'navigations', 'footer'],
            tenantFieldName: 'tenant',
            tenantsCollectionSlug: 'tenants',
            useAsTitle: 'slug',
          },
        },
      ],
      graphics: {
        Logo: '@/components/Logo/AvyFxLogo#AvyFxLogo',
        Icon: '@/components/Icon/AvyFxIcon#AvyFxIcon',
      },
      logout: {
        Button: '@/components/LogoutButton#LogoutButton',
      },
    },
    meta: {
      title: 'Admin Panel',
      description: 'The admin panel for AvyWeb and AvyApp.',
      icons: [
        {
          type: 'image/png',
          rel: 'icon',
          url: '/assets/icon.png',
        },
      ],
      openGraph: {
        title: 'AvyFx Admin Panel',
        siteName: 'AvyFx',
        description: 'The admin panel for AvyWeb and AvyApp.',
        images: [
          {
            url: '/assets/avy-fx-og-image.webp',
            width: 1200,
            height: 630,
          },
        ],
      },
      defaultOGImageType: 'static',
      titleSuffix: '- AvyFx',
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
    Footer,
    Biographies,
    Teams,
  ],
  cors: ['api.avalanche.org', 'api.snowobs.com', getServerSideURL()].filter(Boolean),
  globals: [NACWidgetsConfig],
  plugins: [...plugins],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  debug: true,
})
