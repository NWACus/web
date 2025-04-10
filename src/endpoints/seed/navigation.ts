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
        type: 'custom',
        label: label || 'External Link',
        url,
        newTab,
      }
    }

    if (!pages[tenant.name] || !slug || !pages[tenant.name][slug]) {
      console.warn(`Page ${slug || 'undefined'} not found for tenant ${tenant.name}`)
      return {
        type: 'custom',
        label: 'Missing Page',
        url: '/',
        newTab,
      }
    }

    return {
      type: 'reference',
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
    tenant,
    forecast: {
      options: {
        enabled: false,
        clickable: false,
      },
      items: [],
    },
    observations: {
      options: {
        enabled: false,
        clickable: false,
      },
      items: [],
    },
    weather: {
      options: {
        enabled: true,
        clickable: false,
      },
      items: [
        {
          link: pageLink({ url: '/weather/stations/map', label: 'Weather Stations' }),
        },
        {
          link: pageLink({
            url: 'https://www.weather.gov/rev/Avalanche',
            label: 'Weather Tools',
            newTab: true,
          }),
        },
      ],
    },
    education: {
      options: {
        enabled: true,
        clickable: false,
      },
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
                label: 'Avalanche Awareness Classes',
              }),
            },
            {
              link: pageLink({
                slug: 'courses-by-local-providers',
                label: 'Courses by Local Providers',
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
      options: {
        enabled: true,
        clickable: true,
      },
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
      options: {
        enabled: true,
        clickable: false,
      },
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
      options: {
        enabled: true,
        clickable: false,
      },
      items: [
        {
          link: pageLink({ url: '/accidents', label: 'Local Accident Reports' }),
        },
        {
          link: pageLink({ url: '/accidents/statistics', label: 'Avalanche Accident Statistics' }),
        },
      ],
    },
    blog: {
      options: {
        enabled: true,
        clickable: true,
      },
      link: pageLink({ url: '/posts', label: 'Blog' }),
    },
    events: {
      options: {
        enabled: true,
        clickable: true,
      },
      link: pageLink({ url: '/events', label: 'Events' }),
    },
    donate: {
      options: {
        enabled: true,
        clickable: true,
      },
      link: pageLink({
        url: 'https://www.americanavalancheassociation.org/donate',
        label: 'Donate',
        newTab: true,
      }),
    },
  }
}
