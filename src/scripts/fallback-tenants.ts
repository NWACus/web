// Fallback tenant data used when database is not available during build
// This ensures the application can still start even if Payload CMS is not accessible

export const FALLBACK_TENANTS = [
  { id: 1, slug: 'dvac', customDomain: 'dvac.us' },
  { id: 2, slug: 'nwac', customDomain: 'nwac.us' },
  { id: 3, slug: 'sac', customDomain: 'sierraavalanchecenter.org' },
  { id: 4, slug: 'snfac', customDomain: 'sawtoothavalanche.com' },
] as const

export type FallbackTenant = (typeof FALLBACK_TENANTS)[number]
