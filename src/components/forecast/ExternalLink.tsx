/**
 * A text link that opens in a new tab, with a trailing new-tab icon — used for reference/explainer
 * links out to avalanche.org, nwac.us, etc. so it's always clear the link leaves the site.
 */
import { ExternalLink as ExternalLinkIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/utilities/ui'

interface ExternalLinkProps {
  href: string
  children: ReactNode
  className?: string
}

export function ExternalLink({ href, children, className }: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1 underline underline-offset-2 hover:no-underline',
        className,
      )}
    >
      {children}
      <ExternalLinkIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    </a>
  )
}
