import { BuiltInPage, Navigation, Page, Tenant } from '@/payload-types'
import { Payload, RequiredDataFromCollectionSlug } from 'payload'

export const navigationSeed = (
  payload: Payload,
  pages: Record<string, Record<string, Page>>,
  builtInPages: Record<string, Record<string, BuiltInPage>>,
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
  )): NonNullable<NonNullable<Navigation['donate']>['link']> => {
    if (url) {
      return {
        type: 'external',
        label: label || 'External Link',
        url,
        newTab,
      }
    }

    if (!pages[tenant.slug] || !slug || !pages[tenant.slug][slug]) {
      payload.logger.warn(`Page ${slug || 'undefined'} not found for tenant ${tenant.name}`)
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
        value: pages[tenant.slug][slug].id,
        relationTo: 'pages',
      },
      label: label || pages[tenant.slug][slug].title,
      newTab,
    }
  }

  const builtInPageLink = ({
    url,
    label,
  }: {
    url: string
    label?: string
  }): NonNullable<NonNullable<Navigation['donate']>['link']> => {
    if (!builtInPages[tenant.slug] || !builtInPages[tenant.slug][url]) {
      payload.logger.warn(`BuiltInPage ${url} not found for tenant ${tenant.name}`)
      return {
        type: 'internal',
        label: label || 'Missing Page',
        url: '/',
      }
    }

    const builtInPage = builtInPages[tenant.slug][url]

    return {
      type: 'internal',
      reference: {
        value: builtInPage.id,
        relationTo: 'builtInPages',
      },
      label: label || builtInPage.title,
    }
  }

  return {
    _status: 'published',
    tenant: tenant.id,
    forecasts: {
      items: [],
    },
    observations: {
      items: [],
    },
    weather: {
      items: [
        {
          link: builtInPageLink({
            url: '/weather/stations/map',
            label: 'Weather Stations',
          }),
        },
        {
          link: pageLink({
            slug: 'weather-tools',
          }),
        },
      ],
    },
    education: {
      items: [
        {
          link: pageLink({ slug: 'learn' }),
        },
        {
          link: pageLink({
            label: 'Classes',
            slug: 'field-classes',
          }),
          items: [
            {
              link: pageLink({
                slug: 'field-classes',
              }),
            },
            {
              link: pageLink({
                slug: 'avalanche-awareness-classes',
              }),
            },
            {
              link: pageLink({
                slug: 'courses-by-external-providers',
              }),
            },
            {
              link: pageLink({
                slug: 'workshops',
              }),
            },
            {
              link: pageLink({
                slug: 'request-a-class',
              }),
            },
          ],
        },
        {
          link: pageLink({ slug: 'scholarships' }),
        },
        {
          link: pageLink({ slug: 'mentorship' }),
        },
        {
          link: pageLink({ slug: 'beacon-parks' }),
        },
        {
          link: {
            type: 'external',
            label: 'Seguridad Básica de Avalanchas',
            url: 'https://www.sawtoothavalanche.com/seguridad-de-avalanchas-basica/',
            newTab: true,
          },
        },
      ],
    },
    about: {
      items: [
        {
          link: pageLink({ slug: 'about-us' }),
        },
        {
          link: pageLink({ slug: 'agency-partners' }),
        },
        {
          link: pageLink({ slug: 'who-we-are' }),
        },
        {
          link: pageLink({ slug: 'annual-report-minutes' }),
        },
        {
          link: pageLink({ slug: 'employment' }),
        },
      ],
    },
    support: {
      items: [
        {
          link: pageLink({ slug: 'donate-membership' }),
        },
        {
          link: pageLink({ slug: 'workplace-giving' }),
        },
        {
          link: pageLink({ slug: 'other-ways-to-give' }),
        },
        {
          link: pageLink({ slug: 'corporate-sponsorship' }),
        },
        {
          link: pageLink({ slug: 'volunteer' }),
        },
      ],
    },
    accidents: {
      items: [
        {
          link: pageLink({ slug: 'local-accident-reports' }),
        },
        {
          link: pageLink({ slug: 'avalanche-accident-statistics' }),
        },
        {
          link: pageLink({ slug: 'us-avalanche-accidents' }),
        },
        {
          link: pageLink({ slug: 'grief-and-loss-resources' }),
        },
        {
          link: pageLink({ slug: 'avalanche-accident-map' }),
        },
      ],
    },
    donate: {
      link: pageLink({ slug: 'donate-membership', label: 'Donate' }),
    },
  }
}
