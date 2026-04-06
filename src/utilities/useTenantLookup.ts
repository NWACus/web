'use client'

import * as Sentry from '@sentry/nextjs'
import { useCallback, useState } from 'react'

/**
 * Hook for looking up tenant slugs by ID and vice versa.
 * Caches results to avoid repeated API calls.
 */
export const useTenantLookup = () => {
  const [tenantIdBySlug, setTenantIdBySlug] = useState<Record<string, number>>({})
  const [tenantSlugById, setTenantSlugById] = useState<Record<number, string>>({})

  const lookupTenantIdBySlug = useCallback(
    async (slug: string): Promise<number | null> => {
      if (tenantIdBySlug[slug]) {
        return tenantIdBySlug[slug]
      }

      try {
        const response = await fetch(
          `/api/tenants?where[slug][equals]=${encodeURIComponent(slug)}&limit=1&depth=0`,
          { credentials: 'include' },
        )
        const result = await response.json()
        if (result.docs && result.docs.length > 0) {
          const id = result.docs[0].id
          setTenantIdBySlug((prev) => ({ ...prev, [slug]: id }))
          return id
        }
      } catch (error) {
        Sentry.captureException(error, { extra: { slug } })
      }
      return null
    },
    [tenantIdBySlug],
  )

  const lookupTenantSlugById = useCallback(
    async (id: number): Promise<string | null> => {
      if (tenantSlugById[id]) {
        return tenantSlugById[id]
      }

      try {
        const response = await fetch(`/api/tenants/${id}?depth=0`, { credentials: 'include' })
        const result = await response.json()
        if (result.slug) {
          setTenantSlugById((prev) => ({ ...prev, [id]: result.slug }))
          return result.slug
        }
      } catch (error) {
        Sentry.captureException(error, { extra: { id } })
      }
      return null
    },
    [tenantSlugById],
  )

  return {
    lookupTenantIdBySlug,
    lookupTenantSlugById,
  }
}
