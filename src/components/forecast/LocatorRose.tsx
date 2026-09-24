/**
 * Locator rose with elevation-band leader lines: the rose from `./LocatorRoseGraphic` plus, given
 * the zone's elevation band names, leader lines from the upper/middle/lower rings down to those
 * names. The names are upstream HTML, which is why this half is server-only.
 */
import type { AvalancheProblemLocation } from '@/services/nac/model/forecast'
import type { ElevationBandNames } from '@/services/nac/types/schemas'
import { cn } from '@/utilities/ui'

import { LocatorRoseGraphic } from './LocatorRoseGraphic'
import { sanitizeHtml } from './sanitizeHtml'

interface LocatorRoseProps {
  locations: AvalancheProblemLocation[]
  /** The zone's band names, for the leader-line labels. Omitted, the rose draws without them. */
  elevationBandNames?: ElevationBandNames
}

/**
 * Where each band's leader line drops from (its ring, on the south-west side) and where its name
 * sits, at the widget's fractions of the 150px rose. Hidden on phones, as in the widget.
 */
const elevationLeaders = [
  { band: 'upper', line: 'left-[63px] top-[87px]', label: 'left-[63px] top-[177px]' },
  { band: 'middle', line: 'left-[49.5px] top-[100.5px]', label: 'left-[49.5px] top-[191px]' },
  { band: 'lower', line: 'left-[34.5px] top-[115.5px]', label: 'left-[34.5px] top-[205.5px]' },
] as const

export function LocatorRose({ locations, elevationBandNames }: LocatorRoseProps) {
  return (
    <LocatorRoseGraphic locations={locations} withLeaders={Boolean(elevationBandNames)}>
      {elevationBandNames &&
        elevationLeaders.map(({ band, line, label }) => (
          <div key={band} className="hidden sm:block">
            {/* The line with a dot where it leaves the ring. */}
            <div
              className={cn(
                'absolute h-[90px] w-px bg-[#515558] before:absolute before:-left-1 before:h-[9px] before:w-[9px] before:rounded-full before:bg-[#515558]',
                line,
              )}
            />
            {/* Band names may carry a <br>; on one line here, so it becomes a space. */}
            <div
              className={cn(
                'absolute w-[180px] -translate-y-[30%] overflow-hidden whitespace-nowrap pl-[0.3rem] text-left text-[0.7rem]',
                label,
              )}
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(elevationBandNames[band].replace(/<br\s*\/?>/gi, ' ')),
              }}
            />
          </div>
        ))}
    </LocatorRoseGraphic>
  )
}
