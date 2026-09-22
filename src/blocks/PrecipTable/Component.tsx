import { toStationRefs } from '@/fields/stations'
import type { PrecipTableBlock as PrecipTableBlockProps } from '@/payload-types'
import { toPrecipColumns } from '@/services/stations/precipColumns'
import { PrecipTableClient } from './PrecipTable.client'

export function PrecipTableBlockComponent({ stations, columns }: PrecipTableBlockProps) {
  const refs = toStationRefs(stations)
  if (refs.length === 0) return null

  return (
    <div className="container mb-10 flex flex-col gap-3">
      <PrecipTableClient stations={refs} columns={toPrecipColumns(columns)} />
    </div>
  )
}
