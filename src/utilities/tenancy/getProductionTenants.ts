export function getProductionTenantSlugs() {
  return (process.env.PRODUCTION_TENANTS || '').split(',').map((str) => str.trim())
}
