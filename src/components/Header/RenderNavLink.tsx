import { cn } from '@/utilities/ui'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { ReactNode } from 'react'
import { NavLink } from './utils'

export interface RenderNavLinkProps {
  link?: NavLink | null
  className?: string
  onClick?: () => void
  children?: ReactNode
}

export const RenderNavLink = ({ link, className = '', onClick, children }: RenderNavLinkProps) => {
  if (!link) {
    return null
  }

  if (link.type === 'external') {
    return (
      <Link
        href={link.url}
        target={link.newTab ? '_blank' : undefined}
        className={cn(link.newTab && 'flex items-center', className)}
        onClick={onClick}
      >
        {children || link.label}
        {link.newTab && (
          <ExternalLink className="w-4 h-4 flex-shrink-0 ml-2 -mt-1.5 lg:-mt-0.5 text-neutral-50/70" />
        )}
      </Link>
    )
  }

  if (link.type === 'internal') {
    return (
      <Link href={link.url} className={className} onClick={onClick}>
        {children || link.label}
      </Link>
    )
  }
}
