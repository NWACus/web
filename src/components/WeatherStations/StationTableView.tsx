'use client'

import type { StationTable } from '@/services/snowobs/tableHelpers'
import { cn } from '@/utilities/ui'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { StationNowTable } from './StationNowTable'
import { TABLE_WINDOWS } from './StationRangeTabs'
import { convertStationTable } from './stationTableUnits'
import { UnitToggle, useUnitSystem } from './UnitToggle'

// Scales the table down to the viewport width instead of horizontally
// scrolling (scrollWidth sees through the table wrapper's overflow).
function FitToWidth({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<{ scale: number; width: number; height: number } | null>(
    null,
  )

  useEffect(() => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return
    const update = () => {
      const natural = Math.max(content.scrollWidth, content.offsetWidth)
      const scale = container.clientWidth / natural
      setLayout(scale < 1 ? { scale, width: natural, height: content.offsetHeight * scale } : null)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(container)
    observer.observe(content)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      style={layout ? { height: layout.height, overflow: 'hidden' } : undefined}
    >
      <div
        ref={contentRef}
        style={
          layout
            ? {
                width: layout.width,
                transform: `scale(${layout.scale})`,
                transformOrigin: 'top left',
              }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  )
}

// Window changes navigate (the table is server-built per window); unit changes
// convert client-side.
function TableWindowPicker({ activeKey }: { activeKey: string }) {
  return (
    <div className="flex gap-1">
      {TABLE_WINDOWS.map((w) => (
        <Link
          key={w.key}
          href={`?range=table&window=${w.key}`}
          aria-current={w.key === activeKey ? 'true' : undefined}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm',
            w.key === activeKey
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground',
          )}
        >
          {w.label}
        </Link>
      ))}
    </div>
  )
}

export function StationTableView({
  table,
  activeWindowKey,
}: {
  table: StationTable
  activeWindowKey: string
}) {
  const [unitSystem, changeUnitSystem] = useUnitSystem()
  const display = useMemo(() => convertStationTable(table, unitSystem), [table, unitSystem])
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TableWindowPicker activeKey={activeWindowKey} />
        <UnitToggle unit={unitSystem} onChange={changeUnitSystem} />
      </div>
      <FitToWidth>
        <StationNowTable
          table={display}
          elevationUnit={unitSystem === 'metric' ? ' m' : undefined}
        />
      </FitToWidth>
    </div>
  )
}
