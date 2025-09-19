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
  const center: string | undefined =
    type === 'internal' &&
    typeof reference?.value === 'object' &&
    reference.value.tenant &&
    typeof reference.value.tenant === 'object'
      ? reference.value.tenant.slug
      : undefined

  let href = url
  if (center) {
    href = `/${center}/`
  } else if (type === 'internal' && typeof reference?.value === 'object') {
    const { relationTo, value } = reference
    const prefix = reference?.relationTo !== 'pages' ? `/${reference?.relationTo}` : ''
    if ('slug' in value) {
      href = `${prefix}/${value.slug}`
    } else if (relationTo === 'builtInPages' && 'url' in value) {
      href = `/${value.url}`
    }
  }
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
