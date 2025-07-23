export type TenantDefinition = {
  slug: string
  customDomain: string
}

export const TENANTS: TenantDefinition[] = [
  { slug: 'nwac', customDomain: 'nwac.us' },
  { slug: 'bac', customDomain: 'bridgeportavalanchecenter.org' },
  { slug: 'btac', customDomain: 'bridgertetonavalanchecenter.org' },
  { slug: 'cbac', customDomain: 'cbavalanchecenter.org' },
  { slug: 'cnfaic', customDomain: 'www.cnfaic.org' },
  { slug: 'coaa', customDomain: 'www.coavalanche.org' },
  { slug: 'esac', customDomain: 'www.esavalanche.org' },
  { slug: 'fac', customDomain: 'www.flatheadavalanche.org' },
  { slug: 'hpac', customDomain: 'hpavalanche.org' },
  { slug: 'ipac', customDomain: 'www.idahopanhandleavalanche.org' },
  { slug: 'kpac', customDomain: 'kachinapeaks.org' },
  { slug: 'msac', customDomain: 'www.shastaavalanche.org' },
  { slug: 'mwac', customDomain: 'www.mountwashingtonavalanchecenter.org' },
  { slug: 'pac', customDomain: 'payetteavalanche.org' },
  { slug: 'sac', customDomain: 'www.sierraavalanchecenter.org' },
  { slug: 'snfac', customDomain: 'www.sawtoothavalanche.com' },
  { slug: 'tac', customDomain: 'taosavalanchecenter.org' },
  { slug: 'wac', customDomain: 'wallowaavalanchecenter.org' },
  { slug: 'wcmac', customDomain: 'missoulaavalanche.org' },
]

export function validateProductionTenants(productionTenantsEnv?: string): string[] {
  const envValue = productionTenantsEnv ?? process.env.PRODUCTION_TENANTS ?? ''

  if (!envValue.trim()) {
    return []
  }

  const tenantSlugs = envValue
    .split(',')
    .map((str) => str.trim())
    .filter((str) => str.length > 0)

  const validTenantSlugs = TENANTS.map((tenant) => tenant.slug)
  const validProduction = tenantSlugs.filter((slug) => validTenantSlugs.includes(slug))
  const invalidTenants = tenantSlugs.filter((slug) => !validTenantSlugs.includes(slug))

  if (invalidTenants.length > 0) {
    console.warn(
      `Invalid tenant slugs found in PRODUCTION_TENANTS env var. Omitting: ${invalidTenants.join(', ')}. Valid tenant slugs are: ${validTenantSlugs.join(', ')}`,
    )
  }

  return validProduction
}

export const PRODUCTION_TENANTS = validateProductionTenants()
