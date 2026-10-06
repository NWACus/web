/**
 * The region-wide view: synopsis and zone links, one table per variable (zones or stations down,
 * periods or blocks across), then the extended outlook. Which tables a forecast has, its rows and
 * the columns each covers come from the forecast's own template and layout; what each is called,
 * where it sits and how a value draws is this page's.
 */
import { DiscussionBody } from '@/components/forecast/DiscussionBody'
import { sanitizeHtml } from '@/components/forecast/sanitizeHtml'
import Link from 'next/link'
import { Fragment, type ReactNode } from 'react'

import type {
  NWACWeatherBlock,
  NWACWeatherIssuance,
  NWACWeatherPeriod,
} from '@/services/nac/model/nwacWeather'
import {
  DASH,
  blockDate,
  deriveSnow,
  deriveSnowLevel,
  fmtCalendarDate,
  fmtSnowAmount,
  precipPeriods,
  sectionFor,
  snowLevelBlocks,
  snowLevelTones,
  tempPeriods,
  windBlocks,
} from '@/services/nac/nwacWeatherFormat'
import { cn } from '@/utilities/ui'

import { SectionTabs, type SectionLink } from './SectionTabs.client'
import { SensibleDays, type SensibleDay, type SensibleRow } from './SensibleDays.client'
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
  /** Paragraphs that continue the note: the legacy page's info-bubble text for this table. */
  detail?: string[]
  rowLabel: string
  columns: Column[]
  groups: Group[]
  /** Cells whose content fills them (shaded snow levels) take less padding. */
  filled?: boolean
  /** Group labels as a first column spanning their rows, headed with this; else heading rows. */
  groupColumn?: string
}

/** Avalanche zone id → the path of that zone's forecast page. */
export type ZonePaths = Record<number, string>

const STICKY = 'sticky left-0 z-10'

// The wording of the info bubbles on NWAC's legacy Mountain Weather Forecast page.
const SNOW_LEVEL_DETAIL = [
  'The snow level forecast represents the general snow level over a 6 hr time period. Freezing levels are forecast when precipitation is not expected.',
]
const TEMPS_DETAIL = [
  'The 5000’ temperature forecast does not imply a trend over the 12 hr period and only represents the max and min temperatures within a 12 hr period in the zone. The 6-hr snow level forecast, the forecast discussion, and weather forecast sections may add detail regarding temperature trends.',
]
const WIND_DETAIL = [
  'Ridgeline winds are the average wind speed and direction over a 6 hr time period.',
  'The wind forecast represents an elevation range instead of a single elevation slice. The elevation range overlaps with the near and above treeline elevation bands in the avalanche forecast and differs per zone.',
  'Wind direction indicates the direction the wind originates or comes from on the 16-point compass rose.',
]

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

/** Forecaster-authored HTML, or null when blank. */
function authoredOrNull(html: string | null | undefined): string | null {
  return html?.trim() ? html : null
}

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

const flat = (rows: Row[]): Group[] => [{ key: 'all', label: null, rows }]

function zoneRows(issuance: NWACWeatherIssuance, cells: (zoneId: string) => ReactNode[]): Row[] {
  return issuance.zones.map((z) => ({ key: z.id, label: z.name, cells: cells(z.id) }))
}

function snowLevelTable(issuance: NWACWeatherIssuance): Table | null {
  if (!sectionFor(issuance, 'snowLevel')) return null
  const blocks = snowLevelBlocks(issuance)
  const levels = shadedLevels(
    issuance.zones.map((z) =>
      blocks.map((b) => {
        const cell = issuance.snowLevel[z.id]?.[b.key]
        return deriveSnowLevel(cell?.freezing, cell?.drop)
      }),
    ),
  )
  const byZone = new Map(issuance.zones.map((z, i) => [z.id, levels[i]]))
  return {
    id: 'snow-level',
    nav: 'Snow level',
    title: 'Snow Level (ft)',
    note: 'Where rain turns to snow. Darker is higher.',
    detail: SNOW_LEVEL_DETAIL,
    rowLabel: 'Zone',
    columns: blocks.map((b) => blockColumn(issuance, b)),
    groups: flat(zoneRows(issuance, (id) => byZone.get(id) ?? [])),
    filled: true,
  }
}

function tempsTable(issuance: NWACWeatherIssuance): Table | null {
  if (!sectionFor(issuance, 'temp')) return null
  const periods = tempPeriods(issuance)
  return {
    id: 'temps',
    nav: "5000' temps",
    title: "5000' Temperatures (°F)",
    note: 'High / low.',
    detail: TEMPS_DETAIL,
    rowLabel: 'Zone',
    columns: periods.map(periodColumn),
    groups: flat(
      zoneRows(issuance, (id) =>
        periods.map((p) => <TempValue key={p.key} cell={issuance.temp[id]?.[p.key]} />),
      ),
    ),
  }
}

function windTable(issuance: NWACWeatherIssuance): Table | null {
  if (!sectionFor(issuance, 'wind')) return null
  const blocks = windBlocks(issuance)
  return {
    id: 'wind',
    nav: 'Ridgeline winds',
    title: 'Ridgeline Winds (mph)',
    note: 'Arrows point the way the wind blows.',
    detail: WIND_DETAIL,
    rowLabel: 'Zone',
    columns: blocks.map((b) => blockColumn(issuance, b)),
    groups: flat(
      zoneRows(issuance, (id) =>
        blocks.map((b) => <WindValue key={b.key} cell={issuance.wind[id]?.[b.key]} />),
      ),
    ),
  }
}

/** New snow by station, the stations grouped under their zones in zone order. */
function snowTable(issuance: NWACWeatherIssuance): Table | null {
  if (!sectionFor(issuance, 'precip')) return null
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

function extendedTable(issuance: NWACWeatherIssuance): Table | null {
  if (!sectionFor(issuance, 'extendedSnowLevel')) return null
  // The zones the forecast was published with an outlook for, in zone order.
  const zones = issuance.zones.filter((z) => issuance.extendedZones.includes(z.id))
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
    detail: SNOW_LEVEL_DETAIL,
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

const hasContent = (t: Table | null): t is Table =>
  !!t && t.columns.length > 0 && t.groups.some((g) => g.rows.length > 0)

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
        <th key={c.key} scope="col" className={cn(HEAD_CELL, 'text-center')}>
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
  const [first, ...rest] = t.detail ?? []
  return (
    <div>
      <Heading
        id={headingId}
        className={cn('scroll-mt-24 font-semibold', Heading === 'h4' ? 'text-base' : 'text-lg')}
      >
        {t.title}
      </Heading>
      {(t.note || first) && (
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>{[t.note, first].filter(Boolean).join(' ')}</p>
          {rest.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      )}
    </div>
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
        <table className={cn('border-collapse text-sm', !t.groupColumn && 'w-full', 'min-w-max')}>
          <TableHead table={t} />
          <TableBody table={t} />
        </table>
      </div>
    </section>
  )
}

interface ZoneLink {
  id: string
  name: string
  href: string
}

/** The weather zones that have an avalanche forecast page to link to. */
function zoneLinksOf(issuance: NWACWeatherIssuance, zonePaths: ZonePaths): ZoneLink[] {
  return issuance.zones.flatMap((z) => {
    const href = z.avalancheZoneId != null ? zonePaths[z.avalancheZoneId] : undefined
    return href ? [{ id: z.id, name: z.name, href }] : []
  })
}

function ZoneLinks({ links }: { links: ZoneLink[] }) {
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
function MaybeTable({ table, anchor }: { table: Table | null; anchor: string }) {
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
  const links = zoneLinksOf(issuance, zonePaths)
  const text = synopsis && (
    <section aria-labelledby={headingId} className="space-y-1">
      <h3 id={headingId} className="scroll-mt-24 text-lg font-semibold">
        Weather Synopsis
      </h3>
      <DiscussionBody html={sanitizeHtml(synopsis)} />
    </section>
  )
  // Without zone links the synopsis takes the full width.
  if (links.length === 0) return text
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      {text || <div />}
      <ZoneLinks links={links} />
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
  table: Table | null
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
            <DiscussionBody html={sanitizeHtml(extended)} />
          </section>
        )}
        {showTable && <GridTable table={table} anchor={anchor} headingLevel="h4" />}
      </div>
    </section>
  )
}

/** Each sensible-weather day with its date, and each zone's text by day; empty when none. */
/** Each sensible-weather slot as the issuance frames it, and each zone's text by slot. */
function sensibleDays(issuance: NWACWeatherIssuance) {
  const days: SensibleDay[] = sectionFor(issuance, 'sensible')
    ? issuance.sensibleSlots.map((s) => ({
        key: s.key,
        label: s.label,
        date: s.date ? fmtCalendarDate(s.date) : null,
      }))
    : []
  const rows: SensibleRow[] = issuance.zones.map((z) => ({
    key: z.id,
    zone: z.name,
    text: Object.fromEntries(
      days.map((d) => [d.key, issuance.sensible[z.id]?.[d.key]?.trim() ?? '']),
    ),
  }))
  const any = days.length > 0 && rows.some((r) => Object.values(r.text).some(Boolean))
  return { days, rows: any ? rows : [] }
}

/** Everything the issuance's card shows, built once for the section tabs and the body. */
export interface OverallParts {
  issuance: NWACWeatherIssuance
  synopsis: string | null
  extended: string | null
  /** Each null when the forecast's format has no such section. */
  snowLevel: Table | null
  temps: Table | null
  wind: Table | null
  snow: Table | null
  ext: Table | null
  sensible: ReturnType<typeof sensibleDays>
}

export function overallParts(issuance: NWACWeatherIssuance): OverallParts {
  return {
    issuance,
    synopsis: authoredOrNull(issuance.synopsis),
    extended: authoredOrNull(issuance.extendedOutlook),
    snowLevel: snowLevelTable(issuance),
    temps: tempsTable(issuance),
    wind: windTable(issuance),
    snow: snowTable(issuance),
    ext: extendedTable(issuance),
    sensible: sensibleDays(issuance),
  }
}

function sectionLinks(p: OverallParts): SectionLink[] {
  const hasExtended = !!p.extended || hasContent(p.ext)
  return [
    ...(p.synopsis ? [{ id: 'synopsis', label: 'Synopsis' }] : []),
    ...(p.sensible.rows.length ? [{ id: 'sensible', label: 'Sensible weather' }] : []),
    ...[p.snow, p.snowLevel, p.temps, p.wind]
      .filter(hasContent)
      .map((t) => ({ id: t.id, label: t.nav })),
    ...(hasExtended ? [{ id: 'extended', label: 'Extended' }] : []),
  ].map((l) => ({ ...l, id: `${p.issuance.type}-${l.id}` }))
}

/** The issuance's section links, for the tabs across the top of its card. */
export function OverallSectionTabs({ parts }: { parts: OverallParts }) {
  return <SectionTabs links={sectionLinks(parts)} />
}

export function Overall({ parts, zonePaths = {} }: { parts: OverallParts; zonePaths?: ZonePaths }) {
  const { issuance, synopsis, extended, snowLevel, temps, wind, sensible, snow, ext } = parts
  // Section anchors read `#afternoon-snow-level`: a date has at most one issuance of each type.
  const anchor = issuance.type
  const tempsOrWind = hasContent(temps) || hasContent(wind)

  return (
    <div className="space-y-8">
      <SynopsisRow issuance={issuance} synopsis={synopsis} zonePaths={zonePaths} />
      {/* Sensible shows one day at a time, so it's narrow enough to share Snow's row. */}
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
        {sensible.rows.length > 0 && (
          <SensibleDays
            headingId={`${anchor}-sensible`}
            days={sensible.days}
            rows={sensible.rows}
          />
        )}
        <MaybeTable table={snow} anchor={anchor} />
      </div>
      <MaybeTable table={snowLevel} anchor={anchor} />
      {tempsOrWind && (
        <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <MaybeTable table={temps} anchor={anchor} />
          <MaybeTable table={wind} anchor={anchor} />
        </div>
      )}
      <ExtendedSection anchor={anchor} extended={extended} table={ext} />
    </div>
  )
}
