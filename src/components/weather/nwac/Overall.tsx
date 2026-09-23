/**
 * The region-wide view: the synopsis beside links to each zone's own weather, then one table per
 * variable — zones or stations down the rows, dated periods or blocks across — and the extended
 * outlook last. Sensible weather leads the tables because it is what most readers come for.
 */
import Link from 'next/link'
import { Fragment, type ReactNode } from 'react'

import type {
  NwacWeatherBlock,
  NwacWeatherIssuance,
  NwacWeatherPeriod,
} from '@/services/nac/model/nwacWeather'
import {
  DASH,
  SENSIBLE_SLOTS,
  blockDate,
  deriveSnow,
  deriveSnowLevel,
  fmtCalendarDate,
  fmtSnowAmount,
  periodDateGroups,
  precipPeriods,
  snowLevelBlocks,
  snowLevelTones,
  tempPeriods,
  windBlocks,
} from '@/services/nac/nwacWeatherFormat'
import { cn } from '@/utilities/ui'

import { RichText, textOrNull } from './RichText'
import { LevelValue, SnowValue, TempValue, WindValue } from './Values'

interface Column {
  key: string
  date: string | null
  sub: string | null
}
interface Row {
  key: string
  label: string
  cells: ReactNode[]
}
interface Group {
  key: string
  /** A zone heading over its stations; null for a flat table. */
  label: string | null
  rows: Row[]
}
interface Table {
  id: string
  /** The section link's text. */
  nav: string
  title: string
  note?: string
  rowLabel: string
  columns: Column[]
  groups: Group[]
  /** Free text: left-aligned, wrapping, equal columns. */
  prose?: boolean
  /** Cells whose content fills them (shaded snow levels) take less padding. */
  filled?: boolean
}

/** Avalanche zone id → the path of that zone's forecast page. */
export type ZonePaths = Record<number, string>

const STICKY = 'sticky left-0 z-10'

const periodColumn = (p: NwacWeatherPeriod): Column => ({
  key: p.key,
  date: fmtCalendarDate(p.date),
  sub: p.kind === 'night' ? 'Night' : 'Day',
})

function blockColumn(issuance: NwacWeatherIssuance, b: NwacWeatherBlock): Column {
  const date = blockDate(issuance, b)
  return { key: b.key, date: date ? fmtCalendarDate(date) : null, sub: b.part }
}

/** Shades every level in a zones × columns grid against the whole table, so zones compare. */
function shadedLevels(levels: (number | null)[][]): ReactNode[][] {
  const width = levels[0]?.length ?? 0
  const tones = snowLevelTones(levels.flat())
  return levels.map((row, r) =>
    row.map((level, c) => <LevelValue key={c} level={level} tone={tones[r * width + c]} />),
  )
}

function zoneTables(issuance: NwacWeatherIssuance): Table[] {
  const flat = (rows: Row[]): Group[] => [{ key: 'all', label: null, rows }]
  const zoneRows = (cells: (zoneId: string) => ReactNode[]): Row[] =>
    issuance.zones.map((z) => ({ key: z.id, label: z.name, cells: cells(z.id) }))

  const dates = periodDateGroups(issuance.periods)
  const sensibleColumns = SENSIBLE_SLOTS.map((s, i) => ({
    key: s.key,
    date: s.label,
    sub: dates[i] ? fmtCalendarDate(dates[i].date) : null,
  }))

  const levelBlocks = snowLevelBlocks(issuance)
  const levels = shadedLevels(
    issuance.zones.map((z) =>
      levelBlocks.map((b) => {
        const cell = issuance.snowLevel[z.id]?.[b.key]
        return deriveSnowLevel(cell?.freezing, cell?.drop)
      }),
    ),
  )
  const levelsByZone = new Map(issuance.zones.map((z, i) => [z.id, levels[i]]))

  const temps = tempPeriods(issuance)
  const winds = windBlocks(issuance)

  return [
    {
      id: 'sensible',
      nav: 'Sensible weather',
      title: 'Sensible Weather',
      rowLabel: 'Zone',
      columns: sensibleColumns,
      groups: flat(
        zoneRows((id) =>
          sensibleColumns.map((c) => issuance.sensible[id]?.[c.key]?.trim() || DASH),
        ),
      ),
      prose: true,
    },
    {
      id: 'snow-level',
      nav: 'Snow level',
      title: 'Snow Level (ft)',
      note: 'Where rain turns to snow. Darker is higher.',
      rowLabel: 'Zone',
      columns: levelBlocks.map((b) => blockColumn(issuance, b)),
      groups: flat(zoneRows((id) => levelsByZone.get(id) ?? [])),
      filled: true,
    },
    {
      id: 'temps',
      nav: "5000' temps",
      title: "5000' Temperatures (°F)",
      note: 'High / low.',
      rowLabel: 'Zone',
      columns: temps.map(periodColumn),
      groups: flat(
        zoneRows((id) =>
          temps.map((p) => <TempValue key={p.key} cell={issuance.temp[id]?.[p.key]} />),
        ),
      ),
    },
    {
      id: 'wind',
      nav: 'Ridgeline winds',
      title: 'Ridgeline Winds (mph)',
      note: 'Arrows point the way the wind blows.',
      rowLabel: 'Zone',
      columns: winds.map((b) => blockColumn(issuance, b)),
      groups: flat(
        zoneRows((id) =>
          winds.map((b) => <WindValue key={b.key} cell={issuance.wind[id]?.[b.key]} />),
        ),
      ),
    },
  ]
}

/** New snow by station, the stations grouped under their zones in zone order. */
function snowTable(issuance: NwacWeatherIssuance): Table {
  const periods = precipPeriods(issuance)
  const row = (p: NwacWeatherIssuance['points'][number]): Row => ({
    key: p.code,
    label: p.name,
    cells: periods.map((period) => {
      const cell = issuance.precip[p.code]?.[period.key]
      const snow = deriveSnow(cell?.qpf, cell?.density)
      return (
        <SnowValue key={period.key} text={fmtSnowAmount(snow)} some={snow != null && snow >= 0.5} />
      )
    }),
  })
  const zoneIds = new Set(issuance.zones.map((z) => z.id))
  const groups: Group[] = issuance.zones.map((z) => ({
    key: z.id,
    label: z.name,
    rows: issuance.points.filter((p) => p.zoneId === z.id).map(row),
  }))
  // Points whose zone the issuance doesn't list still show, under the name the wire gave them.
  for (const p of issuance.points) {
    if (p.zoneId && zoneIds.has(p.zoneId)) continue
    const key = `other-${p.zoneName}`
    const group = groups.find((g) => g.key === key)
    if (group) group.rows.push(row(p))
    else groups.push({ key, label: p.zoneName || null, rows: [row(p)] })
  }
  return {
    id: 'snow',
    nav: 'Snow',
    title: 'Snow (in)',
    note: 'New snow by station.',
    rowLabel: 'Station',
    columns: periods.map(periodColumn),
    groups: groups.filter((g) => g.rows.length > 0),
  }
}

function extendedTable(issuance: NwacWeatherIssuance): Table {
  const zones = issuance.zones.filter((z) => issuance.extendedSnowLevel[z.id])
  const blocks = issuance.extendedBlocks
  const levels = shadedLevels(
    zones.map((z) =>
      blocks.map((b) => {
        const cell = issuance.extendedSnowLevel[z.id]?.[b.key]
        return deriveSnowLevel(cell?.freezing, cell?.drop)
      }),
    ),
  )
  return {
    id: 'extended-snow-level',
    nav: 'Extended',
    title: 'Extended Snow Level (ft)',
    rowLabel: 'Zone',
    columns: blocks.map((b) => ({ key: b.key, date: fmtCalendarDate(b.date), sub: b.part })),
    groups: [
      {
        key: 'all',
        label: null,
        rows: zones.map((z, i) => ({ key: z.id, label: z.name, cells: levels[i] })),
      },
    ],
    filled: true,
  }
}

const hasContent = (t: Table) => t.columns.length > 0 && t.groups.some((g) => g.rows.length > 0)

function TableHead({ table: t }: { table: Table }) {
  return (
    <thead>
      <tr className="bg-muted">
        <th
          scope="col"
          className={cn(STICKY, 'border-b bg-muted p-2 pl-3 text-left align-bottom font-semibold')}
        >
          {t.rowLabel}
        </th>
        {t.columns.map((c) => (
          <th
            key={c.key}
            scope="col"
            className={cn('border-b p-2 align-bottom', t.prose ? 'text-left' : 'text-center')}
          >
            <span className="whitespace-nowrap font-semibold">{c.date}</span>
            {c.sub && (
              <span className="block whitespace-nowrap text-xs font-normal text-muted-foreground">
                {c.sub}
              </span>
            )}
          </th>
        ))}
      </tr>
    </thead>
  )
}

function TableBody({ table: t }: { table: Table }) {
  const cellClass = t.prose
    ? 'whitespace-pre-line p-2 text-left align-top'
    : t.filled
      ? 'p-0.5 align-middle'
      : 'p-2 text-center align-middle'
  return (
    <tbody>
      {t.groups.map((g) => (
        <Fragment key={g.key}>
          {g.label && (
            <tr>
              <th
                scope="colgroup"
                colSpan={t.columns.length + 1}
                className="border-t px-3 pb-0.5 pt-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground"
              >
                {/* Stays in view while a wide table scrolls sideways. */}
                <span className="sticky left-3">{g.label}</span>
              </th>
            </tr>
          )}
          {g.rows.map((r) => (
            <tr key={r.key}>
              <th
                scope="row"
                className={cn(
                  STICKY,
                  'bg-card p-2 pl-3 text-left align-middle',
                  g.label ? 'font-normal' : 'border-t font-semibold',
                )}
              >
                {r.label}
              </th>
              {r.cells.map((cell, i) => (
                <td key={t.columns[i]?.key ?? i} className={cn(!g.label && 'border-t', cellClass)}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </Fragment>
      ))}
    </tbody>
  )
}

function TableTitle({
  table: t,
  headingId,
  Heading,
}: {
  table: Table
  headingId: string
  Heading: 'h3' | 'h4'
}) {
  return (
    <div>
      <Heading id={headingId} className="scroll-mt-24 text-lg font-semibold">
        {t.title}
      </Heading>
      {t.note && <p className="text-sm text-muted-foreground">{t.note}</p>}
    </div>
  )
}

/** Prose tables get a fixed label column and even value columns; numeric ones size to content. */
function ProseColumns({ table: t }: { table: Table }) {
  if (!t.prose) return null
  return (
    <colgroup>
      <col className="w-44" />
      {t.columns.map((c) => (
        <col key={c.key} />
      ))}
    </colgroup>
  )
}

function GridTable({
  table: t,
  issuanceId,
  headingLevel = 'h3',
}: {
  table: Table
  issuanceId: number
  headingLevel?: 'h3' | 'h4'
}) {
  const headingId = `nwac-weather-${issuanceId}-${t.id}`
  return (
    <section aria-labelledby={headingId} className="min-w-0 space-y-2">
      <TableTitle table={t} headingId={headingId} Heading={headingLevel} />
      <div className="overflow-x-auto rounded-md border">
        <table
          className={cn(
            'w-full border-collapse text-sm',
            t.prose ? 'min-w-[640px] table-fixed' : 'min-w-max',
          )}
        >
          <ProseColumns table={t} />
          <TableHead table={t} />
          <TableBody table={t} />
        </table>
      </div>
    </section>
  )
}

function SectionNav({
  issuanceId,
  links,
}: {
  issuanceId: number
  links: { id: string; label: string }[]
}) {
  return (
    <nav aria-label="Forecast sections" className="print:hidden">
      <ul className="flex flex-wrap gap-2 border-b pb-4">
        {links.map((l) => (
          <li key={l.id}>
            <a
              href={`#nwac-weather-${issuanceId}-${l.id}`}
              className="inline-flex h-8 items-center rounded-full bg-muted px-3 text-sm font-semibold text-foreground no-underline hover:bg-accent"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function ZoneLinks({
  issuance,
  zonePaths,
}: {
  issuance: NwacWeatherIssuance
  zonePaths: ZonePaths
}) {
  const links = issuance.zones.flatMap((z) => {
    const href = z.avalancheZoneId != null ? zonePaths[z.avalancheZoneId] : undefined
    return href ? [{ id: z.id, name: z.name, href }] : []
  })
  if (links.length === 0) return null
  return (
    <aside
      aria-label="Weather for one zone"
      className="space-y-3 rounded-lg bg-muted p-4 print:hidden"
    >
      <div>
        <h3 className="text-sm font-semibold">Weather for one zone</h3>
        <p className="text-xs text-muted-foreground">
          Opens the zone&apos;s avalanche forecast at its Mountain Weather.
        </p>
      </div>
      <ul className="flex flex-wrap gap-2">
        {links.map((l) => (
          <li key={l.id}>
            <Link
              href={l.href}
              className="inline-flex h-9 items-center rounded-md border bg-background px-3 text-sm font-semibold no-underline hover:bg-accent"
            >
              {l.name}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}

/** A table, or nothing when it has no rows worth showing. */
function MaybeTable({ table, issuanceId }: { table: Table; issuanceId: number }) {
  return hasContent(table) ? <GridTable table={table} issuanceId={issuanceId} /> : null
}

function SynopsisRow({
  issuance,
  synopsis,
  zonePaths,
}: {
  issuance: NwacWeatherIssuance
  synopsis: string | null
  zonePaths: ZonePaths
}) {
  const headingId = `nwac-weather-${issuance.id}-synopsis`
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      {synopsis ? (
        <section aria-labelledby={headingId} className="space-y-1">
          <h3 id={headingId} className="scroll-mt-24 text-lg font-semibold">
            Weather Synopsis
          </h3>
          <RichText html={synopsis} />
        </section>
      ) : (
        <div />
      )}
      <ZoneLinks issuance={issuance} zonePaths={zonePaths} />
    </div>
  )
}

function ExtendedSection({
  issuanceId,
  extended,
  table,
}: {
  issuanceId: number
  extended: string | null
  table: Table
}) {
  const showTable = hasContent(table)
  if (!extended && !showTable) return null
  const headingId = `nwac-weather-${issuanceId}-extended`
  return (
    <section aria-labelledby={headingId} className="space-y-4 border-t pt-6">
      <h3 id={headingId} className="scroll-mt-24 text-lg font-semibold">
        Extended Outlook
      </h3>
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {extended ? <RichText html={extended} /> : <div />}
        {showTable && <GridTable table={table} issuanceId={issuanceId} headingLevel="h4" />}
      </div>
    </section>
  )
}

function sectionLinks(synopsis: string | null, tables: Table[], hasExtended: boolean) {
  return [
    ...(synopsis ? [{ id: 'synopsis', label: 'Synopsis' }] : []),
    ...tables.filter(hasContent).map((t) => ({ id: t.id, label: t.nav })),
    ...(hasExtended ? [{ id: 'extended', label: 'Extended' }] : []),
  ]
}

export function Overall({
  issuance,
  zonePaths = {},
}: {
  issuance: NwacWeatherIssuance
  zonePaths?: ZonePaths
}) {
  const synopsis = textOrNull(issuance.synopsis)
  const extended = textOrNull(issuance.extendedOutlook)
  const [sensible, snowLevel, temps, wind] = zoneTables(issuance)
  const snow = snowTable(issuance)
  const ext = extendedTable(issuance)
  const id = issuance.id
  const links = sectionLinks(
    synopsis,
    [sensible, snowLevel, temps, wind, snow],
    !!extended || hasContent(ext),
  )
  const tempsOrWind = hasContent(temps) || hasContent(wind)

  return (
    <div className="space-y-8">
      <SectionNav issuanceId={id} links={links} />
      <SynopsisRow issuance={issuance} synopsis={synopsis} zonePaths={zonePaths} />
      <MaybeTable table={sensible} issuanceId={id} />
      <MaybeTable table={snowLevel} issuanceId={id} />
      {tempsOrWind && (
        <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <MaybeTable table={temps} issuanceId={id} />
          <MaybeTable table={wind} issuanceId={id} />
        </div>
      )}
      <MaybeTable table={snow} issuanceId={id} />
      <ExtendedSection issuanceId={id} extended={extended} table={ext} />
    </div>
  )
}
