import { internalDocToHref } from '@/components/RichText/internalDocToHref'
import type { SerializedLinkNode } from '@payloadcms/richtext-lexical'
import { buildPage } from '../../builders'

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
  it('links to a page', () => {
    const node = linkNode({ relationTo: 'pages', value: { ...buildPage({ slug: 'about' }) } })

    expect(internalDocToHref({ linkNode: node })).toBe('/about')
  })

  it('renders an inert link when the target was deleted', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})

    expect(internalDocToHref({ linkNode: linkNode({ relationTo: 'pages', value: 42 }) })).toBe('#')
    warn.mockRestore()
  })
})
