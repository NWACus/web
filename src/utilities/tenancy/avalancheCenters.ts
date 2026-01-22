/**
 * Hardcoded list of all US avalanche centers
 *
 * This serves as the single source of truth for valid tenant slugs.
 * Custom domains are used for production routing - they should match
 * the actual domains configured in Vercel.
 */
export const AVALANCHE_CENTERS = {
  aaic: { name: 'Alaska Avalanche Information Center', customDomain: 'alaskasnow.org' },
  bac: { name: 'Bridgeport Avalanche Center', customDomain: 'bridgeportavalanchecenter.org' },
  btac: { name: 'Bridger-Teton Avalanche Center', customDomain: 'bridgertetonavalanchecenter.org' },
  cac: { name: 'Cordova Avalanche Center', customDomain: 'alaskasnow.org' },
  caic: { name: 'Colorado Avalanche Information Center', customDomain: 'avalanche.state.co.us' },
  caac: { name: 'Coastal Alaska Avalanche Center', customDomain: 'coastalakavalanche.org' },
  cbac: { name: 'Crested Butte Avalanche Center', customDomain: 'cbavalanchecenter.org' },
  cnfaic: { name: 'Chugach National Forest Avalanche Center', customDomain: 'cnfaic.org' },
  coaa: { name: 'Central Oregon Avalanche Center', customDomain: 'coavalanche.org' },
  earac: { name: 'Eastern Alaska Range Avalanche Center', customDomain: 'alaskasnow.org' },
  esac: { name: 'Eastern Sierra Avalanche Center', customDomain: 'esavalanche.org' },
  ewyaix: { name: 'Eastern Wyoming Avalanche Info Exchange', customDomain: 'ewyoavalanche.org' },
  fac: { name: 'Flathead Avalanche Center', customDomain: 'flatheadavalanche.org' },
  gnfac: { name: 'Gallatin NF Avalanche Center', customDomain: 'mtavalanche.com' },
  hac: { name: 'Haines Avalanche Center', customDomain: 'alaskasnow.org' },
  hpac: { name: 'Hatcher Pass Avalanche Center', customDomain: 'hpavalanche.org' },
  ipac: { name: 'Idaho Panhandle Avalanche Center', customDomain: 'idahopanhandleavalanche.org' },
  kpac: { name: 'Kachina Peaks Avalanche Center', customDomain: 'kachinapeaks.org' },
  msac: { name: 'Mount Shasta Avalanche Center', customDomain: 'shastaavalanche.org' },
  mwac: {
    name: 'Mount Washington Avalanche Center',
    customDomain: 'mountwashingtonavalanchecenter.org',
  },
  nwac: { name: 'Northwest Avalanche Center', customDomain: 'nwac.us' },
  pac: { name: 'Payette Avalanche Center', customDomain: 'payetteavalanche.org' },
  sac: { name: 'Sierra Avalanche Center', customDomain: 'sierraavalanchecenter.org' },
  snfac: { name: 'Sawtooth Avalanche Center', customDomain: 'sawtoothavalanche.com' },
  soaix: { name: 'Southern Oregon Avalanche Info Exchange', customDomain: 'oregonsnow.org' },
  tac: { name: 'Taos Avalanche Center', customDomain: 'taosavalanchecenter.org' },
  uac: { name: 'Utah Avalanche Center', customDomain: 'utahavalanchecenter.org' },
  vac: { name: 'Valdez Avalanche Center', customDomain: 'alaskasnow.org' },
  wac: { name: 'Wallowa Avalanche Center', customDomain: 'wallowaavalanchecenter.org' },
  wcmac: { name: 'West Central Montana Avalanche Center', customDomain: 'missoulaavalanche.org' },
} as const

export type ValidTenantSlug = keyof typeof AVALANCHE_CENTERS

/**
 * Check if a string is a valid tenant slug
 */
export function isValidTenantSlug(slug: string): slug is ValidTenantSlug {
  return slug in AVALANCHE_CENTERS
}

/**
 * Array of all valid tenant slugs.
 * Note: Uses type guard filter to satisfy strict type checking.
 */
export const VALID_TENANT_SLUGS: ValidTenantSlug[] =
  Object.keys(AVALANCHE_CENTERS).filter(isValidTenantSlug)

/**
 * Lookup a center by its custom domain
 */
export function findCenterByDomain(domain: string): ValidTenantSlug | undefined {
  // Normalize the domain by removing www. prefix - regex matches 'www.' at start of string
  const normalizedDomain = domain.replace(/^www\./, '')

  for (const slug of VALID_TENANT_SLUGS) {
    if (AVALANCHE_CENTERS[slug].customDomain === normalizedDomain) {
      return slug
    }
  }
  return undefined
}
