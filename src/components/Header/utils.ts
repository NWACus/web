import { Navigation, Page, Post } from '@/payload-types'

export type LinkType = {
  type?: 'internal' | 'external' | null
  url?: string | null
  label?: string | null
  newTab?: boolean | null
  reference?:
    | { relationTo: 'pages'; value: number | Page }
    | { relationTo: 'posts'; value: number | Post }
    | null
}

export type NavItem = {
  id?: string | null
  link?: LinkType | null
  items?: NavItem[] | null
}

export const getUrl = (link?: LinkType | null): string => {
  if (!link) return ''

  if (link.type === 'external' && link.url) {
    return link.url
  }

  if (link.type === 'internal') {
    if (link.url) return link.url
  }

  return '#'
}

export const getLabel = (link: LinkType | null | undefined, fallback: string): string => {
  if (!link) return 'No link label'

  if (link.label) return link.label
  return fallback
}

export type TopLevelNavItemDefinition = {
  label: string
  item: NavItem | null
}

export const getTopLevelNavItems = async ({
  navigation,
}: {
  navigation: Navigation
}): Promise<TopLevelNavItemDefinition[]> => [
  {
    label: 'Forecast',
    item: {
      link: {
        type: 'external',
        url: '/forecasts/avalanche',
      },
    },
  },
  {
    label: 'Weather',
    item: navigation.weather || null,
  },
  {
    label: 'Observations',
    item: {
      link: {
        type: 'external',
        url: '/observations',
      },
    },
  },
  {
    label: 'Education',
    item: navigation.education || null,
  },
  {
    label: 'Accidents',
    item: navigation.accidents || null,
  },
  {
    label: 'Blog',
    item: {
      link: {
        type: 'external',
        url: '/posts',
      },
    },
  },
  {
    label: 'Events',
    item: {
      link: {
        type: 'external',
        url: '#',
      },
    },
  },
  {
    label: 'About',
    item: navigation.about || null,
  },
  {
    label: 'Support',
    item: navigation.support || null,
  },
]
