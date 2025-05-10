import { Tenant } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'

export const footer = (tenant: Tenant): RequiredDataFromCollectionSlug<'footer'> => {
  const footerData = {
    nwac: {
      tenant: tenant.id,
      // logo: brandImages[tenant.slug]['logo'].id,
      address: '249 Main Ave. S, Suite 107-366\nNorth Bend, WA 98045\n(206) 909-0203',
      email: 'info@nwac.us',
      socialMedia: {
        instagram: 'https://www.instagram.com/nwacus',
        facebook: 'https://www.facebook.com/NWACUS/',
        twitter: 'https://x.com/nwacus',
        linkedin: 'https://www.linkedin.com/company/nw-avalanche-center',
        youtube: 'https://www.youtube.com/channel/UCXKN3Cu9rnnkukkiUUgjzFQ',
      },
      contentHash: null,
    },
    sac: {
      tenant: tenant.id,
      // logo: brandImages[tenant.slug]['logo'].id,
      address: '11260 Donner Pass Rd. Ste. C1 - PMB 401\nTruckee, CA 96161\n(530) 563-2257',
      email: 'info@sierraavalanchecenter.org',
      socialMedia: {
        instagram: 'https://www.instagram.com/savycenter/',
        facebook: 'https://www.facebook.com/sacnonprofit',
        youtube: 'https://www.youtube.com/channel/UCHdjQ0tSzYzzN0k29NaZJbQ',
      },
      contentHash: null,
    },
    snfac: {
      tenant: tenant.id,
      // logo: brandImages[tenant.slug]['logo'].id,
      address: '249 Main Ave. S, Suite 107-366\nNorth Bend, WA 98045\n(206) 909-0203',
      email: 'info@nwac.us',
      socialMedia: {},
      contentHash: null,
    },
  }
  // TODO figure out type
  const slug = tenant.slug as 'nwac' | 'sac' | 'snfac'
  return footerData[slug]
}
