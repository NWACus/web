/**
 * One archived product in the list: date, danger, zone and author, the whole row a link to the
 * dated forecast view, with a left rule in the danger color — the legacy widget's `ArchiveCard`.
 *
 * The columns follow the widget: on a phone the danger sits beside the date and the zone drops to
 * its own line; from `md` up it reads date · zone · danger in fixed columns, so rows line up
 * whatever the zone name's length, with the author joining on wide screens only.
 */
import { MapPin, User } from 'lucide-react'
import Link from 'next/link'

import {
  dangerColor,
  dangerIconSize,
  dangerIconUrl,
  dangerLevelFromRating,
  dangerName,
} from '@/services/nac/dangerScale'
import { archiveRowHref, formatArchiveDate, type ArchiveRow } from '@/services/nac/forecastArchive'
import type { DangerLevel } from '@/services/nac/model/forecast'

interface ArchiveProductRowProps {
  row: ArchiveRow
}

export function ArchiveProductRow({ row }: ArchiveProductRowProps) {
  const level = dangerLevelFromRating(row.dangerLevel)

  return (
    <li>
      <Link
        href={archiveRowHref(row)}
        prefetch={false}
        className="block rounded-lg border bg-card p-3 transition-colors hover:border-primary focus-visible:border-primary focus-visible:outline-none"
        style={{ borderLeft: `4px solid ${dangerColor(level)}` }}
      >
        <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-x-4 gap-y-1 md:grid-cols-[7rem_minmax(0,1fr)_11rem] lg:grid-cols-[7rem_minmax(0,1fr)_11rem_14rem]">
          <span className="order-1 font-semibold">{formatArchiveDate(row.date)}</span>
          <DangerCell level={level} />
          <ZoneCell name={row.zoneName} />
          <AuthorCell author={row.author} />
        </div>
      </Link>
    </li>
  )
}

/** The danger icon and name, with the level in brackets when there is one — as the widget shows it. */
function DangerCell({ level }: { level: DangerLevel }) {
  const iconSize = dangerIconSize(level)

  return (
    <span className="order-2 flex items-center gap-2 md:order-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dangerIconUrl(level)}
        alt=""
        width={iconSize.width}
        height={iconSize.height}
        className="h-[30px] w-auto"
        aria-hidden="true"
      />
      <span>
        {dangerName(level)}
        {level > 0 && ` (${level})`}
      </span>
    </span>
  )
}

function ZoneCell({ name }: { name: string }) {
  return (
    <span className="order-3 col-span-2 flex min-w-0 items-center gap-1 md:order-2 md:col-span-1">
      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="min-w-0">{name}</span>
    </span>
  )
}

/** Wide screens only, as in the widget; absent on bulk-imported history. */
function AuthorCell({ author }: { author: string | null }) {
  if (!author) return null

  return (
    <span className="order-4 hidden min-w-0 items-center gap-1 text-muted-foreground lg:flex">
      <User className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 truncate">{author}</span>
    </span>
  )
}
