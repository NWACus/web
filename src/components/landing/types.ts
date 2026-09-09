import type { Media } from '@/payload-types'

/** One production avalanche center as the root landing page lists it. */
export interface DirectoryCenter {
  slug: string
  name: string
  /** The public custom domain as people would type it, e.g. `nwac.us`. */
  domain: string
  /** Absolute link to the center's site. */
  href: string
  description: string | null
  logo: Media | null
}
