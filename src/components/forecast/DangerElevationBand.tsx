/**
 * Single elevation band row: label + colored bar with icon + danger name.
 */
import Image from 'next/image'

import {
  dangerColor,
  dangerIconUrl,
  dangerLevelLabel,
  dangerName,
  dangerTextColor,
} from '@/services/nac/dangerScale'
import { DangerLevel } from '@/services/nac/model/forecast'

import { sanitizeHtml } from './sanitizeHtml'

interface DangerElevationBandProps {
  label: string
  level: DangerLevel
}

export function DangerElevationBand({ label, level }: DangerElevationBandProps) {
  const bgColor = dangerColor(level)
  const textColor = dangerTextColor(level)

  return (
    // Label above the bar on mobile (so the full-width bar always fits the rating), beside it from
    // sm up. min-w-0 lets the bar shrink instead of overflowing the viewport.
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
      {/* Elevation labels may contain HTML (e.g. "Upper Elevations <br> 7500-5500ft") */}
      <div
        className="text-sm font-semibold sm:w-36 sm:shrink-0"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(label) }}
      />
      <div
        className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded px-3 py-2"
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        <span className="text-sm font-medium">{dangerLevelLabel(level)}</span>
        <Image
          src={dangerIconUrl(level)}
          alt={dangerName(level)}
          width={28}
          height={28}
          className="shrink-0"
        />
      </div>
    </div>
  )
}
