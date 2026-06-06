'use client'
import { type DocumentBlock as DocumentBlockProps } from '@/payload-types'
import { useTenant } from '@/providers/TenantProvider'
import { getMediaURL } from '@/utilities/getURL'
import { isValidRelationship } from '@/utilities/relationships'
import { getHostnameFromTenant } from '@/utilities/tenancy/getHostnameFromTenant'
import { cn } from '@/utilities/ui'
import { FileDown } from 'lucide-react'

// MIME types that browsers can reliably render in an iframe
const EMBEDDABLE_MIME_TYPES = new Set([
  'application/pdf',
  'text/html',
  'text/plain',
  'text/xml',
  'application/xml',
  'application/vnd.google-earth.kml+xml',
])

type Props = DocumentBlockProps & {
  isLayoutBlock: boolean
  // displayAs is present in the block config but absent from generated types until pnpm generate:types is run
  displayAs?: 'download' | 'embed' | null
}

export const DocumentBlockComponent = (props: Props) => {
  const { document, displayAs, isLayoutBlock = true } = props
  const { tenant } = useTenant()

  if (!isValidRelationship(document) || !document.url) {
    return null
  }

  const src = getMediaURL(document.url, null, getHostnameFromTenant(tenant))
  const filename = document.filename ?? 'Download'

  const isEmbeddable = document.mimeType != null && EMBEDDABLE_MIME_TYPES.has(document.mimeType)
  const resolvedDisplay = displayAs === 'embed' && isEmbeddable ? 'embed' : 'download'

  if (resolvedDisplay === 'embed') {
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
