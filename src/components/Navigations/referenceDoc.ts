'use client'

import { stationPagePath } from '@/services/stations/stationPages'
import { isRecord } from '@/utilities/isRecord'
import { relationshipID } from '@/utilities/relationships'
import { useEffect, useState } from 'react'

// The fields that name a doc and give its address
const FIELDS: Record<string, string[]> = {
  pages: ['title', 'slug'],
  posts: ['title', 'slug'],
  builtInPages: ['title', 'url'],
  stationPages: ['displayName', 'slug'],
}

export type ReferenceDoc = { title?: string; path?: string }

const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value ? value : undefined

// A link's { relationTo: 'pages', value: 14 }
const referenceParts = (reference: unknown) =>
  isRecord(reference)
    ? { collection: text(reference.relationTo), id: relationshipID(reference.value) }
    : {}

// → /api/pages/14, selecting only the title and slug
const docUrl = (reference: unknown) => {
  const { collection, id } = referenceParts(reference)
  if (!collection || id === undefined) return undefined
  const fields = FIELDS[collection] ?? ['title']
  return `/api/${collection}/${id}?depth=0&${fields.map((field) => `select[${field}]=true`).join('&')}`
}

// Matches how convertToNavLink builds the site's nav URLs: pages and posts nest under the menu
const pathOf = (
  collection: string | undefined,
  doc: Record<string, unknown>,
  parents: string[],
) => {
  const slug = text(doc.slug)
  const nested = ['', ...parents].join('/')
  if (collection === 'builtInPages') return text(doc.url)
  if (!slug) return undefined
  if (collection === 'stationPages') return stationPagePath(slug)
  return collection === 'posts' ? `${nested}/blog/${slug}` : `${nested}/${slug}`
}

const fetchDoc = async (reference: unknown) => {
  const url = docUrl(reference)
  if (!url) return undefined
  const response = await fetch(url)
  const doc: unknown = response.ok ? await response.json() : undefined
  return isRecord(doc) ? doc : undefined
}

const titleOf = (doc?: Record<string, unknown>) => text(doc?.displayName ?? doc?.title)

/** The title of the page or post a link points at. */
export const fetchReferenceTitle = async (reference: unknown) => titleOf(await fetchDoc(reference))

/** The title and site path of the page or post a link points at, under the given menu segments. */
export const useReferenceDoc = (reference: unknown, parents: string[]): ReferenceDoc => {
  const url = docUrl(reference)
  const [loaded, setLoaded] = useState<{ url: string; doc?: Record<string, unknown> }>()

  useEffect(() => {
    if (!url) return
    let cancelled = false
    fetchDoc(reference)
      .then((doc) => !cancelled && setLoaded({ url, doc }))
      .catch(() => {})
    return () => {
      cancelled = true
    }
    // Keyed on the URL: the reference object is rebuilt on every form-state refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  const doc = loaded && loaded.url === url ? loaded.doc : undefined
  if (!doc) return {}
  return { title: titleOf(doc), path: pathOf(referenceParts(reference).collection, doc, parents) }
}
