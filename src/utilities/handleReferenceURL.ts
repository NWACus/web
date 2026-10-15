import { BuiltInPage, Page, Post, StationPage } from '@/payload-types'
import { stationPagePath } from '@/services/stations/stationPages'
import { normalizePath } from './path'

type RelationTo = 'builtInPages' | 'pages' | 'posts' | 'stationPages'
type ReferenceDoc = BuiltInPage | Page | Post | StationPage

type Props = {
  type?: ('internal' | 'external') | null
  reference?: {
    relationTo: RelationTo
    value: ReferenceDoc | string | number
  } | null
  url?: string | null
}

const referencePath = (relationTo: RelationTo, value: ReferenceDoc): string | undefined => {
  if ('url' in value) return normalizePath(value.url, { ensureLeadingSlash: true })
  if (relationTo === 'stationPages') return stationPagePath(value.slug)
  if (relationTo === 'posts') return `/blog/${value.slug}`
  if (relationTo === 'pages') return `/${value.slug}`
  return undefined
}

export const handleReferenceURL = ({ url, type, reference }: Props) => {
  if (type !== 'internal' || !reference?.value || typeof reference.value !== 'object') {
    return url
  }
  return referencePath(reference.relationTo, reference.value) ?? url
}
