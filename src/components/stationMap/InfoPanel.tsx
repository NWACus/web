'use client'

/**
 * The info panel: the selected station or webcam's card, with a way to step to its neighbours.
 *
 * The widget's info window is a carousel of every visible point, scrolled so the selected one is
 * centred — a side column on desktop, a bottom strip on phones. Here the same ordered list is
 * walked one card at a time with previous/next buttons, which reads the same and is reachable by
 * keyboard. The placement matches: a left column sized to its card above `md`, a bottom sheet
 * below it that swipes like the filter drawer.
 */
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useCallback, useEffect, useReducer, useRef, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import type { MapPoint } from '@/services/snowobs/stationMap/filters'
import { cn } from '@/utilities/ui'

import { StationCard, type StationCardContext } from './StationCard'
import { WebcamCard } from './WebcamCard'
import { useSheetSwipe } from './useSheetSwipe'

/** Matches the panel's `duration-200`, with slack for the animation to finish. */
const EXIT_FALLBACK_MS = 250

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
      className={cn('h-7 w-7', className)}
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
    // `touch-none` so a drag that starts here moves the sheet rather than the page.
    <div className="shrink-0 touch-none border-b">
      <div className="flex justify-center pt-2 md:hidden" aria-hidden="true">
        <div className="h-1 w-10 rounded-full bg-neutral-300" />
      </div>
      {/* Padded enough for the buttons' focus rings, which the card below would otherwise cover. */}
      <div className="flex items-center gap-1 px-1 py-1.5 text-xs text-neutral-700">
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
          className="ml-auto"
        />
      </div>
    </div>
  )
}

interface Shown {
  point: MapPoint
  index: number
  total: number
}

/**
 * Keeps the last selection on screen through its exit animation. Once nothing is selected the
 * panel is `closed` until the animation ends — or a timer fires, where animations don't run.
 */
function useLingeringSelection(current: Shown | null) {
  const last = useRef<Shown | null>(null)
  const [, rerender] = useReducer((n: number) => n + 1, 0)
  if (current) last.current = current

  const onExited = useCallback(() => {
    if (!last.current) return
    last.current = null
    rerender()
  }, [])

  const closed = current === null
  useEffect(() => {
    if (!closed) return
    const timer = window.setTimeout(onExited, EXIT_FALLBACK_MS)
    return () => window.clearTimeout(timer)
  }, [closed, onExited])

  return { shown: current ?? last.current, closed, onExited }
}

function stepSign(delta: number): -1 | 0 | 1 {
  if (delta > 0) return 1
  if (delta < 0) return -1
  return 0
}

/** Which side the card slides in from: the way the step went, or neither when the panel just opened. */
function useStepDirection(shown: Shown | null): -1 | 0 | 1 {
  const last = useRef<{ id: string; index: number; direction: -1 | 0 | 1 } | null>(null)
  if (!shown) {
    last.current = null
    return 0
  }
  if (last.current?.id !== shown.point.id) {
    const previous = last.current
    last.current = {
      id: shown.point.id,
      index: shown.index,
      direction: previous ? stepSign(shown.index - previous.index) : 0,
    }
  }
  return last.current.direction
}

function Card({
  shown,
  direction,
  context,
  ages,
}: {
  shown: Shown
  direction: -1 | 0 | 1
  context: Omit<StationCardContext, 'ageMinutes'>
  ages: Map<string, number>
}) {
  const { point } = shown
  return (
    <div
      // Keyed on the point so a step mounts a fresh card, which slides in from the side it came from.
      key={point.id}
      className={cn(
        'flex min-h-0 flex-col',
        direction !== 0 && 'animate-in fade-in duration-200 motion-reduce:animate-none',
        direction > 0 && 'slide-in-from-right-1/4',
        direction < 0 && 'slide-in-from-left-1/4',
      )}
    >
      {point.kind === 'station' ? (
        <StationCard
          station={point.station}
          context={{ ...context, ageMinutes: ages.get(point.station.stid) ?? Infinity }}
        />
      ) : (
        <WebcamCard webcam={point.webcam} active />
      )}
    </div>
  )
}

interface InfoPanelProps {
  points: MapPoint[]
  /** The selected point's position in `points`, or -1 for none. */
  index: number
  context: Omit<StationCardContext, 'ageMinutes'>
  ages: Map<string, number>
  onStep: (delta: 1 | -1) => void
  onClose: () => void
}

export function InfoPanel({ points, index, context, ages, onStep, onClose }: InfoPanelProps) {
  const point = points[index]
  const current = index >= 0 && point ? { point, index, total: points.length } : null
  const { shown, closed, onExited } = useLingeringSelection(current)
  const direction = useStepDirection(shown)
  const { dragOffset, resetDrag, handlers } = useSheetSwipe({ onStep, onClose })

  // A sheet dragged shut keeps its offset for the exit animation; a fresh selection starts level.
  useEffect(() => {
    if (!closed) resetDrag()
  }, [closed, resetDrag])

  if (!shown) return null

  return (
    <aside
      aria-label="Selected station"
      data-state={closed ? 'closed' : 'open'}
      className={cn(
        'absolute inset-x-0 bottom-0 z-20 flex h-1/2 flex-col overflow-hidden rounded-t-2xl bg-white text-sm text-neutral-900 shadow-lg',
        'md:inset-x-auto md:bottom-auto md:left-2.5 md:top-2.5 md:h-auto md:max-h-[calc(100%-1.25rem)] md:w-[310px] md:rounded-md md:shadow-md',
        // Slides up as a sheet; nudges in with a fade as a column.
        'duration-200 motion-reduce:animate-none',
        'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom md:data-[state=open]:fade-in md:data-[state=open]:slide-in-from-bottom-2',
        'data-[state=closed]:animate-out data-[state=closed]:fill-mode-forwards data-[state=closed]:slide-out-to-bottom md:data-[state=closed]:fade-out md:data-[state=closed]:slide-out-to-bottom-2',
        // Follows the finger while dragging, then springs back if the drag didn't close it.
        dragOffset === 0 && 'transition-transform',
      )}
      style={dragOffset > 0 ? { transform: `translateY(${dragOffset}px)` } : undefined}
      onAnimationEnd={(event) => {
        if (closed && event.target === event.currentTarget) onExited()
      }}
      {...handlers}
    >
      <PanelNav index={shown.index} total={shown.total} onStep={onStep} onClose={onClose} />
      <Card shown={shown} direction={direction} context={context} ages={ages} />
    </aside>
  )
}
