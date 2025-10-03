import { useAnalytics } from '@/utilities/analytics'
import { cn } from '@/utilities/ui'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { ReactNode } from 'react'
import { NavLink } from './utils'

export interface RenderNavLinkProps {
  link?: NavLink | null
  className?: string
  onClick?: (e?: React.MouseEvent<HTMLAnchorElement>) => void
  children?: ReactNode
}

export const RenderNavLink = ({ link, className = '', onClick, children }: RenderNavLinkProps) => {
  const { captureWithTenant } = useAnalytics()

  if (!link) {
    return null
  }

  const onClickWrapper = (e: React.MouseEvent<HTMLAnchorElement>) => {
    captureWithTenant('navigation_click', {
      menu_item: link.label,
      destination: link.url,
    })
    if (onClick) onClick(e)
  }

  if (link.type === 'external') {
    return (
      <Link
        href={link.url}
        target={link.newTab ? '_blank' : undefined}
        className={cn(link.newTab && 'flex items-center', className)}
        onClick={onClickWrapper}
      >
        {children || link.label}
        {link.newTab && (
          <ExternalLink className="w-4 h-4 flex-shrink-0 ml-2 -mt-1.5 lg:-mt-0.5 text-muted" />
        )}
      </Link>
    )
  }

  if (link.type === 'internal') {
    return (
      <Link href={link.url} className={className} onClick={onClickWrapper}>
        {children || link.label}
      </Link>
    )
  }
}
