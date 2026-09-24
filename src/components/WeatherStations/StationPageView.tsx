import { StationLatestObservation } from '@/components/WeatherStations/StationLatestObservation'
import { StationNotes } from '@/components/WeatherStations/StationNotes'
import { StationPicker } from '@/components/WeatherStations/StationPicker'
import type { StationNote, StationTable } from '@/services/snowobs/tableHelpers'
import type { StationPageSummary } from '@/services/stations/getStationPages'
import { TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

/** A station page, or a single tracked station shown on its own (`slug: null`). */
type StationPageHeading = Pick<StationPageSummary, 'displayName' | 'archived'> & {
  slug: string | null
}

type StationPageViewProps = {
  page: StationPageHeading
  pages: StationPageSummary[]
  table: StationTable | null
  notes: StationNote[]
  timeZone: string
  /** A line under the title, such as a single station's source and elevation. */
  details?: ReactNode
  tabContent?: ReactNode
}

function StationHeader({
  page,
  pages,
  table,
  details,
}: {
  page: StationPageHeading
  pages: StationPageSummary[]
  table: StationTable | null
  details?: ReactNode
}) {
  return (
    <div className="container flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="prose dark:prose-invert max-w-none">
          {/* Sized as the station map's title is. Station names run long — "Stevens Pass -
              WSDOT Schmidt Haus" takes three lines at full size on a phone, before any reading. */}
          <h1 className="text-3xl font-bold sm:text-4xl">{page.displayName}</h1>
        </div>
        {details}
      </div>
      <div className="flex flex-col items-end gap-1">
        {table && <StationLatestObservation table={table} />}
        {pages.length > 0 && <StationPicker pages={pages} current={page.slug ?? undefined} />}
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
export function StationPageView({
  page,
  pages,
  table,
  notes,
  timeZone,
  details,
  tabContent,
}: StationPageViewProps) {
  return (
    <div className="mb-10 flex flex-col gap-4">
      <StationHeader page={page} pages={pages} table={table} details={details} />
      {page.archived && <ArchivedNotice />}
      {notes.length > 0 && (
        <div className="container">
          <StationNotes notes={notes} timeZone={timeZone} />
        </div>
      )}
      <div className="container flex flex-col gap-3">{tabContent}</div>
    </div>
  )
}
