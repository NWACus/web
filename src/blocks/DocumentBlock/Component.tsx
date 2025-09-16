'use client'
import { type DocumentBlock as DocumentBlockProps } from '@/payload-types'
import { useTenant } from '@/providers/TenantProvider'
import { getMediaURL } from '@/utilities/getURL'
import { getHostnameFromTenant } from '@/utilities/tenancy/getHostnameFromTenant'
import { cn } from '@/utilities/ui'

type Props = DocumentBlockProps & {
  wrapInContainer?: boolean
}

export const DocumentBlock = (props: Props) => {
  const { document, wrapInContainer = true } = props
  const { tenant } = useTenant()

  if (!document) return null
  const src =
    typeof document !== 'number'
      ? getMediaURL(document.url, null, getHostnameFromTenant(tenant))
      : ''

  return (
    <div className={cn('my-4', { container: wrapInContainer })}>
      <iframe src={src} width="100%" height="600px" title="Document PDF" />
    </div>
  )
}
