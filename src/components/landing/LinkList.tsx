import Link from 'next/link'

import { cn } from '@/utilities/ui'

export interface LinkItem {
  href: string
  label: string
}

interface LinkListProps {
  links: LinkItem[]
  linkClassName: string
  className?: string
}

/** A wrapping row of links. In-app paths go through `next/link`; everything else is a plain anchor. */
export function LinkList({ links, linkClassName, className }: LinkListProps) {
  return (
    <ul className={cn('flex flex-wrap gap-x-6 gap-y-2', className)}>
      {links.map((link) => (
        <li key={link.href}>
          {link.href.startsWith('/') ? (
            <Link href={link.href} className={linkClassName}>
              {link.label}
            </Link>
          ) : (
            <a href={link.href} className={linkClassName}>
              {link.label}
            </a>
          )}
        </li>
      ))}
    </ul>
  )
}
