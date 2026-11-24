'use client'

import { cn } from '@/utilities/ui'
import { Popup } from '@payloadcms/ui'
import { Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { MUTED } from './Panel'

export type DocLink = { label: string; href: string }

/** An outside doc, opened in a new tab so the dashboard keeps its state. */
export function DocAnchor({ link }: { link: DocLink }) {
  return (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className="underline">
      {link.label}
    </a>
  )
}

/** The ⓘ beside a card's title: how the card's numbers are defined, opened on click. */
export function InfoPopup({ name, children }: { name: string; children: ReactNode }) {
  return (
    <Popup
      horizontalAlign="left"
      size="fit-content"
      // Payload caps popups at 200px; definitions run longer. Tailwind reads a bare _ as a space.
      portalClassName="[&_.popup\_\_scroll-container]:max-h-[70vh]"
      button={
        <span className={cn('flex items-center', MUTED)} title={`About ${name}`}>
          <Info className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">About {name}</span>
        </span>
      }
      render={() => <div className="flex w-80 flex-col gap-2 p-1 text-sm">{children}</div>}
    />
  )
}
