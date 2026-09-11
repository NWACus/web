/**
 * One archived product in the list: date, danger, zone and author, the whole row a link to the
 * dated forecast view, with a left rule in the danger color — the legacy widget's `ArchiveCard`.
 *
 * On a wide screen (`xl`, where the list column beside the filter sidebar has the room) it reads
 * date · zone · danger · author in fixed columns, so rows line up whatever the zone name's length.
 * Below that it is two lines — date and zone, then danger and author — which differs from the
 * widget (danger beside the date, zone below) by decision: neither the danger label nor the zone
 * name breaks mid-phrase this way, and the first line answers "which forecast" before the second
 * answers "how dangerous". Each line is its own flex row, so a wide danger label cannot squeeze the
 * zone above it; a zone name too long for the line beside the date drops under it whole.
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

/** One of the two lines; on wide screens its children become grid cells. */
const LINE = 'flex flex-wrap items-center gap-x-4 gap-y-1 xl:contents'

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
        <RowLines row={row} level={level} />
      </Link>
    </li>
  )
}

/** The two lines, which on wide screens flatten into the four grid columns. */
function RowLines({ row, level }: { row: ArchiveRow; level: DangerLevel }) {
  return (
    <div className="space-y-1 xl:grid xl:grid-cols-[7rem_minmax(0,1fr)_11rem_14rem] xl:items-center xl:gap-x-4 xl:space-y-0">
      <div className={LINE}>
        <span className="shrink-0 font-semibold">{formatArchiveDate(row.date)}</span>
        <ZoneCell name={row.zoneName} />
      </div>
      <div className={LINE}>
        <DangerCell level={level} />
        <AuthorCell author={row.author} />
      </div>
    </div>
  )
}

/** The danger icon and name, with the level in brackets when there is one — as the widget shows it. */
function DangerCell({ level }: { level: DangerLevel }) {
  const iconSize = dangerIconSize(level)

  return (
    <span className="flex items-center gap-2 whitespace-nowrap">
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
    <span className="flex items-center gap-1 whitespace-nowrap">
      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      {name}
    </span>
  )
}

/** Absent on bulk-imported history. */
function AuthorCell({ author }: { author: string | null }) {
  if (!author) return null

  return (
    <span className="flex min-w-0 items-center gap-1 text-muted-foreground">
      <User className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 truncate">{author}</span>
    </span>
  )
}
