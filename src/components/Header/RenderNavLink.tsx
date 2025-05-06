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
        className={className}
        onClick={onClick}
      >
        {children || link.label}
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
