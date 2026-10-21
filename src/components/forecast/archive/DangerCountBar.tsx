/**
 * The per-level tally over the filtered list — No Rating through Extreme, each with its danger
 * icon — matching the legacy widget's `DangerCount` bar.
 */
import {
  dangerIconSize,
  dangerIconUrl,
  dangerLevelFromRating,
  dangerName,
} from '@/services/nac/dangerScale'
import { ARCHIVE_DANGER_LEVELS } from '@/services/nac/forecastArchive'

interface DangerCountBarProps {
  /** Counts indexed by danger level 0–5. */
  counts: number[]
}

export function DangerCountBar({ counts }: DangerCountBarProps) {
  return (
    <ul
      className="grid list-none grid-cols-3 gap-2 rounded-lg bg-muted px-4 py-2 sm:grid-cols-6"
      aria-label="Products by danger rating"
    >
      {ARCHIVE_DANGER_LEVELS.map((level) => {
        const dangerLevel = dangerLevelFromRating(level)
        const name = dangerName(dangerLevel)
        const iconSize = dangerIconSize(dangerLevel)

        return (
          <li
            key={level}
            className="flex items-center justify-center gap-2 py-1 font-bold"
            aria-label={`${name}: ${counts[level] ?? 0}`}
          >
            {/* Self-hosted static PNG; the intrinsic dimensions reserve the space at the real
                aspect ratio so the row doesn't shift on load. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={dangerIconUrl(dangerLevel)}
              alt=""
              width={iconSize.width}
              height={iconSize.height}
              className="h-[30px] w-auto"
              aria-hidden="true"
            />
            <span aria-hidden="true">{counts[level] ?? 0}</span>
          </li>
        )
      })}
    </ul>
  )
}
