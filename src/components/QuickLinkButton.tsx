import { handleReferenceURL } from '@/utilities/handleReferenceURL'
import { cn } from '@/utilities/ui'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { DataFromCollectionSlug } from 'payload'

type QuickLinkButtonProps = NonNullable<
  DataFromCollectionSlug<'homePages'>['quickLinks']
>[number] & {
  className?: string
}

export default function QuickLinkButton({
  type,
  className,
  label,
  newTab,
  reference,
  url,
}: QuickLinkButtonProps) {
  const href = handleReferenceURL({ type, reference, url })
  if (!href) return null

  const newTabProps = newTab ? { rel: 'noopener noreferrer', target: '_blank' } : {}

  return (
    <Link
      className={cn(
        'group flex items-center justify-between gap-8 rounded-lg border border-border bg-card px-6 py-3 text-card-foreground shadow-sm transition-all duration-200 hover:bg-muted hover:shadow-md flex-grow',
        className,
      )}
      href={href || url || ''}
      {...newTabProps}
    >
      <span className="font-medium whitespace-nowrap text-lg">{label}</span>
      <ArrowRight className="h-7 w-7 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1 text-primary" />
    </Link>
  )
}
