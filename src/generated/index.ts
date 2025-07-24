// Export static tenants with dynamic fallback logic
// This file provides a consistent import interface with fallback to seed data

export type StaticTenant = { id: number; slug: string; customDomain: string | null }

async function getStaticTenants() {
  try {
    // Try to import the generated file first
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore static tenants might not exist
    const generated = await import('./static-tenants')
    return generated.STATIC_TENANTS
  } catch (_error) {
    // Fall back to the seed file if generated file doesn't exist
    const seed = await import('./static-tenants.seed')
    return seed.STATIC_TENANTS
  }
}

// Export the function for dynamic loading
export { getStaticTenants }

// Also provide a synchronous fallback export from seed for immediate imports
export { STATIC_TENANTS } from './static-tenants.seed'
