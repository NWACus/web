/**
 * Single elevation band row: label + colored bar with icon + danger name.
 */
import Image from 'next/image'

import { dangerColor, dangerIconUrl, dangerName, dangerTextColor } from '@/services/nac/dangerScale'
import { DangerLevel } from '@/services/nac/types/forecastSchemas'

import { sanitizeHtml } from './sanitizeHtml'

interface DangerElevationBandProps {
  label: string
  level: DangerLevel
}

export function DangerElevationBand({ label, level }: DangerElevationBandProps) {
  const bgColor = dangerColor(level)
  const textColor = dangerTextColor(level)

  return (
    <div className="flex items-center gap-3">
      {/* Elevation labels may contain HTML (e.g. "Upper Elevations <br> 7500-5500ft") */}
      <div
        className="w-28 shrink-0 text-sm font-semibold"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(label) }}
      />
      <div
        className="flex flex-1 items-center justify-between rounded px-3 py-2"
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        <span className="text-sm font-medium">{dangerName(level)}</span>
        <Image src={dangerIconUrl(level)} alt={dangerName(level)} width={28} height={28} />
      </div>
    </div>
  )
}
