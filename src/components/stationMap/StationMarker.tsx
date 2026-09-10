/**
 * A station on the map: the widget's coloured dot, or — when a marker label is chosen — a rounded
 * box carrying that reading, with an arrow for wind direction.
 */
import { ArrowUp, Camera } from 'lucide-react'

import { windArrowRotation } from '@/services/snowobs/stationMap/format'
import { cn } from '@/utilities/ui'

const DOT =
  'flex cursor-pointer items-center justify-center border border-[#34495e] font-bold leading-none text-[#ecf0f1] [text-shadow:0_1px_1px_#555555] transition-[box-shadow,border] duration-300'

const HIGHLIGHT =
  'border-[#ecf0f1] shadow-[0_14px_28px_rgba(0,0,0,0.25),0_10px_10px_rgba(0,0,0,0.24)]'

interface StationMarkerProps {
  name: string
  color: string
  /** The reading to show on the marker, or null for a plain dot. */
  label: number | null
  /** The label is a wind direction, drawn as an arrow rather than a number. */
  isWindDirection: boolean
  highlighted: boolean
  onClick: () => void
}

export function StationMarker({
  name,
  color,
  label,
  isWindDirection,
  highlighted,
  onClick,
}: StationMarkerProps) {
  const withLabel = label !== null

  return (
    <button
      type="button"
      title={name}
      tabIndex={-1}
      aria-hidden="true"
      onClick={onClick}
      data-testid="station-marker"
      className={cn(
        DOT,
        withLabel ? 'h-auto min-h-[17px] rounded-[20%] px-0.5' : 'h-[17px] w-[17px] rounded-full',
        highlighted
          ? cn(HIGHLIGHT, 'text-sm', withLabel ? 'min-h-[22px] min-w-[22px]' : 'h-[22px] w-[22px]')
          : 'text-xs',
      )}
      style={{ backgroundColor: color }}
    >
      {withLabel && isWindDirection ? (
        <ArrowUp
          className={cn('shrink-0', highlighted ? 'h-[22px] w-[22px]' : 'h-4 w-4')}
          strokeWidth={3}
          style={{ transform: `rotate(${windArrowRotation(label)}deg)` }}
        />
      ) : (
        label
      )}
    </button>
  )
}

interface WebcamMarkerProps {
  title: string
  highlighted: boolean
  onClick: () => void
}

/** A webcam on the map: the widget's red camera dot. */
export function WebcamMarker({ title, highlighted, onClick }: WebcamMarkerProps) {
  return (
    <button
      type="button"
      title={title}
      tabIndex={-1}
      aria-hidden="true"
      onClick={onClick}
      data-testid="webcam-marker"
      className={cn(
        DOT,
        'rounded-full bg-[#dc3545]',
        highlighted ? cn(HIGHLIGHT, 'h-[22px] w-[22px]') : 'h-5 w-5',
      )}
    >
      <Camera className="h-3 w-3 shrink-0" />
    </button>
  )
}
