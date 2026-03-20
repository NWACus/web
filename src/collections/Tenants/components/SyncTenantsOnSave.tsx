'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import { useEffect, useRef } from 'react'

import { useTenantSelection } from '@/providers/TenantSelectionProvider/index.client'

/**
 * Invisible component placed on the Tenants edit view that syncs the tenant
 * selector dropdown whenever a tenant document is saved (created or updated).
 */
export const SyncTenantsOnSave = () => {
  const { lastUpdateTime } = useDocumentInfo()
  const { syncTenants } = useTenantSelection()
  const prevUpdateTime = useRef(lastUpdateTime)

  useEffect(() => {
    if (lastUpdateTime !== prevUpdateTime.current) {
      prevUpdateTime.current = lastUpdateTime
      syncTenants()
    }
  }, [lastUpdateTime, syncTenants])

  return null
}
