'use client'
import { type DocumentBlock as DocumentBlockProps } from '@/payload-types'
import { useTenant } from '@/providers/TenantProvider'
import { getMediaURL } from '@/utilities/getURL'
import { isValidRelationship } from '@/utilities/relationships'
import { getHostnameFromTenant } from '@/utilities/tenancy/getHostnameFromTenant'
import { cn } from '@/utilities/ui'

type Props = DocumentBlockProps & {
  isLexical: boolean
}

export const DocumentBlockComponent = (props: Props) => {
  const { document, isLexical = true } = props
  const { tenant } = useTenant()

  if (!isValidRelationship(document) || !document.url) {
    return null
  }

  const src = getMediaURL(document.url, null, getHostnameFromTenant(tenant))

  return (
    <div className={cn('my-4', { container: isLexical })}>
      <iframe src={src} width="100%" height="600px" title="Document PDF" />
    </div>
  )
}
