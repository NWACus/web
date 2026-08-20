import { StationLatestObservation } from '@/components/WeatherStations/StationLatestObservation'
import { StationPicker } from '@/components/WeatherStations/StationPicker'
import type { WeatherStationGroup } from '@/constants/weatherStations'
import type { StationTable } from '@/services/snowobs/tableHelpers'
import type { ReactNode } from 'react'

type StationPageViewProps = {
  group: WeatherStationGroup
  table: StationTable | null
  tabContent?: ReactNode
}

function StationHeader({
  group,
  table,
}: {
  group: WeatherStationGroup
  table: StationTable | null
}) {
  return (
    <div className="container flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="mb-1 text-sm text-muted-foreground">{group.region}</p>
        <div className="prose dark:prose-invert max-w-none">
          <h1 className="font-bold">{group.displayName}</h1>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        {table && <StationLatestObservation table={table} />}
        <StationPicker current={group.slug} />
      </div>
    </div>
  )
}

// The tab bar lives inside `tabContent` rather than here: it pins together with
// that view's own filter row as a single sticky block.
export function StationPageView({ group, table, tabContent }: StationPageViewProps) {
  return (
    <div className="mb-10 flex flex-col gap-4">
      <StationHeader group={group} table={table} />
      <div className="container flex flex-col gap-3">{tabContent}</div>
    </div>
  )
}
