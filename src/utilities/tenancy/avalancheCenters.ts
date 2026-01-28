/**
 * Hardcoded list of all US avalanche centers
 *
 * This serves as the single source of truth for valid tenant slugs.
 * Custom domains are used for production routing - they should match
 * the actual domains configured in Vercel.
 */
type AvalancheCenterInfo = {
  readonly name: string
  readonly customDomain: string
}

export const AVALANCHE_CENTERS = {
  aaic: { name: 'Alaska Avalanche Information Center', customDomain: 'alaskasnow.org' },
  bac: { name: 'Bridgeport Avalanche Center', customDomain: 'bridgeportavalanchecenter.org' },
  btac: { name: 'Bridger-Teton Avalanche Center', customDomain: 'bridgertetonavalanchecenter.org' },
  cac: { name: 'Cordova Avalanche Center', customDomain: 'alaskasnow.org' },
  caic: { name: 'Colorado Avalanche Information Center', customDomain: 'avalanche.state.co.us' },
  caac: { name: 'Coastal Alaska Avalanche Center', customDomain: 'coastalakavalanche.org' },
  cbac: { name: 'Crested Butte Avalanche Center', customDomain: 'cbavalanchecenter.org' },
  cnfaic: { name: 'Chugach National Forest Avalanche Center', customDomain: 'www.cnfaic.org' },
  coaa: { name: 'Central Oregon Avalanche Center', customDomain: 'www.coavalanche.org' },
  dvac: { name: 'Death Valley Avalanche Center', customDomain: 'www.avy-fx-demo.org' }, // The "template tenant" - not a real avalanche center
  earac: { name: 'Eastern Alaska Range Avalanche Center', customDomain: 'alaskasnow.org' },
  esac: { name: 'Eastern Sierra Avalanche Center', customDomain: 'www.esavalanche.org' },
  ewyaix: { name: 'Eastern Wyoming Avalanche Info Exchange', customDomain: 'ewyoavalanche.org' },
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
  soaix: { name: 'Southern Oregon Avalanche Info Exchange', customDomain: 'oregonsnow.org' },
  tac: { name: 'Taos Avalanche Center', customDomain: 'taosavalanchecenter.org' },
  uac: { name: 'Utah Avalanche Center', customDomain: 'utahavalanchecenter.org' },
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
export function findCenterByDomain(domain: string): ValidTenantSlug | undefined {
  // Normalize both input and stored domains by removing www. prefix
  // Regex matches 'www.' at start of string
  // .toLowerCase is just a precaution since modern browsers lowercase domains
  const normalizedInput = domain.toLowerCase().replace(/^www\./, '')

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
