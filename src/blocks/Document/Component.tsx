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
  // layout is present in the block config but absent from generated types until pnpm generate:types is run
  layout?: 'download' | 'embed' | null
}

export const DocumentBlockComponent = (props: Props) => {
  const { document, layout, isLayoutBlock = true } = props
  const { tenant } = useTenant()

  if (!isValidRelationship(document) || !document.url) {
    return null
  }

  const src = getMediaURL(document.url, null, getHostnameFromTenant(tenant))
  const filename = document.filename ?? 'Download'

  // Treat missing layout as 'embed' so existing blocks keep their current behavior
  const resolvedLayout = layout ?? 'embed'

  if (resolvedLayout === 'download') {
    return (
      <div className={cn('my-4', { container: isLayoutBlock })}>
        <a
          href={src}
          download={filename}
          className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          <FileDown className="h-4 w-4 shrink-0" />
          <span>{filename}</span>
        </a>
      </div>
    )
  }

  return (
    <div className={cn('my-4', { container: isLayoutBlock })}>
      <iframe src={src} width="100%" height="600px" title="Document" />
    </div>
  )
}
