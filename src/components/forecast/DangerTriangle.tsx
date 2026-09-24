/**
 * Danger triangle SVG — 3-trapezoid pyramid colored by danger level per elevation band.
 * Path data copied verbatim from the legacy afp widget's DangerElevation.vue, so the pyramid has
 * the widget's proportions behind the danger rows.
 */
import { dangerColor } from '@/services/nac/dangerScale'
import { DangerLevel } from '@/services/nac/model/forecast'

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
      viewBox="0 0 250 300"
      fillRule="evenodd"
      clipRule="evenodd"
      strokeLinejoin="round"
      strokeMiterlimit={2}
    >
      <path
        d="M40.632,203.317l169.248,0.079l40.166,96.604l-249.519,-0.097l40.105,-96.586Z"
        fill={dangerColor(lower)}
      />
      <path
        d="M207.532,197.909l-164.605,0.049l40.134,-96.303l84.407,-0.046l40.064,96.3Z"
        fill={dangerColor(middle)}
      />
      <path
        d="M165.209,96.238l-80.038,-0.012l40.041,-96.226l39.997,96.238Z"
        fill={dangerColor(upper)}
      />
    </svg>
  )
}
