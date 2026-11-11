'use client'

import { cn } from '@/utilities/ui'
import { ShimmerEffect } from '@payloadcms/ui'
import type { ReactNode } from 'react'
import { TabPills } from '../TabPills'
import type { PanelState } from '../usePanel'

export const MUTED = 'text-[var(--theme-elevation-600)]'

/** A card's title, with its actions such as the download menu opposite. */
export function PanelHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-2">
      <h3 className="m-0 text-base font-semibold">{title}</h3>
      {actions}
    </div>
  )
}

/** Shared chrome for every list panel: a titled card, its tabs and the loading and error states. */
export function PanelFrame({
  title,
  tabs,
  active,
  onTab,
  actions,
  children,
  className,
}: {
  title: string
  /** Hidden when there is only one: the title already names it. */
  tabs: ReadonlyArray<{ key: string; label: string }>
  active: string
  onTab: (key: string) => void
  /** Sits opposite the tabs, e.g. the export menu. */
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('card min-w-0 flex-col gap-0', className)}>
      <PanelHeader title={title} actions={actions} />
      {tabs.length > 1 && (
        <div className="mb-4">
          <TabPills options={tabs} active={active} onChange={onTab} />
        </div>
      )}
      {children}
    </section>
  )
}

export function PanelBody<T>({
  state,
  empty,
  children,
}: {
  state: PanelState<T>
  empty: string
  children: (data: T) => ReactNode
}) {
  if (state.status === 'loading') {
    return (
      <div className="flex flex-col gap-2" aria-busy>
        {Array.from({ length: 6 }, (_, i) => (
          <ShimmerEffect key={i} height="1.5rem" width={`${90 - i * 9}%`} />
        ))}
      </div>
    )
  }
  if (state.status === 'error') {
    return <p className={cn('m-0 text-sm', MUTED)}>{state.message}</p>
  }
  const content = children(state.data)
  return content ?? <p className={cn('m-0 text-sm', MUTED)}>{empty}</p>
}
