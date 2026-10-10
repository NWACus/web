// DVAC is the template tenant and shares NWAC's upstream data, so map its slug to nwac for all
// NAC/AFP lookups. Dependency-free so scripts and client components can import it.
export const normalizeCenterSlug = (centerSlug: string) =>
  centerSlug === 'dvac' ? 'nwac' : centerSlug

/** The center ID the NAC and AFP APIs use, such as `NWAC`. */
export const nacCenterId = (centerSlug: string) => normalizeCenterSlug(centerSlug).toUpperCase()
