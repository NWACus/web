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

export const PRODUCTION_TENANTS = (process.env.PRODUCTION_TENANTS || '')
  .split(',')
  .map((str) => str.trim())
