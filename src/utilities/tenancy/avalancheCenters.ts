/**
 * US avalanche centers with valid NAC API configurations
 *
 * This serves as the single source of truth for valid tenant slugs.
 * Only centers that return a complete config from the NAC API
 * (/v2/public/avalanche-center/{CENTER}) are included here.
 * Custom domains are used for production routing - they should match
 * the actual domains configured in Vercel.
 *
 * Excluded centers (missing required config fields in NAC API):
 * - AAIC (Alaska Avalanche Information Center) — no config fields returned
 * - CAC (Cordova Avalanche Center) — only blog_title returned
 * - CAIC (Colorado Avalanche Information Center) — no config fields returned
 * - EARAC (Eastern Alaska Range Avalanche Center) — only blog_title returned
 * - EWYAIX (Eastern Wyoming Avalanche Info Exchange) — no config object at all
 * - SOAIX (Southern Oregon Avalanche Info Exchange) — no config object at all
 * - UAC (Utah Avalanche Center) — no config object at all
 */
type AvalancheCenterInfo = {
  readonly name: string
  readonly customDomain: string
}

export const AVALANCHE_CENTERS = {
  bac: { name: 'Bridgeport Avalanche Center', customDomain: 'bridgeportavalanchecenter.org' },
  btac: { name: 'Bridger-Teton Avalanche Center', customDomain: 'bridgertetonavalanchecenter.org' },
  caac: { name: 'Coastal Alaska Avalanche Center', customDomain: 'coastalakavalanche.org' },
  cbac: { name: 'Crested Butte Avalanche Center', customDomain: 'cbavalanchecenter.org' },
  cnfaic: { name: 'Chugach National Forest Avalanche Center', customDomain: 'www.cnfaic.org' },
  coaa: { name: 'Central Oregon Avalanche Center', customDomain: 'www.coavalanche.org' },
  dvac: { name: 'Death Valley Avalanche Center', customDomain: 'www.avy-fx-demo.org' }, // The "template tenant" - not a real avalanche center
  esac: { name: 'Eastern Sierra Avalanche Center', customDomain: 'www.esavalanche.org' },
  fac: { name: 'Flathead Avalanche Center', customDomain: 'www.flatheadavalanche.org' },
  gnfac: { name: 'Gallatin NF Avalanche Center', customDomain: 'www.mtavalanche.com' },
  hac: { name: 'Haines Avalanche Center', customDomain: 'alaskasnow.org' },
  hpac: { name: 'Hatcher Pass Avalanche Center', customDomain: 'hpavalanche.org' },
  ipac: {
    name: 'Idaho Panhandle Avalanche Center',
    customDomain: 'www.idahopanhandleavalanche.org',
  },
  kpac: { name: 'Kachina Peaks Avalanche Center', customDomain: 'kachinapeaks.org' },
  msac: { name: 'Mount Shasta Avalanche Center', customDomain: 'www.shastaavalanche.org' },
  mwac: {
    name: 'Mount Washington Avalanche Center',
    customDomain: 'www.mountwashingtonavalanchecenter.org',
  },
  nwac: { name: 'Northwest Avalanche Center', customDomain: 'nwac.us' },
  pac: { name: 'Payette Avalanche Center', customDomain: 'payetteavalanche.org' },
  sac: { name: 'Sierra Avalanche Center', customDomain: 'www.sierraavalanchecenter.org' },
  snfac: { name: 'Sawtooth Avalanche Center', customDomain: 'www.sawtoothavalanche.com' },
  tac: { name: 'Taos Avalanche Center', customDomain: 'taosavalanchecenter.org' },
  vac: { name: 'Valdez Avalanche Center', customDomain: 'alaskasnow.org' },
  wac: { name: 'Wallowa Avalanche Center', customDomain: 'wallowaavalanchecenter.org' },
  wcmac: { name: 'West Central Montana Avalanche Center', customDomain: 'missoulaavalanche.org' },
} satisfies Record<string, AvalancheCenterInfo>

export type ValidTenantSlug = keyof typeof AVALANCHE_CENTERS

/**
 * Check if a string is a valid tenant slug
 */
export function isValidTenantSlug(slug: string): slug is ValidTenantSlug {
  return slug in AVALANCHE_CENTERS
}

/**
 * Array of all valid tenant slugs.
 */
export const VALID_TENANT_SLUGS: ValidTenantSlug[] =
  Object.keys(AVALANCHE_CENTERS).filter(isValidTenantSlug)

/**
 * Lookup a center by its custom domain
 */
/** Derive an email-safe domain from the custom domain by stripping www. prefix and port */
export function getEmailDomain(slug: ValidTenantSlug): string {
  return AVALANCHE_CENTERS[slug].customDomain
    .toLowerCase()
    .replace(/^www\./, '') // strip www. prefix
    .replace(/:\d+$/, '') // strip port number (e.g., :3000 for local testing)
}

/**
 * Lookup a center by its custom domain
 */
export function findCenterByDomain(domain: string): ValidTenantSlug | undefined {
  // Normalize input: trim whitespace, lowercase, remove www. prefix
  // Regex matches 'www.' at start of string
  // .toLowerCase is just a precaution since modern browsers lowercase domains
  const normalizedInput = domain
    .trim()
    .toLowerCase()
    .replace(/^www\./, '')

  for (const slug of VALID_TENANT_SLUGS) {
    const normalizedStored = AVALANCHE_CENTERS[slug].customDomain
      .toLowerCase()
      .replace(/^www\./, '')
    if (normalizedStored === normalizedInput) {
      return slug
    }
  }
  return undefined
}
