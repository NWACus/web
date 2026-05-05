'use client'

import type { OptionObject } from 'payload'

import { toast, useAuth, useConfig } from '@payloadcms/ui'
import { useRouter } from 'next/navigation.js'
import React, { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { generateCookie } from '@/utilities/tenancy/generateCookie'

type ContextType = {
  /**
   * What is the context of the selector? It is either 'document' | 'global' | undefined.
   *
   * - 'document' means you are viewing a document in the context of a tenant
   * - 'global' means you are viewing a "global" (globals are collection documents but prevent you from viewing the list view) document in the context of a tenant
   * - undefined means you are not viewing a document at all
   */
  entityType?: 'document' | 'global'
  /**
   * Hoists the forms modified state
   */
  modified?: boolean
  /**
   * Array of options to select from (value is tenant slug)
   */
  options: OptionObject[]
  /**
   * The currently selected tenant slug
   */
  selectedTenantSlug: string | undefined
  /**
   * Sets the entityType when a document is loaded and sets it to undefined when the document unmounts.
   */
  setEntityType: React.Dispatch<React.SetStateAction<'document' | 'global' | undefined>>
  /**
   * Sets the modified state
   */
  setModified: React.Dispatch<React.SetStateAction<boolean>>
  /**
   * Sets the selected tenant by slug
   *
   * @param args.slug - The slug of the tenant to select
   * @param args.refresh - Whether to refresh the page after changing the tenant
   */
  setTenant: (args: { slug: string | undefined; refresh?: boolean }) => void
  /**
   * Used to sync tenants displayed in the tenant selector when updates are made to the tenants collection.
   */
  syncTenants: () => Promise<void>
  /**
   * Updates a tenant's label in the local options
   */
  updateTenants: (args: { slug: string; label: string }) => void
}

const Context = createContext<ContextType>({
  entityType: undefined,
  options: [],
  selectedTenantSlug: undefined,
  setEntityType: () => undefined,
  setModified: () => undefined,
  setTenant: () => null,
  syncTenants: () => Promise.resolve(),
  updateTenants: () => null,
})

const DEFAULT_COOKIE_NAME = 'payload-tenant'

const setTenantCookie = (args: { cookieName?: string; value: string }) => {
  const { cookieName = DEFAULT_COOKIE_NAME, value } = args
  document.cookie = generateCookie({
    name: cookieName,
    maxAge: 60 * 60 * 24 * 365, // 1 year in seconds
    path: '/',
    returnCookieAsObject: false,
    value: value || '',
  })
}

const deleteTenantCookie = (args: { cookieName?: string } = {}) => {
  const { cookieName = DEFAULT_COOKIE_NAME } = args
  document.cookie = generateCookie({
    name: cookieName,
    maxAge: -1,
    path: '/',
    returnCookieAsObject: false,
    value: '',
  })
}

const getTenantCookie = (args: { cookieName?: string } = {}): string | undefined => {
  const { cookieName = DEFAULT_COOKIE_NAME } = args
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${cookieName}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift()
  }
  return undefined
}

export const TenantSelectionProviderClient = ({
  children,
  initialTenantOptions,
  initialValue,
  tenantsCollectionSlug,
}: {
  children: React.ReactNode
  initialTenantOptions: OptionObject[]
  initialValue?: string
  tenantsCollectionSlug: string
}) => {
  const [selectedTenantSlug, setSelectedTenantSlug] = useState<string | undefined>(initialValue)
  const [modified, setModified] = useState<boolean>(false)
  const [entityType, setEntityType] = useState<'document' | 'global' | undefined>(undefined)
  const { user } = useAuth()
  const { config } = useConfig()
  const router = useRouter()
  const userID = useMemo(() => user?.id, [user?.id])
  // Tracks the previous userID so the effect below can detect login/logout
  // transitions. Read inside the effect, never during render.
  const prevUserIDRef = useRef(userID)
  const [tenantOptions, setTenantOptions] = useState<OptionObject[]>(() => initialTenantOptions)
  const selectedTenantLabel = useMemo(
    () => tenantOptions.find((option) => option.value === selectedTenantSlug)?.label,
    [selectedTenantSlug, tenantOptions],
  )

  const setTenantAndCookie = useCallback(
    ({ slug, refresh }: { slug: string | undefined; refresh?: boolean }) => {
      setSelectedTenantSlug(slug)
      if (slug !== undefined) {
        setTenantCookie({ value: slug })
      } else {
        deleteTenantCookie()
      }
      if (refresh) {
        router.refresh()
      }
    },
    [router],
  )

  const setTenant = useCallback<ContextType['setTenant']>(
    ({ slug, refresh }) => {
      if (slug === undefined) {
        if (tenantOptions.length > 1 || tenantOptions.length === 0) {
          // users with multiple tenants can clear the tenant selection
          setTenantAndCookie({ slug: undefined, refresh })
        } else if (tenantOptions[0]) {
          // if there is only one tenant, auto-select that tenant
          setTenantAndCookie({ slug: tenantOptions[0].value, refresh: true })
        }
      } else if (!tenantOptions.find((option) => option.value === slug)) {
        // if the tenant is invalid, set the first tenant as selected
        setTenantAndCookie({
          slug: tenantOptions[0]?.value ? tenantOptions[0].value : undefined,
          refresh,
        })
      } else {
        // if the tenant is in the options, set it as selected
        setTenantAndCookie({ slug, refresh })
      }
    },
    [tenantOptions, setTenantAndCookie],
  )

  const syncTenants = useCallback(async () => {
    try {
      const req = await fetch(
        `${config.serverURL}${config.routes.api}/${tenantsCollectionSlug}/?select[slug]=true&select[name]=true&limit=0&depth=0&sort=name`,
        {
          credentials: 'include',
          method: 'GET',
        },
      )

      const result = await req.json()

      if (result.docs && userID) {
        setTenantOptions(
          result.docs.map((doc: Record<string, string>) => ({
            label: doc.name,
            value: doc.slug,
          })),
        )

        if (result.docs.length === 1) {
          const firstSlug = result.docs[0].slug
          setSelectedTenantSlug(firstSlug)
          setTenantCookie({ value: firstSlug })
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error fetching tenants')
    }
  }, [config.serverURL, config.routes.api, tenantsCollectionSlug, userID])

  const updateTenants = useCallback<ContextType['updateTenants']>(
    ({ slug, label }) => {
      setTenantOptions((prev) => {
        return prev.map((currentTenant) => {
          if (slug === currentTenant.value) {
            return {
              label,
              value: slug,
            }
          }
          return currentTenant
        })
      })

      void syncTenants()
    },
    [syncTenants],
  )

  // Sync tenant state with auth transitions: refetch on login, clear on
  // logout. Auth (Payload `useAuth`) is the external system this effect
  // subscribes to; the local state updates are propagation, not derivation.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const userChanged = userID !== prevUserIDRef.current
    if (userChanged || (initialValue && initialValue !== getTenantCookie())) {
      if (userID) {
        void syncTenants()
      } else {
        setSelectedTenantSlug(undefined)
        deleteTenantCookie()
        if (tenantOptions.length > 0) {
          setTenantOptions([])
        }
        router.refresh()
      }
      prevUserIDRef.current = userID
    }
  }, [userID, syncTenants, tenantOptions, initialValue, router])

  // Clear stale tenant cookie when the server didn't pass an initial value.
  useEffect(() => {
    if (!initialValue) {
      setTenant({ slug: undefined, refresh: true })
    }
  }, [initialValue, setTenant])

  // Auto-select the first tenant when rendering a global entity that has no
  // current selection.
  useEffect(() => {
    if (!selectedTenantSlug && tenantOptions.length > 0 && entityType === 'global') {
      setTenant({
        slug: tenantOptions[0]?.value ? tenantOptions[0].value : undefined,
        refresh: true,
      })
    }
  }, [selectedTenantSlug, tenantOptions, entityType, setTenant])
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <span
      data-selected-tenant-slug={selectedTenantSlug}
      data-selected-tenant-title={selectedTenantLabel}
    >
      <Context
        value={{
          entityType,
          modified,
          options: tenantOptions,
          selectedTenantSlug,
          setEntityType,
          setModified,
          setTenant,
          syncTenants,
          updateTenants,
        }}
      >
        {children}
      </Context>
    </span>
  )
}

export const useTenantSelection = () => use(Context)
