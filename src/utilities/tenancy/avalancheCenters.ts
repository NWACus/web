/**
 * US avalanche centers with valid NAC API configurations
 *
 * This serves as the single source of truth for valid tenant slugs.
 * Custom domains are used for production routing - they should match
 * the actual domains configured in Vercel.
 *
 * `pnpm check:centers` verifies every entry against the NAC and AFP APIs and lists AFP centers
 * that aren't here yet, including whether their metadata parses.
 */
import { US_TIMEZONES, type USTimezone } from '@/utilities/timezones'

type AvalancheCenterInfo = {
  readonly name: string
  readonly customDomain: string
  /**
   * IANA timezone the center operates in, as reported by the NAC center metadata API.
   * Verify against the API with `pnpm check:centers` when adding or changing a center.
   */
  readonly timezone: USTimezone
}

export const AVALANCHE_CENTERS = {
  bac: {
    name: 'Bridgeport Avalanche Center',
    customDomain: 'bridgeportavalanchecenter.org',
    timezone: US_TIMEZONES.PACIFIC,
  },
  btac: {
    name: 'Bridger-Teton Avalanche Center',
    customDomain: 'bridgertetonavalanchecenter.org',
    timezone: US_TIMEZONES.MOUNTAIN,
  },
  caac: {
    name: 'Coastal Alaska Avalanche Center',
    customDomain: 'coastalakavalanche.org',
    timezone: US_TIMEZONES.ALASKA,
  },
  cbac: {
    name: 'Crested Butte Avalanche Center',
    customDomain: 'cbavalanchecenter.org',
    timezone: US_TIMEZONES.MOUNTAIN,
  },
  cnfaic: {
    name: 'Chugach National Forest Avalanche Center',
    customDomain: 'www.cnfaic.org',
    timezone: US_TIMEZONES.ALASKA,
  },
  coaa: {
    name: 'Central Oregon Avalanche Center',
    customDomain: 'www.coavalanche.org',
    timezone: US_TIMEZONES.PACIFIC,
  },
  dvac: {
    name: 'Death Valley Avalanche Center',
    customDomain: 'www.avy-fx-demo.org',
    timezone: US_TIMEZONES.PACIFIC,
  }, // The "template tenant" - not a real avalanche center
  esac: {
    name: 'Eastern Sierra Avalanche Center',
    customDomain: 'www.esavalanche.org',
    timezone: US_TIMEZONES.PACIFIC,
  },
  ewyaix: {
    name: 'Eastern Wyoming Avalanche Info Exchange',
    customDomain: 'ewyoavalanche.org',
    timezone: US_TIMEZONES.MOUNTAIN,
  },
  fac: {
    name: 'Flathead Avalanche Center',
    customDomain: 'www.flatheadavalanche.org',
    timezone: US_TIMEZONES.MOUNTAIN,
  },
  gnfac: {
    name: 'Gallatin NF Avalanche Center',
    customDomain: 'www.mtavalanche.com',
    timezone: US_TIMEZONES.MOUNTAIN,
  },
  hac: {
    name: 'Haines Avalanche Center',
    customDomain: 'alaskasnow.org',
    timezone: US_TIMEZONES.ALASKA,
  },
  hpac: {
    name: 'Hatcher Pass Avalanche Center',
    customDomain: 'hpavalanche.org',
    timezone: US_TIMEZONES.ALASKA,
  },
  ipac: {
    name: 'Idaho Panhandle Avalanche Center',
    customDomain: 'www.idahopanhandleavalanche.org',
    timezone: US_TIMEZONES.PACIFIC,
  },
  kpac: {
    name: 'Kachina Peaks Avalanche Center',
    customDomain: 'kachinapeaks.org',
    timezone: US_TIMEZONES.ARIZONA,
  },
  msac: {
    name: 'Mount Shasta Avalanche Center',
    customDomain: 'www.shastaavalanche.org',
    timezone: US_TIMEZONES.PACIFIC,
  },
  mwac: {
    name: 'Mount Washington Avalanche Center',
    customDomain: 'www.mountwashingtonavalanchecenter.org',
    timezone: US_TIMEZONES.EASTERN,
  },
  nwac: {
    name: 'Northwest Avalanche Center',
    customDomain: 'nwac.us',
    timezone: US_TIMEZONES.PACIFIC,
  },
  pac: {
    name: 'Payette Avalanche Center',
    customDomain: 'payetteavalanche.org',
    timezone: US_TIMEZONES.MOUNTAIN,
  },
  sac: {
    name: 'Sierra Avalanche Center',
    customDomain: 'www.sierraavalanchecenter.org',
    timezone: US_TIMEZONES.PACIFIC,
  },
  snfac: {
    name: 'Sawtooth Avalanche Center',
    customDomain: 'www.sawtoothavalanche.com',
    timezone: US_TIMEZONES.MOUNTAIN,
  },
  tac: {
    name: 'Taos Avalanche Center',
    customDomain: 'taosavalanchecenter.org',
    timezone: US_TIMEZONES.MOUNTAIN,
  },
  vac: {
    name: 'Valdez Avalanche Center',
    customDomain: 'alaskasnow.org',
    timezone: US_TIMEZONES.ALASKA,
  },
  wac: {
    name: 'Wallowa Avalanche Center',
    customDomain: 'wallowaavalanchecenter.org',
    timezone: US_TIMEZONES.PACIFIC,
  },
  wcmac: {
    name: 'West Central Montana Avalanche Center',
    customDomain: 'missoulaavalanche.org',
    timezone: US_TIMEZONES.MOUNTAIN,
  },
} satisfies Record<string, AvalancheCenterInfo>

export type ValidTenantSlug = keyof typeof AVALANCHE_CENTERS

/**
 * Check if a string is a valid tenant slug
 */
export function isValidTenantSlug(slug: string): slug is ValidTenantSlug {
  return slug in AVALANCHE_CENTERS
}

/**
 * The zone a center's timestamps are displayed in.
 *
 * Falls back to Pacific for an unrecognized slug rather than throwing: callers are formatters
 * running mid-render, and a route reached with an unknown center is already on its way to a 404.
 */
export function centerTimezone(center: string): USTimezone {
  return isValidTenantSlug(center) ? AVALANCHE_CENTERS[center].timezone : US_TIMEZONES.PACIFIC
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
