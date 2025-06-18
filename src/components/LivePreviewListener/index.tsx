'use client'
import { useTenant } from '@/providers/TenantProvider'
import { getHostnameFromTenant } from '@/utilities/getHostnameFromTenant'
import { getURL } from '@/utilities/getURL'
import { RefreshRouteOnSave as PayloadLivePreview } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'

export const LivePreviewListener = () => {
  const router = useRouter()
  const { tenant } = useTenant()
  const hostname = getHostnameFromTenant(tenant)
  return <PayloadLivePreview refresh={router.refresh} serverURL={getURL(hostname)} />
}
