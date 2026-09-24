/**
 * The region-wide view: synopsis and zone links, one table per variable (zones or stations down,
 * periods or blocks across), then the extended outlook.
 */
import Link from 'next/link'
import { Fragment, type ReactNode } from 'react'

import type {
  NWACWeatherBlock,
  NWACWeatherIssuance,
  NWACWeatherPeriod,
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
import { SectionTabs, type SectionLink } from './SectionTabs.client'
import { DayNightDate, LevelValue, SnowValue, TempValue, WindValue } from './Values'

interface Column {
  key: string
  date: string | null
  sub: string | null
  /** Columns sharing a group sit under one date header (a period's 6h blocks). */
  group?: string
  /** Sun or moon by the date; unset where the column has neither. */
  night?: boolean
  /** Its sun or moon goes by the sub-label (a date's Day / Night), not the date. */
  dayNightOnSub?: boolean
}
interface Row {
  key: string
  label: string
  cells: ReactNode[]
}
interface Group {
  key: string
  /** A zone over its stations, shown in the table's group column; null for a flat table. */
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
  /** Group labels as a first column spanning their rows, headed with this; else heading rows. */
  groupColumn?: string
}

/** Avalanche zone id → the path of that zone's forecast page. */
export type ZonePaths = Record<number, string>

const STICKY = 'sticky left-0 z-10'

// Grouped like the block tables: one date over its periods, Day or Night (with its sun or moon)
// in the sub row.
const periodColumn = (p: NWACWeatherPeriod): Column => ({
  key: p.key,
  date: fmtCalendarDate(p.date),
  sub: p.kind === 'night' ? 'Night' : 'Day',
  group: p.date,
  night: p.kind === 'night',
  dayNightOnSub: true,
})

function blockColumn(issuance: NWACWeatherIssuance, b: NWACWeatherBlock): Column {
  const period = issuance.periods.find((p) => p.key === b.period)
  const date = blockDate(issuance, b)
  return {
    key: b.key,
    date: date ? fmtCalendarDate(date) : null,
    sub: b.part,
    group: b.period ?? undefined,
    night: period ? period.kind === 'night' : undefined,
  }
}

/** Shades levels against the whole table so zones compare. */
function shadedLevels(levels: (number | null)[][]): ReactNode[][] {
  const width = levels[0]?.length ?? 0
  const tones = snowLevelTones(levels.flat())
  return levels.map((row, r) =>
    row.map((level, c) => <LevelValue key={c} level={level} tone={tones[r * width + c]} />),
  )
}

function zoneTables(issuance: NWACWeatherIssuance): Table[] {
  const flat = (rows: Row[]): Group[] => [{ key: 'all', label: null, rows }]
  const zoneRows = (cells: (zoneId: string) => ReactNode[]): Row[] =>
    issuance.zones.map((z) => ({ key: z.id, label: z.name, cells: cells(z.id) }))

  const dates = periodDateGroups(issuance.periods)
  const sensibleColumns = SENSIBLE_SLOTS.map((s, i) => ({
    key: s.key,
    date: dates[i] ? fmtCalendarDate(dates[i].date) : null,
    sub: null,
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
function snowTable(issuance: NWACWeatherIssuance): Table {
  const periods = precipPeriods(issuance)
  const row = (p: NWACWeatherIssuance['points'][number]): Row => ({
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
    groupColumn: 'Zone',
    columns: periods.map(periodColumn),
    groups: groups.filter((g) => g.rows.length > 0),
  }
}

function extendedTable(issuance: NWACWeatherIssuance): Table {
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
    title: 'Snow Levels (ft)',
    rowLabel: 'Zone',
    columns: blocks.map((b) => ({
      key: b.key,
      date: fmtCalendarDate(b.date),
      sub: b.part,
      group: b.date,
    })),
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

/** Runs of columns sharing a group, each headed once. */
function columnGroups(columns: Column[]) {
  const out: { key: string; first: Column; span: number }[] = []
  for (const c of columns) {
    const last = out[out.length - 1]
    if (last && c.group && last.first.group === c.group) last.span++
    else out.push({ key: c.key, first: c, span: 1 })
  }
  return out
}

const HEAD_CELL = 'border-b p-2 align-bottom'
const SUB = 'block whitespace-nowrap text-sm font-normal text-muted-foreground'

function RowLabelHead({ table: t, rowSpan }: { table: Table; rowSpan: number }) {
  const label = 'border-b bg-muted p-2 text-left align-bottom font-semibold'
  return (
    <>
      {t.groupColumn && (
        <th scope="col" rowSpan={rowSpan} className={cn(label, 'pl-3')}>
          {t.groupColumn}
        </th>
      )}
      <th scope="col" rowSpan={rowSpan} className={cn(STICKY, label, !t.groupColumn && 'pl-3')}>
        {t.rowLabel}
      </th>
    </>
  )
}

/** One row: each column's date (with its sun or moon) over any sub-label. */
function FlatHead({ table: t }: { table: Table }) {
  return (
    <tr className="bg-muted">
      <RowLabelHead table={t} rowSpan={1} />
      {t.columns.map((c) => (
        <th
          key={c.key}
          scope="col"
          className={cn(HEAD_CELL, t.prose ? 'text-left' : 'text-center')}
        >
          <span className="whitespace-nowrap font-semibold">
            <DayNightDate date={c.date} night={c.night} />
          </span>
          {c.sub && <span className={SUB}>{c.sub}</span>}
        </th>
      ))}
    </tr>
  )
}

/** A group's day or night for its date: a period's blocks share one; a date's periods don't. */
function groupNight(columns: Column[]) {
  const first = columns[0]
  if (!first || first.dayNightOnSub) return undefined
  return columns.every((c) => c.night === first.night) ? first.night : undefined
}

/**
 * Two rows, as on the zone page: a date per group over its columns' sub-labels, with no rule
 * between them. The sun or moon sits on the date for a period's blocks, and on each sub-label for
 * a date's Day and Night.
 */
function GroupedHead({ table: t }: { table: Table }) {
  const groups = columnGroups(t.columns).map((g) => {
    const start = t.columns.indexOf(g.first)
    const columns = t.columns.slice(start, start + g.span)
    return { ...g, columns, night: groupNight(columns) }
  })
  return (
    <>
      <tr className="bg-muted">
        <RowLabelHead table={t} rowSpan={2} />
        {groups.map((g) => (
          <th
            key={g.key}
            scope="colgroup"
            colSpan={g.span}
            className="border-l px-2 pb-0.5 pt-2 text-center font-semibold whitespace-nowrap"
          >
            <DayNightDate date={g.first.date} night={g.night} />
          </th>
        ))}
      </tr>
      <tr className="bg-muted">
        {groups.flatMap((g) =>
          g.columns.map((c, i) => (
            <th
              key={c.key}
              scope="col"
              className={cn(
                'border-b px-2 pb-2 pt-0.5 text-center',
                i === 0 && 'border-l',
                t.groupColumn && 'min-w-24 px-4',
              )}
            >
              <span className={SUB}>
                {c.dayNightOnSub ? (
                  <DayNightDate date={c.sub} night={c.night} label={false} />
                ) : (
                  c.sub
                )}
              </span>
            </th>
          )),
        )}
      </tr>
    </>
  )
}

function TableHead({ table: t }: { table: Table }) {
  return (
    <thead>
      {t.columns.some((c) => c.group) ? <GroupedHead table={t} /> : <FlatHead table={t} />}
    </thead>
  )
}

function cellClassOf(t: Table) {
  if (t.prose) return 'whitespace-pre-line p-2 text-left align-top'
  return t.filled ? 'p-0.5 align-middle' : 'p-2 text-center align-middle'
}

/** Each group's label in a first column spanning its rows; lighter rules inside a group. */
function GroupColumnBody({ table: t }: { table: Table }) {
  const cellClass = cellClassOf(t)
  return (
    <tbody>
      {t.groups.map((g) =>
        g.rows.map((r, i) => {
          const rule = i === 0 ? 'border-t' : 'border-t border-t-muted'
          return (
            <tr key={r.key}>
              {i === 0 && (
                <th
                  scope="rowgroup"
                  rowSpan={g.rows.length}
                  className="whitespace-nowrap border-t p-2 pl-3 text-left align-top font-semibold"
                >
                  {g.label ?? DASH}
                </th>
              )}
              <th
                scope="row"
                className={cn(STICKY, rule, 'whitespace-nowrap bg-card p-2 text-left font-normal')}
              >
                {r.label}
              </th>
              {r.cells.map((cell, c) => (
                <td key={t.columns[c]?.key ?? c} className={cn(rule, cellClass)}>
                  {cell}
                </td>
              ))}
            </tr>
          )
        }),
      )}
    </tbody>
  )
}

function TableBody({ table: t }: { table: Table }) {
  if (t.groupColumn) return <GroupColumnBody table={t} />
  const cellClass = cellClassOf(t)
  return (
    <tbody>
      {t.groups.map((g) => (
        <Fragment key={g.key}>
          {g.rows.map((r) => (
            <tr key={r.key}>
              <th
                scope="row"
                className={cn(
                  STICKY,
                  'border-t bg-card p-2 pl-3 text-left align-middle font-semibold',
                )}
              >
                {r.label}
              </th>
              {r.cells.map((cell, i) => (
                <td key={t.columns[i]?.key ?? i} className={cn('border-t', cellClass)}>
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
      <Heading
        id={headingId}
        className={cn('scroll-mt-24 font-semibold', Heading === 'h4' ? 'text-base' : 'text-lg')}
      >
        {t.title}
      </Heading>
      {t.note && <p className="text-sm text-muted-foreground">{t.note}</p>}
    </div>
  )
}

/** Prose tables get fixed-width columns; numeric ones size to content. */
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
  anchor,
  headingLevel = 'h3',
}: {
  table: Table
  anchor: string
  headingLevel?: 'h3' | 'h4'
}) {
  const headingId = `${anchor}-${t.id}`
  return (
    <section aria-labelledby={headingId} className="min-w-0 space-y-2">
      <TableTitle table={t} headingId={headingId} Heading={headingLevel} />
      {/* A grouped table is only as wide as its columns; stretched, its few periods sprawl. */}
      <div className={cn('overflow-x-auto rounded-md border', t.groupColumn && 'w-fit max-w-full')}>
        <table
          className={cn(
            'border-collapse text-sm',
            !t.groupColumn && 'w-full',
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

function ZoneLinks({
  issuance,
  zonePaths,
}: {
  issuance: NWACWeatherIssuance
  zonePaths: ZonePaths
}) {
  const links = issuance.zones.flatMap((z) => {
    const href = z.avalancheZoneId != null ? zonePaths[z.avalancheZoneId] : undefined
    return href ? [{ id: z.id, name: z.name, href }] : []
  })
  if (links.length === 0) return null
  return (
    <aside aria-label="Weather by zone" className="space-y-3 rounded-lg bg-muted p-4 print:hidden">
      <div>
        <h3 className="text-sm font-semibold">Weather by zone</h3>
        <p className="text-xs text-muted-foreground">
          Pick a zone to see its forecast with the avalanche forecast.
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
function MaybeTable({ table, anchor }: { table: Table; anchor: string }) {
  return hasContent(table) ? <GridTable table={table} anchor={anchor} /> : null
}

function SynopsisRow({
  issuance,
  synopsis,
  zonePaths,
}: {
  issuance: NWACWeatherIssuance
  synopsis: string | null
  zonePaths: ZonePaths
}) {
  const headingId = `${issuance.type}-synopsis`
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
  anchor,
  extended,
  table,
}: {
  anchor: string
  extended: string | null
  table: Table
}) {
  const showTable = hasContent(table)
  if (!extended && !showTable) return null
  const headingId = `${anchor}-extended`
  return (
    <section aria-labelledby={headingId} className="space-y-4 border-t pt-6">
      <h3 id={headingId} className="scroll-mt-24 text-lg font-semibold">
        Extended
      </h3>
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* The outlook text is optional; without it the table takes the first column. */}
        {extended && (
          <section className="space-y-2">
            <h4 className="text-base font-semibold">Outlook</h4>
            <RichText html={extended} />
          </section>
        )}
        {showTable && <GridTable table={table} anchor={anchor} headingLevel="h4" />}
      </div>
    </section>
  )
}

function sectionLinks(issuance: NWACWeatherIssuance): SectionLink[] {
  const [sensible, snowLevel, temps, wind] = zoneTables(issuance)
  const hasExtended = !!textOrNull(issuance.extendedOutlook) || hasContent(extendedTable(issuance))
  return [
    ...(textOrNull(issuance.synopsis) ? [{ id: 'synopsis', label: 'Synopsis' }] : []),
    ...[sensible, snowLevel, temps, wind, snowTable(issuance)]
      .filter(hasContent)
      .map((t) => ({ id: t.id, label: t.nav })),
    ...(hasExtended ? [{ id: 'extended', label: 'Extended' }] : []),
  ].map((l) => ({ ...l, id: `${issuance.type}-${l.id}` }))
}

/** The issuance's section links, for the tabs across the top of its card. */
export function OverallSectionTabs({ issuance }: { issuance: NWACWeatherIssuance }) {
  return <SectionTabs links={sectionLinks(issuance)} />
}

export function Overall({
  issuance,
  zonePaths = {},
}: {
  issuance: NWACWeatherIssuance
  zonePaths?: ZonePaths
}) {
  const synopsis = textOrNull(issuance.synopsis)
  const extended = textOrNull(issuance.extendedOutlook)
  const [sensible, snowLevel, temps, wind] = zoneTables(issuance)
  const snow = snowTable(issuance)
  const ext = extendedTable(issuance)
  // Section anchors read `#afternoon-snow-level`: a date has at most one issuance of each type.
  const anchor = issuance.type
  const tempsOrWind = hasContent(temps) || hasContent(wind)

  return (
    <div className="space-y-8">
      <SynopsisRow issuance={issuance} synopsis={synopsis} zonePaths={zonePaths} />
      <MaybeTable table={sensible} anchor={anchor} />
      <MaybeTable table={snowLevel} anchor={anchor} />
      {tempsOrWind && (
        <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <MaybeTable table={temps} anchor={anchor} />
          <MaybeTable table={wind} anchor={anchor} />
        </div>
      )}
      <MaybeTable table={snow} anchor={anchor} />
      <ExtendedSection anchor={anchor} extended={extended} table={ext} />
    </div>
  )
}
