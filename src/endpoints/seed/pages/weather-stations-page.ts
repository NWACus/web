import type { Media, Tenant } from '@/payload-types'
import type { SeedStationPage } from '@/services/stations/seedStationPages'
import type { RequiredDataFromCollectionSlug } from 'payload'
import { headingNode, paragraphNode, textNode } from '../utilities'

// Lexical link node wrapping a text child with a custom (URL) target
const linkNode = (text: string, url: string) => ({
  type: 'link' as const,
  version: 3,
  direction: null,
  format: '' as const,
  indent: 0,
  children: [textNode(text)],
  fields: { linkType: 'custom' as const, url, newTab: false },
})

// Paragraph containing a single link
const linkParagraph = (text: string, url: string) => ({
  type: 'paragraph' as const,
  children: [linkNode(text, url)],
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  textFormat: 0,
  version: 1,
})

// Group the three seeded station pages into regions that match NWAC's zones.
type Region = { heading: string; stations: SeedStationPage[] }

function groupByRegion(stations: SeedStationPage[]): Region[] {
  const regionMap: Record<string, string> = {
    'hurricane-ridge': 'Olympics',
    alpental: 'Snoqualmie Pass',
    'mt-st-helens': 'South Cascades',
  }

  const grouped = new Map<string, SeedStationPage[]>()
  for (const s of stations) {
    const region = regionMap[s.slug] ?? 'Other'
    const list = grouped.get(region) ?? []
    list.push(s)
    grouped.set(region, list)
  }

  // Stable order: iterate regionMap values in declaration order
  const seen = new Set<string>()
  const result: Region[] = []
  for (const region of Object.values(regionMap)) {
    if (seen.has(region)) continue
    seen.add(region)
    const list = grouped.get(region)
    if (list?.length) result.push({ heading: region, stations: list })
  }
  // Anything left over
  for (const [region, list] of grouped) {
    if (!seen.has(region)) result.push({ heading: region, stations: list })
  }
  return result
}

/**
 * A real Weather Stations page for NWAC, modelled after nwac.us/weather/stations.
 * Lists the seeded station pages by region so every link resolves locally.
 */
export const weatherStationsPage = (
  tenant: Tenant,
  seoImage: Media,
  seededStations: SeedStationPage[],
): RequiredDataFromCollectionSlug<'pages'> => {
  const regions = groupByRegion(seededStations)

  // Build Lexical children: intro paragraph, then region sections, then data viz
  const children: { type: string; version: number; [k: string]: unknown }[] = [
    paragraphNode(
      'NWAC maintains a network of automated weather stations throughout the Cascade Range ' +
        'and Olympic Mountains. Select a station below to view current conditions and recent history.',
    ),
  ]

  for (const { heading, stations } of regions) {
    children.push(headingNode(heading, 'h3'))
    for (const s of stations) {
      const label = s.archived ? `${s.displayName} (archived)` : s.displayName
      children.push(linkParagraph(label, `/weather/stations/${s.slug}`))
    }
  }

  children.push(headingNode('Additional data visualizations', 'h3'))
  children.push(linkParagraph('Weather Stations Map', '/weather/stations/map'))
  children.push(linkParagraph('Accumulated Precipitation', '/accumulated-precipitation'))

  return {
    slug: 'stations',
    tenant: tenant.id,
    _status: 'published',
    publishedAt: new Date().toISOString(),
    layout: [
      {
        backgroundColor: 'white',
        layout: '1_1',
        columns: [
          {
            richText: {
              root: {
                type: 'root',
                children,
                direction: 'ltr' as const,
                format: '' as const,
                indent: 0,
                version: 1,
              },
            },
          },
        ],
        blockType: 'content',
      },
    ],
    meta: {
      description:
        'Current conditions and history from the NWAC weather station network across the Pacific Northwest.',
      image: seoImage.id,
    },
    title: 'Weather Stations',
  }
}
