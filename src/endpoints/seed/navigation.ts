import { Navigation, Page, Tenant } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'

export const navigationSeed = (
  pages: Record<string, Record<string, Page>>,
  tenant: Tenant,
): RequiredDataFromCollectionSlug<'navigations'> => {
  const pageLink = ({
    slug,
    url,
    label,
    newTab,
  }: { slug?: string; url?: string; label?: string; newTab?: boolean } & (
    | { slug: string }
    | { url: string }
  )): NonNullable<NonNullable<Navigation['weather']>['link']> => {
    if (url) {
      return {
        type: 'external',
        label: label || 'External Link',
        url,
        newTab,
      }
    }

    if (!pages[tenant.name] || !slug || !pages[tenant.name][slug]) {
      console.warn(`Page ${slug || 'undefined'} not found for tenant ${tenant.name}`)
      return {
        type: 'internal',
        label: 'Missing Page',
        url: '/',
        newTab,
      }
    }

    return {
      type: 'internal',
      reference: {
        value: pages[tenant.name][slug].id,
        relationTo: 'pages',
      },
      label: label || pages[tenant.name][slug].title,
      newTab,
    }
  }

  return {
    _status: 'published',
    tenant: tenant.id,
    forecast: {
      items: [],
    },
    observations: {
      items: [],
    },
    weather: {
      items: [
        {
          link: pageLink({
            slug: 'radar-and-satellite-index',
          }),
          items: [
            {
              link: pageLink({
                url: 'https://www.weather.gov/rev/Avalanche',
                label: 'Weather Tools',
                newTab: true,
              }),
            },
          ],
        },
      ],
    },
    education: {
      items: [
        {
          link: pageLink({
            url: 'https://avalanche.org/avalanche-tutorial',
            label: 'Learn',
            newTab: true,
          }),
          items: [
            {
              link: pageLink({
                url: 'https://avalanche.org/avalanche-education/',
                label: 'Backcountry Basics',
              }),
            },
          ],
        },
        {
          link: pageLink({
            url: 'https://avalanche.org/avalanche-tutorial',
            label: 'Classes',
            newTab: true,
          }),
          items: [
            {
              link: pageLink({
                slug: 'avalanche-awareness-classes',
              }),
            },
            {
              link: pageLink({
                slug: 'courses-by-local-providers',
              }),
            },
          ],
        },
        {
          link: pageLink({ slug: 'snowpack-scholarship' }),
        },
      ],
    },
    about: {
      link: pageLink({ slug: 'about-us' }),
      items: [
        {
          link: pageLink({ slug: 'about-us' }),
        },
        {
          link: pageLink({ slug: 'about-the-forecasts' }),
        },
      ],
    },
    support: {
      items: [
        {
          link: pageLink({ slug: 'become-a-member' }),
        },
        {
          link: pageLink({ slug: 'workplace-giving' }),
        },
        {
          link: pageLink({ slug: 'corporate-sponsorships' }),
        },
      ],
    },
    accidents: {
      items: [
        {
          link: pageLink({ slug: 'about-the-forecasts' }),
        },
        {
          link: pageLink({ slug: 'about-the-forecasts' }),
        },
      ],
    },
    blog: {
      items: [],
    },
    events: {
      items: [],
    },
    donate: {
      link: pageLink({
        url: 'https://www.americanavalancheassociation.org/donate',
        label: 'Donate',
        newTab: true,
      }),
    },
  }
}
