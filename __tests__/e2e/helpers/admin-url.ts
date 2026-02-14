/**
 * Adapted from Payload's test/helpers/adminUrlUtil.ts
 * Provides clean URL construction for admin panel navigation.
 */

export class AdminUrlUtil {
  private serverURL: string
  private adminRoute: string
  entitySlug: string

  constructor(serverURL: string, slug: string, adminRoute = '/admin') {
    this.serverURL = serverURL
    this.adminRoute = adminRoute
    this.entitySlug = slug
  }

  private formatURL(path: string): string {
    const base = this.serverURL.replace(/\/$/, '')
    const admin = this.adminRoute.replace(/\/$/, '')
    return `${base}${admin}${path}`
  }

  /** Admin root URL: /admin */
  get admin(): string {
    return this.formatURL('')
  }

  /** Dashboard URL: /admin */
  get dashboard(): string {
    return this.formatURL('')
  }

  /** Account URL: /admin/account */
  get account(): string {
    return this.formatURL('/account')
  }

  /** Login URL: /admin/login */
  get login(): string {
    return this.formatURL('/login')
  }

  /** Logout URL: /admin/logout */
  get logout(): string {
    return this.formatURL('/logout')
  }

  /** Collection list URL: /admin/collections/{slug} */
  get list(): string {
    return this.formatURL(`/collections/${this.entitySlug}`)
  }

  /** Create document URL: /admin/collections/{slug}/create */
  get create(): string {
    return this.formatURL(`/collections/${this.entitySlug}/create`)
  }

  /** Trash URL: /admin/collections/{slug}/trash */
  get trash(): string {
    return this.formatURL(`/collections/${this.entitySlug}/trash`)
  }

  /** Edit document URL: /admin/collections/{slug}/{id} */
  edit(id: number | string): string {
    return `${this.list}/${id}`
  }

  /** Document versions URL: /admin/collections/{slug}/{id}/versions */
  versions(id: number | string): string {
    return `${this.list}/${id}/versions`
  }

  /** Specific version URL: /admin/collections/{slug}/{id}/versions/{versionID} */
  version(id: number | string, versionID: number | string): string {
    return `${this.list}/${id}/versions/${versionID}`
  }

  /** Another collection list URL: /admin/collections/{slug} */
  collection(slug: string): string {
    return this.formatURL(`/collections/${slug}`)
  }

  /** Global edit URL: /admin/globals/{slug} */
  global(slug: string): string {
    return this.formatURL(`/globals/${slug}`)
  }
}

/**
 * Common collection slugs used in tests.
 * These match the Payload collection slugs in src/collections/
 */
export const CollectionSlugs = {
  // Tenant-required collections (each tenant can have multiple documents)
  pages: 'pages',
  posts: 'posts',
  media: 'media',
  documents: 'documents',
  sponsors: 'sponsors',
  tags: 'tags',
  events: 'events',
  biographies: 'biographies',
  teams: 'teams',
  redirects: 'redirects',

  // Global collections (unique: true - one per tenant)
  settings: 'settings',
  navigations: 'navigations',
  homePages: 'homePages',

  // Non-tenant collections (shared across all tenants)
  users: 'users',
  tenants: 'tenants',
  globalRoles: 'global-roles',
  globalRoleAssignments: 'global-role-assignments',
  roles: 'roles',
  courses: 'courses',
  providers: 'providers',
} as const

/**
 * Payload global slugs (single-document globals, not collections)
 */
export const GlobalSlugs = {
  a3Management: 'a3-management',
  nacWidgetsConfig: 'nac-widgets-config',
  diagnostics: 'diagnostics',
} as const
