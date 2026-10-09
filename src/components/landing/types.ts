import type { Media } from '@/payload-types'

/** One production avalanche center as the root landing page lists it. */
export interface DirectoryCenter {
  slug: string
  name: string
  /** The center's host as people would type it, e.g. `nwac.us` (`nwac.localhost:3000` locally). */
  domain: string
  /** Absolute link to the center's site in this deployment. */
  href: string
  description: string | null
  logo: Media | null
}
