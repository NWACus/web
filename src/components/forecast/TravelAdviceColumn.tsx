/**
 * The danger scale's travel advice for each band of one day, upper to lower, in grey rows the
 * height of the danger rows so it lines up beside them — what the widget puts in the outlook's
 * place when a center issues no outlook. Shared with the all-zones cards.
 */
import { travelAdvice } from '@/services/nac/dangerScale'
import type { AvalancheDangerForecast } from '@/services/nac/model/forecast'

interface TravelAdviceColumnProps {
  /** The day's per-band ratings. */
  danger: Pick<AvalancheDangerForecast, 'upper' | 'middle' | 'lower'>
  /** Leave room for a date heading above the rows, as the day column beside it has. */
  alignWithHeading?: boolean
  className?: string
}

export function TravelAdviceColumn({
  danger,
  alignWithHeading = true,
  className,
}: TravelAdviceColumnProps) {
  const levels = [danger.upper, danger.middle, danger.lower]

  return (
    <div className={className}>
      {/* The height of a day column's `h4` (text-sm line plus mb-3). */}
      {alignWithHeading && <div aria-hidden className="mb-3 h-5" />}
      <ul aria-label="Travel advice">
        {levels.map((level, i) => (
          <li
            key={i}
            className="mb-[3px] flex h-[60px] items-center bg-muted px-4 text-sm leading-snug sm:mb-[5px] sm:h-[90px]"
          >
            {/* The advice is the danger scale's own constant HTML (a <strong> lead), not upstream text. */}
            <span dangerouslySetInnerHTML={{ __html: travelAdvice(level) }} />
          </li>
        ))}
      </ul>
    </div>
  )
}
