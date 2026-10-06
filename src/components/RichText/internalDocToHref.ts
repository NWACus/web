import { LINK_ENABLED_COLLECTIONS } from '@/constants/linkCollections'
import type { BuiltInPage, Page, Post } from '@/payload-types'
import { handleReferenceURL } from '@/utilities/handleReferenceURL'
import type { SerializedLinkNode } from '@payloadcms/richtext-lexical'

type LinkDocRelationTo = (typeof LINK_ENABLED_COLLECTIONS)[number]
type LinkDocValue = BuiltInPage | Page | Post

type ResolvedLinkDoc = {
  relationTo: LinkDocRelationTo
  value: LinkDocValue
}

// Type guard to validate and narrow link doc type
function isResolvedLinkDoc(doc: unknown): doc is ResolvedLinkDoc {
  if (!doc || typeof doc !== 'object') {
    return false
  }
  if (!('relationTo' in doc) || !('value' in doc)) {
    return false
  }
  const { relationTo, value } = doc
  if (typeof value !== 'object' || value === null) {
    return false
  }
  // Check relationTo is one of the enabled collections
  const enabledCollections: readonly string[] = LINK_ENABLED_COLLECTIONS
  return typeof relationTo === 'string' && enabledCollections.includes(relationTo)
}

export const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
  const { linkType, doc, url } = linkNode.fields

  if (linkType === 'internal') {
    // A deleted target leaves the link unresolved; render it inert rather than failing the page.
    if (!isResolvedLinkDoc(doc)) {
      console.warn('Rich text internal link target could not be resolved', doc)
      return url || '#'
    }
    return (
      handleReferenceURL({
        url,
        type: linkType,
        reference: {
          relationTo: doc.relationTo,
          value: doc.value,
        },
      }) || '/'
    )
  }
  return url || '/'
}
