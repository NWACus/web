/**
 * Locator rose — 24-sector rose (8 aspects × 3 elevations) showing which aspects and elevations an
 * avalanche problem affects. A port of the legacy afp widget's LocatorRose.vue at its sizes: a
 * 150px rose (120px on phones) with HTML aspect labels around it and, given the zone's elevation
 * band names, leader lines from the upper/middle/lower rings down to those names.
 * SVG path data copied verbatim from the widget (identical to avy/components/DangerRose.tsx).
 */
import { AvalancheProblemLocation } from '@/services/nac/model/forecast'
import type { ElevationBandNames } from '@/services/nac/types/schemas'
import { cn } from '@/utilities/ui'

import { sanitizeHtml } from './sanitizeHtml'

interface LocatorRoseProps {
  locations: AvalancheProblemLocation[]
  /** The zone's band names, for the leader-line labels. Omitted, the rose draws without them. */
  elevationBandNames?: ElevationBandNames
}

/**
 * SVG path data for each of the 24 sectors. Keys match AvalancheProblemLocation enum values.
 * Paths copied verbatim from avy/components/DangerRose.tsx.
 */
const sectorPaths: Record<AvalancheProblemLocation, string> = {
  [AvalancheProblemLocation.NorthUpper]: 'M529.716,527l68.371,-166.7l-138.1,0l69.729,166.7Z',
  [AvalancheProblemLocation.NorthMiddle]:
    'M666.581,193.63l-277.081,0l69.27,166.67l138.541,0l69.27,-166.67Z',
  [AvalancheProblemLocation.NorthLower]:
    'M734.1,26.997l-414.2,0l69.943,166.67l275.865,0l68.392,-166.67Z',
  [AvalancheProblemLocation.NortheastUpper]:
    'M529.716,527l166.22,-69.529l-97.651,-97.652l-68.569,167.181Z',
  [AvalancheProblemLocation.NortheastMiddle]:
    'M862.222,388.05l-195.925,-195.926l-68.873,166.835l97.963,97.963l166.835,-68.872Z',
  [AvalancheProblemLocation.NortheastLower]:
    'M1027.79,317.966l-292.884,-292.884l-68.396,167.311l195.066,195.066l166.214,-69.493Z',
  [AvalancheProblemLocation.EastUpper]: 'M527.716,528.339l166.7,68.371l0,-138.1l-166.7,69.729Z',
  [AvalancheProblemLocation.EastMiddle]:
    'M861.086,665.204l0,-277.081l-166.67,69.27l0,138.541l166.67,69.27Z',
  [AvalancheProblemLocation.EastLower]:
    'M1027.72,732.723l0,-414.2l-166.67,69.943l0,275.865l166.67,68.392Z',
  [AvalancheProblemLocation.SoutheastUpper]:
    'M527.716,528.339l69.529,166.22l97.652,-97.651l-167.181,-68.569Z',
  [AvalancheProblemLocation.SoutheastMiddle]:
    'M666.666,860.845l195.926,-195.925l-166.835,-68.872l-97.963,97.962l68.872,166.835Z',
  [AvalancheProblemLocation.SoutheastLower]:
    'M736.75,1026.42l292.884,-292.884l-167.311,-68.396l-195.066,195.066l69.493,166.214Z',
  [AvalancheProblemLocation.SouthUpper]: 'M527.918,528.416l-68.371,166.7l138.1,0l-69.729,-166.7Z',
  [AvalancheProblemLocation.SouthMiddle]:
    'M391.053,861.786l277.081,0l-69.27,-166.67l-138.541,0l-69.27,166.67Z',
  [AvalancheProblemLocation.SouthLower]:
    'M323.534,1028.42l414.2,0l-69.943,-166.67l-275.865,0l-68.392,166.67Z',
  [AvalancheProblemLocation.SouthwestUpper]:
    'M527.918,528.416l-166.22,69.529l97.651,97.652l68.569,-167.181Z',
  [AvalancheProblemLocation.SouthwestMiddle]:
    'M195.412,667.366l195.926,195.926l68.872,-166.835l-97.963,-97.963l-166.835,68.872Z',
  [AvalancheProblemLocation.SouthwestLower]:
    'M29.841,737.451l292.884,292.883l68.396,-167.31l-195.066,-195.067l-166.214,69.494Z',
  [AvalancheProblemLocation.WestUpper]: 'M528.918,527.077l-166.7,-68.371l0,138.1l166.7,-69.729Z',
  [AvalancheProblemLocation.WestMiddle]:
    'M195.548,390.212l0,277.081l166.67,-69.27l0,-138.541l-166.67,-69.27Z',
  [AvalancheProblemLocation.WestLower]:
    'M28.915,322.693l0,414.2l166.67,-69.943l0,-275.865l-166.67,-68.392Z',
  [AvalancheProblemLocation.NorthwestUpper]:
    'M529.918,527.077l-69.529,-166.22l-97.652,97.651l167.181,68.569Z',
  [AvalancheProblemLocation.NorthwestMiddle]:
    'M390.968,194.571l-195.926,195.926l166.835,68.872l97.963,-97.963l-68.872,-166.835Z',
  [AvalancheProblemLocation.NorthwestLower]:
    'M318.884,27l-292.884,292.884l167.311,68.396l195.066,-195.066l-69.493,-166.214Z',
}

const ACTIVE_FILL = '#c8cace'
const STROKE_COLOR = '#515558'

/** Aspect labels, centered on these points of the 150px rose (120px on phones). */
const aspectLabels = [
  { label: 'N', className: 'left-1/2 -top-2 sm:-top-2.5' },
  { label: 'E', className: 'top-1/2 left-[128px] sm:left-[160px]' },
  { label: 'S', className: 'left-1/2 top-[128px] sm:top-[160px]' },
  { label: 'W', className: 'top-1/2 -left-2 sm:-left-2.5' },
  { label: 'NW', className: 'left-2.5 top-2.5 sm:left-[13px] sm:top-[13px]' },
  { label: 'NE', className: 'left-[110px] top-2.5 sm:left-[137px] sm:top-[13px]' },
  { label: 'SE', className: 'left-[110px] top-[110px] sm:left-[137px] sm:top-[137px]' },
  { label: 'SW', className: 'left-2.5 top-[110px] sm:left-[13px] sm:top-[137px]' },
] as const

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
  const locationSet = new Set<AvalancheProblemLocation>(locations)

  return (
    <div className="mx-auto w-[160px] sm:w-[190px]">
      <div
        className={cn(
          'relative m-5 h-[120px] w-[120px] sm:h-[150px] sm:w-[150px]',
          elevationBandNames ? 'mb-[55px] sm:mb-20' : 'mb-[55px] sm:mb-10',
        )}
      >
        {aspectLabels.map(({ label, className }) => (
          <span
            key={label}
            className={cn(
              'absolute -translate-x-1/2 -translate-y-1/2 text-[0.7rem] font-semibold',
              className,
            )}
          >
            {label}
          </span>
        ))}
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
        <svg
          className="h-[120px] w-[120px] sm:h-[150px] sm:w-[150px]"
          viewBox="0 0 1050 1050"
          fillRule="evenodd"
          clipRule="evenodd"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeMiterlimit={1.5}
        >
          {Object.values(AvalancheProblemLocation).map((location) => (
            <path
              key={location}
              d={sectorPaths[location]}
              stroke={STROKE_COLOR}
              strokeWidth={10}
              fill={locationSet.has(location) ? ACTIVE_FILL : 'transparent'}
            />
          ))}
        </svg>
      </div>
    </div>
  )
}
