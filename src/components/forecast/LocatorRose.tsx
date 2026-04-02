/**
 * Locator rose SVG — 24-sector rose (8 aspects × 3 elevations) showing which
 * aspects and elevations an avalanche problem affects.
 * Pixel-perfect port from avy/components/DangerRose.tsx.
 * SVG path data copied verbatim from the AvyApp source.
 */
'use client'

import { AvalancheProblemLocation } from '@/services/nac/types/forecastSchemas'

interface LocatorRoseProps {
  locations: AvalancheProblemLocation[]
  className?: string
}

/**
 * SVG path data for each of the 24 sectors. Keys match AvalancheProblemLocation enum values.
 * Paths copied verbatim from avy/components/DangerRose.tsx.
 */
const sectorPaths: Record<AvalancheProblemLocation, string> = {
  [AvalancheProblemLocation.NorthUpper]: 'M529.716,527l68.371,-166.7l-138.1,0l69.729,166.7Z',
  [AvalancheProblemLocation.NorthMiddle]: 'M666.581,193.63l-277.081,0l69.27,166.67l138.541,0l69.27,-166.67Z',
  [AvalancheProblemLocation.NorthLower]: 'M734.1,26.997l-414.2,0l69.943,166.67l275.865,0l68.392,-166.67Z',
  [AvalancheProblemLocation.NortheastUpper]: 'M529.716,527l166.22,-69.529l-97.651,-97.652l-68.569,167.181Z',
  [AvalancheProblemLocation.NortheastMiddle]:
    'M862.222,388.05l-195.925,-195.926l-68.873,166.835l97.963,97.963l166.835,-68.872Z',
  [AvalancheProblemLocation.NortheastLower]:
    'M1027.79,317.966l-292.884,-292.884l-68.396,167.311l195.066,195.066l166.214,-69.493Z',
  [AvalancheProblemLocation.EastUpper]: 'M527.716,528.339l166.7,68.371l0,-138.1l-166.7,69.729Z',
  [AvalancheProblemLocation.EastMiddle]: 'M861.086,665.204l0,-277.081l-166.67,69.27l0,138.541l166.67,69.27Z',
  [AvalancheProblemLocation.EastLower]: 'M1027.72,732.723l0,-414.2l-166.67,69.943l0,275.865l166.67,68.392Z',
  [AvalancheProblemLocation.SoutheastUpper]: 'M527.716,528.339l69.529,166.22l97.652,-97.651l-167.181,-68.569Z',
  [AvalancheProblemLocation.SoutheastMiddle]:
    'M666.666,860.845l195.926,-195.925l-166.835,-68.872l-97.963,97.962l68.872,166.835Z',
  [AvalancheProblemLocation.SoutheastLower]:
    'M736.75,1026.42l292.884,-292.884l-167.311,-68.396l-195.066,195.066l69.493,166.214Z',
  [AvalancheProblemLocation.SouthUpper]: 'M527.918,528.416l-68.371,166.7l138.1,0l-69.729,-166.7Z',
  [AvalancheProblemLocation.SouthMiddle]:
    'M391.053,861.786l277.081,0l-69.27,-166.67l-138.541,0l-69.27,166.67Z',
  [AvalancheProblemLocation.SouthLower]:
    'M323.534,1028.42l414.2,0l-69.943,-166.67l-275.865,0l-68.392,166.67Z',
  [AvalancheProblemLocation.SouthwestUpper]: 'M527.918,528.416l-166.22,69.529l97.651,97.652l68.569,-167.181Z',
  [AvalancheProblemLocation.SouthwestMiddle]:
    'M195.412,667.366l195.926,195.926l68.872,-166.835l-97.963,-97.963l-166.835,68.872Z',
  [AvalancheProblemLocation.SouthwestLower]:
    'M29.841,737.451l292.884,292.883l68.396,-167.31l-195.066,-195.067l-166.214,69.494Z',
  [AvalancheProblemLocation.WestUpper]: 'M528.918,527.077l-166.7,-68.371l0,138.1l166.7,-69.729Z',
  [AvalancheProblemLocation.WestMiddle]: 'M195.548,390.212l0,277.081l166.67,-69.27l0,-138.541l-166.67,-69.27Z',
  [AvalancheProblemLocation.WestLower]: 'M28.915,322.693l0,414.2l166.67,-69.943l0,-275.865l-166.67,-68.392Z',
  [AvalancheProblemLocation.NorthwestUpper]: 'M529.918,527.077l-69.529,-166.22l-97.652,97.651l167.181,68.569Z',
  [AvalancheProblemLocation.NorthwestMiddle]:
    'M390.968,194.571l-195.926,195.926l166.835,68.872l97.963,-97.963l-68.872,-166.835Z',
  [AvalancheProblemLocation.NorthwestLower]:
    'M318.884,27l-292.884,292.884l167.311,68.396l195.066,-195.066l-69.493,-166.214Z',
}

const ACTIVE_FILL = 'rgb(200, 202, 206)'
const INACTIVE_FILL = 'transparent'
const STROKE_COLOR = 'rgb(81, 85, 88)'

/** Cardinal/intercardinal labels positioned around the rose */
const directionLabels = [
  { label: 'N', x: 528, y: -30 },
  { label: 'NE', x: 1070, y: 280 },
  { label: 'E', x: 1070, y: 540 },
  { label: 'SE', x: 1070, y: 800 },
  { label: 'S', x: 528, y: 1090 },
  { label: 'SW', x: -20, y: 800 },
  { label: 'W', x: -20, y: 540 },
  { label: 'NW', x: -20, y: 280 },
] as const

export function LocatorRose({ locations, className }: LocatorRoseProps) {
  const locationSet = new Set<AvalancheProblemLocation>(locations)

  return (
    <svg
      className={className}
      viewBox="-80 -80 1210 1210"
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
          fill={locationSet.has(location) ? ACTIVE_FILL : INACTIVE_FILL}
        />
      ))}
      {directionLabels.map(({ label, x, y }) => (
        <text
          key={label}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-foreground text-[64px] font-semibold"
        >
          {label}
        </text>
      ))}
    </svg>
  )
}
