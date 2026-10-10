import { StationNotes } from '@/components/WeatherStations/StationNotes'
import { StationPicker } from '@/components/WeatherStations/StationPicker'
import type { StationNote, StationSummary } from '@/services/snowobs/tableHelpers'
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
  notes: StationNote[]
  /** The page's stations, listed under the title; omitted where `details` already says it. */
  stations?: StationSummary[]
  /** When an archived page's stations last reported; null if unknown. */
  lastReported?: Date | null
  timeZone: string
  /** A line under the title, such as a single station's source and elevation. */
  details?: ReactNode
  tabContent?: ReactNode
}

function StationHeader({
  page,
  pages,
  details,
}: {
  page: StationPageHeading
  pages: StationPageSummary[]
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
      {pages.length > 0 && <StationPicker pages={pages} current={page.slug ?? undefined} />}
    </div>
  )
}

function StationList({ stations }: { stations: StationSummary[] }) {
  return (
    <ul className="container flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      {stations.map((station, index) => (
        <li key={station.key} className="inline-flex items-center gap-2">
          {index > 0 && (
            <span aria-hidden="true" className="text-muted-foreground">
              ·
            </span>
          )}
          <span className="font-medium text-foreground">{station.name}</span>
          {station.elevation !== null && (
            <span className="text-muted-foreground">
              {Math.round(station.elevation).toLocaleString()}&apos;
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}

function RetiredNotice({
  lastReported,
  timeZone,
}: {
  lastReported: Date | null
  timeZone: string
}) {
  return (
    <aside className="container">
      <div className="rounded-md border-l-4 border-warning bg-warning/30 px-3 py-2 text-sm">
        <p className="flex items-center gap-2 font-semibold">
          <TriangleAlert className="h-4 w-4" aria-hidden />
          This station has been retired
        </p>
        <p>
          {lastReported &&
            `Last reported ${new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone }).format(lastReported)}. `}
          Its historical data is still available to download.
        </p>
      </div>
    </aside>
  )
}

// The tab bar lives inside `tabContent` so it can pin with that view's filters.
export function StationPageView({
  page,
  pages,
  notes,
  stations,
  lastReported = null,
  timeZone,
  details,
  tabContent,
}: StationPageViewProps) {
  return (
    <div className="mb-10 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <StationHeader page={page} pages={pages} details={details} />
        {stations && <StationList stations={stations} />}
      </div>
      {page.archived && <RetiredNotice lastReported={lastReported} timeZone={timeZone} />}
      {notes.length > 0 && (
        <div className="container">
          <StationNotes notes={notes} timeZone={timeZone} />
        </div>
      )}
      <div className="container flex flex-col gap-3">{tabContent}</div>
    </div>
  )
}
