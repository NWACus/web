import { internalDocToHref } from '@/components/RichText/internalDocToHref'
import type { SerializedLinkNode } from '@payloadcms/richtext-lexical'
import { buildStationPage } from '../../builders'

function linkNode(doc: SerializedLinkNode['fields']['doc']): SerializedLinkNode {
  return {
    type: 'link',
    version: 3,
    direction: null,
    format: '',
    indent: 0,
    children: [],
    fields: { linkType: 'internal', doc, newTab: false },
  }
}

describe('internalDocToHref', () => {
  it('links to a station page', () => {
    const node = linkNode({
      relationTo: 'stationPages',
      value: { ...buildStationPage({ slug: 'alpental' }) },
    })

    expect(internalDocToHref({ linkNode: node })).toBe('/weather/stations/alpental')
  })

  it('renders an inert link when the target was deleted', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})

    expect(
      internalDocToHref({ linkNode: linkNode({ relationTo: 'stationPages', value: 42 }) }),
    ).toBe('#')
    warn.mockRestore()
  })
})
