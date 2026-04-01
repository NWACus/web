/**
 * Danger triangle SVG — 3-trapezoid pyramid colored by danger level per elevation band.
 * Pixel-perfect port from avy/components/AvalancheDangerTriangle.tsx.
 * SVG path data copied verbatim from the AvyApp source.
 */
import { dangerColor } from '@/services/nac/dangerScale'
import { DangerLevel } from '@/services/nac/types/forecastSchemas'

interface DangerTriangleProps {
  upper: DangerLevel
  middle: DangerLevel
  lower: DangerLevel
  className?: string
}

export function DangerTriangle({ upper, middle, lower, className }: DangerTriangleProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 168 173"
      fillRule="evenodd"
      clipRule="evenodd"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit={1.5}
    >
      <path d="M110.669 55H57.3103L83.9995 0L110.669 55Z" fill={dangerColor(upper)} strokeWidth={0} />
      <path d="M112.5 59H55.5L28.5 114H139.5L112.5 59Z" fill={dangerColor(middle)} strokeWidth={0} />
      <path d="M141 118H27L0 173H168L141 118Z" fill={dangerColor(lower)} strokeWidth={0} />
    </svg>
  )
}
