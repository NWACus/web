/** The widget's map key: what each marker color means on the showing tab. */
import type { ObservationKind } from '@/services/nac/model/observation'

import { AVALANCHE_LEGEND, OBSERVATION_LEGEND } from './markerStyle'

export function MapLegend({ kind }: { kind: ObservationKind }) {
  const entries = kind === 'observation' ? OBSERVATION_LEGEND : AVALANCHE_LEGEND
  return (
    <ul
      className="absolute bottom-2 left-2 z-10 flex flex-wrap gap-x-3 gap-y-1 rounded bg-white/95 px-2 py-1 text-xs text-neutral-800 shadow"
      aria-label="Map key"
    >
      {entries.map((entry) => (
        <li key={entry.label} className="flex items-center gap-1">
          <span
            className="inline-block h-3 w-3 rounded-full border border-black/40"
            style={{ backgroundColor: entry.color }}
            aria-hidden="true"
          />
          {entry.label}
        </li>
      ))}
    </ul>
  )
}
