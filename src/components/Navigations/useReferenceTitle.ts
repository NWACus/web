'use client'

import { isRecord } from '@/utilities/isRecord'
import { relationshipID } from '@/utilities/relationships'
import { useEffect, useState } from 'react'

const TITLE_FIELD: Record<string, string> = { stationPages: 'displayName' }

const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value ? value : undefined

// A link's { relationTo: 'pages', value: 14 }
const referenceParts = (reference: unknown) =>
  isRecord(reference)
    ? { collection: text(reference.relationTo), id: relationshipID(reference.value) }
    : {}

// → /api/pages/14, selecting only the title
const titleUrl = (reference: unknown) => {
  const { collection, id } = referenceParts(reference)
  if (!collection || id === undefined) return undefined
  return `/api/${collection}/${id}?depth=0&select[${TITLE_FIELD[collection] ?? 'title'}]=true`
}

const titleOf = (doc: unknown) => (isRecord(doc) ? text(doc.displayName ?? doc.title) : undefined)

/** The title of the page or post a link points at. */
export const fetchReferenceTitle = async (reference: unknown) => {
  const url = titleUrl(reference)
  if (!url) return undefined
  const response = await fetch(url)
  return response.ok ? titleOf(await response.json()) : undefined
}

export const useReferenceTitle = (reference: unknown) => {
  const url = titleUrl(reference)
  const [loaded, setLoaded] = useState<{ url: string; title?: string }>()

  useEffect(() => {
    if (!url) return
    let cancelled = false
    fetchReferenceTitle(reference)
      .then((title) => !cancelled && setLoaded({ url, title }))
      .catch(() => {})
    return () => {
      cancelled = true
    }
    // Keyed on the URL: the reference object is rebuilt on every form-state refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  return loaded && loaded.url === url ? loaded.title : undefined
}
