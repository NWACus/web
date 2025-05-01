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

  if (link.type === 'internal-reference' && link.reference) {
    const url =
      link.reference.relationTo === 'pages'
        ? `/${typeof link.reference.value === 'object' ? link.reference.value.slug : link.reference.value}`
        : `/posts/${typeof link.reference.value === 'object' ? link.reference.value.slug : link.reference.value}`

    return (
      <Link href={url} className={className} onClick={onClick}>
        {children || link.label}
      </Link>
    )
  }

  if (link.type === 'internal-relative') {
    return (
      <Link href={link.url} className={className} onClick={onClick}>
        {children || link.label}
      </Link>
    )
  }

  // Fallback
  return <span className={className}>{children}</span>
}
