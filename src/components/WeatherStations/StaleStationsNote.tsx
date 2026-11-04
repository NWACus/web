import type { StationNote } from '@/services/snowobs/tableHelpers'
import type { StaleStation } from '@/services/stations/staleStations'
import { StationNotes } from './StationNotes'

function staleNote({ key, name, lastReported }: StaleStation): StationNote {
  return {
    stid: key,
    stationName: name,
    note: `Last report from ${name}`,
    status: 'static',
    startDate: lastReported,
  }
}

export function StaleStationsNote({
  stale,
  timeZone,
}: {
  stale: StaleStation[]
  timeZone: string
}) {
  return <StationNotes notes={stale.map(staleNote)} timeZone={timeZone} />
}
