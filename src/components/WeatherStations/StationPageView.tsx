import { StationLatestObservation } from '@/components/WeatherStations/StationLatestObservation'
import { StationNotes } from '@/components/WeatherStations/StationNotes'
import { StationPicker } from '@/components/WeatherStations/StationPicker'
import type { WeatherStationGroup } from '@/constants/weatherStations'
import type { StationNote } from '@/services/snowobs/stationNotes'
import type { StationTable } from '@/services/snowobs/tableHelpers'
import { TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

type StationPageViewProps = {
  group: WeatherStationGroup
  table: StationTable | null
  notes: StationNote[]
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

function ArchivedNotice() {
  return (
    <aside className="container">
      <div className="rounded-md border-l-4 border-warning bg-warning/30 px-3 py-2 text-sm">
        <p className="flex items-center gap-2 font-semibold">
          <TriangleAlert className="h-4 w-4" aria-hidden />
          This station has been retired
        </p>
        <p>
          It no longer reports observations, so the table and graphs are empty. Its historical data
          is still available to download.
        </p>
      </div>
    </aside>
  )
}

// The tab bar lives inside `tabContent` so it can pin with that view's filters.
export function StationPageView({ group, table, notes, tabContent }: StationPageViewProps) {
  return (
    <div className="mb-10 flex flex-col gap-4">
      <StationHeader group={group} table={table} />
      {group.archived && <ArchivedNotice />}
      {notes.length > 0 && (
        <div className="container">
          <StationNotes notes={notes} />
        </div>
      )}
      <div className="container flex flex-col gap-3">{tabContent}</div>
    </div>
  )
}
