/**
 * The map's content as text.
 *
 * A Mapbox map is a `<canvas>`: nothing on it is reachable by keyboard or exposed to a screen
 * reader. This renders the same stations as a visually hidden list — name, source, and every
 * current reading — so the information is available to everyone even though the picture isn't.
 * Becomes visible on focus, so a keyboard user can see where they are while tabbing through it.
 */
import {
  orderVariables,
  shortUnit,
  sourceLabel,
  windDirectionLabel,
} from '@/services/snowobs/stationMap/format'
import type { StationMapStation, StationMapVariable } from '@/services/snowobs/stationMap/model'
import { cn } from '@/utilities/ui'

interface StationListProps {
  stations: StationMapStation[]
  variables: StationMapVariable[]
  units: Record<string, string>
  /** Shown outright when the map itself can't be drawn. */
  visible?: boolean
}

function readingsSummary(
  station: StationMapStation,
  names: Map<string, string>,
  units: Record<string, string>,
): string {
  return orderVariables(Object.keys(station.data))
    .map((variable) => {
      const value = station.data[variable]
      const shown = variable === 'wind_direction' ? windDirectionLabel(value) : value
      return `${names.get(variable) ?? variable} ${shown ?? '—'} ${shortUnit(units[variable])}`.trim()
    })
    .join(', ')
}

export function StationList({ stations, variables, units, visible = false }: StationListProps) {
  if (stations.length === 0) return null
  const names = new Map(variables.map((v) => [v.variable, v.longName]))

  return (
    <div
      className={cn(
        'focus-within:not-sr-only focus-within:block focus-within:max-h-64 focus-within:overflow-y-auto focus-within:bg-background focus-within:p-2',
        visible
          ? 'absolute inset-x-0 bottom-0 z-40 max-h-64 overflow-y-auto bg-background p-2'
          : 'sr-only',
      )}
    >
      <h3>Weather stations</h3>
      <ul>
        {stations.map((station) => (
          <li key={station.stid}>
            {station.href ? <a href={station.href}>{station.name}</a> : station.name}
            {` (${sourceLabel(station.source)}): `}
            {readingsSummary(station, names, units)}
          </li>
        ))}
      </ul>
    </div>
  )
}
