import { StationLatestObservation } from '@/components/WeatherStations/StationLatestObservation'
import { StationNowTable } from '@/components/WeatherStations/StationNowTable'
import { StationPicker } from '@/components/WeatherStations/StationPicker'
import type { StationRange } from '@/components/WeatherStations/StationRangeTabs'
import { StationRangeTabs } from '@/components/WeatherStations/StationRangeTabs'
import type { WeatherStationGroup } from '@/constants/weatherStations'
import type { StationTable } from '@/services/snowobs/transform'

type StationPageViewProps = {
  group: WeatherStationGroup
  table: StationTable
  activeRange: StationRange
}

export function StationPageView({ group, table, activeRange }: StationPageViewProps) {
  return (
    <div className="mb-10 flex flex-col gap-4">
      <div className="container flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-sm text-muted-foreground">{group.region}</p>
          <div className="prose dark:prose-invert max-w-none">
            <h1 className="font-bold">{group.displayName}</h1>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StationLatestObservation table={table} />
          <StationPicker current={group.slug} />
        </div>
      </div>

      <div className="container flex flex-col gap-3">
        <StationRangeTabs activeKey={activeRange.key} />
        <StationNowTable table={table} />
      </div>
    </div>
  )
}
