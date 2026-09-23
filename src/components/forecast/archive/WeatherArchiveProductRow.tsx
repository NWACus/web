/**
 * One archived mountain-weather product in the list: the day it was issued, "All Zones" and the
 * author, the whole row a link to the archived product — the legacy widget's `ArchiveCard` in its
 * weather form. No danger cell and no danger-colored rule, since weather carries no rating.
 */
import Link from 'next/link'

import { formatArchiveDate } from '@/services/nac/forecastArchive'
import { weatherArchiveRowHref, type WeatherArchiveRow } from '@/services/nac/weatherArchive'

import { ARCHIVE_ROW_LINK_CLASS, AuthorCell, ZoneCell } from './ArchiveProductRow'

export function WeatherArchiveProductRow({ row }: { row: WeatherArchiveRow }) {
  return (
    <li>
      <Link href={weatherArchiveRowHref(row)} prefetch={false} className={ARCHIVE_ROW_LINK_CLASS}>
        {/* The date column is the forecast rows' width, so the two tabs' lists line up. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="w-28 shrink-0 font-semibold">{formatArchiveDate(row.date)}</span>
          <ZoneCell name="All Zones" />
          <AuthorCell author={row.author} />
        </div>
      </Link>
    </li>
  )
}
