import { sqliteAdapter } from '@payloadcms/db-sqlite'

import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Biographies } from '@/collections/Biographies'
import { BuiltInPages } from '@/collections/BuiltInPages'
import { Documents } from '@/collections/Documents'
import { GlobalRoleAssignments } from '@/collections/GlobalRoleAssignments'
import { GlobalRoles } from '@/collections/GlobalRoles'
import { HomePages } from '@/collections/HomePages'
import { Media } from '@/collections/Media'
import { Navigations } from '@/collections/Navigations'
import { Pages } from '@/collections/Pages'
import { Posts } from '@/collections/Posts'
import { RoleAssignments } from '@/collections/RoleAssignments'
import { Roles } from '@/collections/Roles'
import { Settings } from '@/collections/Settings'
import { Sponsors } from '@/collections/Sponsors'
import { Tags } from '@/collections/Tags'
import { Teams } from '@/collections/Teams'
import { Tenants } from '@/collections/Tenants'
import { Users } from '@/collections/Users'

import { getEmailAdapter } from '@/email-adapter'
import { defaultLexical } from '@/fields/defaultLexical'
import { DiagnosticsConfig } from '@/globals/Diagnostics/config'
import { NACWidgetsConfig } from '@/globals/NACWidgetsConfig/config'
import { plugins } from '@/plugins'

import { getURL } from '@/utilities/getURL'
import { getProductionTenantUrls } from '@/utilities/tenancy/getProductionTenantUrls'
import { getTenantSubdomainUrls } from '@/utilities/tenancy/getTenantSubdomainUrls'
import pino from 'pino'
import { build } from 'pino-pretty'
import { Redirects } from './collections/Redirects'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { emailAdapter, emailWarning } = getEmailAdapter()

export default buildConfig({
  admin: {
    components: {
      beforeDashboard: [
        {
          clientProps: { showDevAction: process.env.NODE_ENV !== 'production' },
          path: '@/components/BeforeDashboard',
        },
      ],
      beforeNavLinks: ['@/plugins/multiTenant/TenantSelector/TenantSelector'],
      providers: [
        {
          clientProps: {
            tenantsCollectionSlug: 'tenants',
            useAsTitle: 'name',
          },
          path: '@/plugins/multiTenant/TenantSelectionProvider#TenantSelectionProvider',
        },
        '@/providers/ViewTypeProvider#ViewTypeProvider',
      ],
      actions: [
        {
          path: '@/plugins/multiTenant/GlobalViewRedirect#GlobalViewRedirect',
          serverProps: {
            globalSlugs: ['settings', 'navigations', 'homePages'],
            tenantFieldName: 'tenant',
            tenantsCollectionSlug: 'tenants',
            useAsTitle: 'slug',
          },
        },
        '@/components/ViewTypeAction',
      ],
      graphics: {
        Logo: '@/components/Logo/AvyFxLogo#AvyFxLogo',
        Icon: '@/components/Icon/AvyFxIcon#AvyFxIcon',
      },
      logout: {
        Button: '@/components/LogoutButton#LogoutButton',
      },
      views: {
        'accept-invite-with-token': {
          Component: '@/views/AcceptInvite#AcceptInvite',
          path: '/accept-invite',
        },
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
    },
  }),
  collections: [
    // Content
    HomePages,
    BuiltInPages,
    Pages,
    Posts,
    Media,
    Documents,
    Sponsors,
    Tags,
    // Staff
    Biographies,
    Teams,
    // Permissions
    Users,
    Roles,
    RoleAssignments,
    GlobalRoles,
    GlobalRoleAssignments,
    Tenants,
    // Settings
    Navigations,
    Settings,
    Redirects,
  ],
  cors: [
    'api.avalanche.org',
    'api.snowobs.com',
    getURL(),
    ...(await getProductionTenantUrls()),
  ].filter(Boolean),
  csrf: [
    getURL(),
    ...(await getTenantSubdomainUrls()),
    ...(await getProductionTenantUrls()),
  ].filter(Boolean),
  globals: [NACWidgetsConfig, DiagnosticsConfig],
  graphQL: {
    disable: true,
  },
  plugins: [...plugins],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  debug: true,
  email: emailAdapter,
  onInit: (payload) => {
    if (emailWarning) {
      payload.logger.warn(emailWarning)
    }
  },
  logger: {
    options: {
      name: 'payload',
      enabled: process.env.DISABLE_LOGGING !== 'true', // Payload's default logic
      serializers: {
        err: pino.stdSerializers.err, // Includes stack traces
      },
    },
    destination: build({
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'SYS:HH:MM:ss',
    }),
  },
})
