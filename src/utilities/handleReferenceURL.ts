import { BuiltInPage, Page, Post } from '@/payload-types'
import { normalizePath } from './path'

type Props = {
  type?: ('internal' | 'external') | null
  reference?: {
    relationTo: 'builtInPages' | 'pages' | 'posts'
    value: BuiltInPage | Page | Post | string | number
  } | null
  url?: string | null
}

export const handleReferenceURL = ({ url, type, reference }: Props) => {
  if (!reference?.value || typeof reference.value !== 'object') {
    return url
  }
  if (type === 'internal') {
    const { relationTo, value } = reference

    if (relationTo === 'builtInPages' && 'url' in value) {
      return normalizePath(value.url, { ensureLeadingSlash: true })
    }

    if ('slug' in value) {
      const prefix = relationTo === 'pages' ? '' : `/${relationTo}`
      return `${prefix}/${value.slug}`
    }
  }

  return url
}
