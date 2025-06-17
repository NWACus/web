'use client'
import { getURL } from '@/utilities/getURL'
import { RefreshRouteOnSave as PayloadLivePreview } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'

export const LivePreviewListener = () => {
  const router = useRouter()
  return <PayloadLivePreview refresh={router.refresh} serverURL={getURL()} />
}
