// Export static tenants with fallback logic
// This file provides a consistent import interface regardless of whether
// the generated static-tenants.ts file exists or not

export type StaticTenant = { id: number; slug: string; customDomain: string | null }

// Re-export from the seed file by default
// The generation script will overwrite this file when it runs
export { STATIC_TENANTS } from './static-tenants.seed'
