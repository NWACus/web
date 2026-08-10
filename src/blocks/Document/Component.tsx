'use client'
import { type DocumentBlock as DocumentBlockProps } from '@/payload-types'
import { useTenant } from '@/providers/TenantProvider'
import { getMediaURL } from '@/utilities/getURL'
import { isValidRelationship } from '@/utilities/relationships'
import { getHostnameFromTenant } from '@/utilities/tenancy/getHostnameFromTenant'
import { cn } from '@/utilities/ui'
import { FileDown } from 'lucide-react'

type Props = DocumentBlockProps & {
  isLayoutBlock: boolean
}

export const DocumentBlockComponent = (props: Props) => {
  const { document, displayAs, isLayoutBlock = true } = props
  const { tenant } = useTenant()

  if (!isValidRelationship(document) || !document.url) {
    return null
  }

  const src = getMediaURL(document.url, null, getHostnameFromTenant(tenant))
  const filename = document.filename ?? 'Download'

  if (displayAs === 'embed') {
    return (
      <div className={cn('my-4', { container: isLayoutBlock })}>
        <iframe src={src} width="100%" height="600px" title="Document" />
      </div>
    )
  }

  return (
    <div className={cn('my-4', { container: isLayoutBlock })}>
      <a
        href={src}
        download={filename}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
      >
        <FileDown className="h-4 w-4 shrink-0" />
        <span>{filename}</span>
      </a>
    </div>
  )
}
