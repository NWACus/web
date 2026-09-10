'use client'

/**
 * The info panel: the selected station or webcam's card, with a way to step to its neighbours.
 *
 * The widget's info window is a carousel of every visible point, scrolled so the selected one is
 * centred — a side column on desktop, a bottom strip on phones. Here the same ordered list is
 * walked one card at a time with previous/next buttons, which reads the same and is reachable by
 * keyboard. The placement matches: left column above `md`, bottom sheet below it.
 */
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import type { MapPoint } from '@/services/snowobs/stationMap/filters'

import { StationCard, type StationCardContext } from './StationCard'
import { WebcamCard } from './WebcamCard'

function NavButton({
  label,
  icon,
  onClick,
  disabled = false,
  className,
}: {
  label: string
  icon: ReactNode
  onClick: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className ?? 'h-7 w-7'}
      onClick={onClick}
      disabled={disabled}
      title={label}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </Button>
  )
}

function PanelNav({
  index,
  total,
  onStep,
  onClose,
}: {
  index: number
  total: number
  onStep: (delta: 1 | -1) => void
  onClose: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-1 rounded-t-md bg-white/95 px-1 py-0.5 text-xs text-neutral-700 shadow-md">
      <NavButton
        label="Previous"
        icon={<ChevronLeft className="h-4 w-4" aria-hidden="true" />}
        onClick={() => onStep(-1)}
        disabled={index <= 0}
      />
      <span aria-live="polite">
        {index + 1} of {total}
      </span>
      <NavButton
        label="Next"
        icon={<ChevronRight className="h-4 w-4" aria-hidden="true" />}
        onClick={() => onStep(1)}
        disabled={index >= total - 1}
      />
      <NavButton
        label="Close"
        icon={<X className="h-4 w-4" aria-hidden="true" />}
        onClick={onClose}
        className="ml-auto h-7 w-7"
      />
    </div>
  )
}

interface InfoPanelProps {
  points: MapPoint[]
  index: number
  context: Omit<StationCardContext, 'ageMinutes'>
  ages: Map<string, number>
  onStep: (delta: 1 | -1) => void
  onClose: () => void
}

export function InfoPanel({ points, index, context, ages, onStep, onClose }: InfoPanelProps) {
  const point = points[index]
  if (!point) return null

  return (
    <aside
      aria-label="Selected station"
      className="absolute inset-x-0 bottom-0 z-20 flex max-h-[60%] flex-col md:inset-x-auto md:bottom-2.5 md:left-2.5 md:top-2.5 md:max-h-none md:w-[310px]"
    >
      <PanelNav index={index} total={points.length} onStep={onStep} onClose={onClose} />
      <div className="overflow-y-auto pb-1 md:pb-0">
        {point.kind === 'station' ? (
          <StationCard
            station={point.station}
            context={{ ...context, ageMinutes: ages.get(point.station.stid) ?? Infinity }}
          />
        ) : (
          <WebcamCard webcam={point.webcam} active />
        )}
      </div>
    </aside>
  )
}
