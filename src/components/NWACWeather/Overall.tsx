/**
 * The region-wide view: synopsis and zone links, one table per variable (zones or stations down,
 * periods or blocks across), then the extended outlook.
 */
import { DiscussionBody } from '@/components/forecast/DiscussionBody'
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
  dayGroups,
  deriveSnow,
  deriveSnowLevel,
  fmtCalendarDate,
  fmtQpf,
  levelKind,
  precipPeriods,
  sensibleSlots,
  snowLevelBlocks,
  snowRange,
  tempPeriods,
  windBlocks,
} from '@/services/nac/nwacWeatherFormat'
import { cn } from '@/utilities/ui'

import { PrecipHoursPanel, PrecipHoursSwitch, PrecipHoursToggle } from './PrecipHours.client'
import { SectionTabs, type SectionLink } from './SectionTabs.client'
import {
  DayNightDate,
  SnowFillLegend,
  SnowLevelLegend,
  SnowLevelValue,
  SnowValue,
  TempLegend,
  TempValue,
  WindLegend,
  WindValue,
  levelFill,
  snowFill,
} from './Values'
import { WeatherSummary, type SensibleDay, type SensibleRow } from './WeatherSummary.client'

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
  /**
   * A third header row under the sub-label, for a period split into several values ("Precip",
   * "Snow"); columns sharing a `split` sit under one sub-label.
   */
  part?: string
  split?: string
  /** Set off from the columns before it by a heavier rule (a total). */
  total?: boolean
}
interface Row {
  key: string
  label: string
  cells: ReactNode[]
  /** A background class per cell, for values shaded by amount. */
  fills?: (string | undefined)[]
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
  /** Shown quietly after the title, in parentheses. */
  unit?: string
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
  /** Beside the title, bottom-aligned: a control for the table. */
  aside?: ReactNode
  /** After the description, over the table: what the shading means. */
  legend?: ReactNode
}

/** Avalanche zone id → the path of that zone's forecast page. */
export type ZonePaths = Record<number, string>

const STICKY = 'sticky left-0 z-10'

// Condensed from the info bubbles on NWAC's legacy Mountain Weather Forecast page.
const PRECIP_DETAIL = [
  'Precip is the liquid equivalent of all precipitation (rain, snow, ice pellets), to the hundredth of an inch. To estimate snow, start at 10:1 (1" of precip ≈ 10" of snow); near freezing gives less (heavy, wet snow), very cold more (light, dry snow).',
]
const SNOW_LEVEL_DETAIL = [
  'The general snow level over each 6 hours; a freezing level instead when no precipitation is expected.',
]
const TEMPS_DETAIL = [
  'The high and low at 5000’ within each 12 hours, not a trend. The snow level, synopsis and weather summary say more about how temperatures change.',
]
const WIND_DETAIL = [
  'The average speed and direction over each 6 hours, from the 16-point compass direction the wind comes from. Ridgeline winds cover a range of elevations, differing by zone, that overlaps the near and above treeline bands of the avalanche forecast.',
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

/** Forecaster-authored HTML, or null when blank. Already sanitized: see `sanitizeIssuance`. */
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

/**
 * A zone's snow and freezing levels, each cell filled by its elevation, so the fill takes the whole
 * cell rather than a pill inside it.
 */
function levelRow(
  zone: { id: string; name: string },
  cells: { key: string; level: number | null; snow: boolean }[],
): Row {
  return {
    key: zone.id,
    label: zone.name,
    cells: cells.map((c) => (
      <SnowLevelValue key={c.key} level={c.level} snow={c.snow} pill={false} />
    )),
    fills: cells.map((c) => (c.level != null ? levelFill(c.level) : undefined)),
  }
}

function zoneTables(issuance: NWACWeatherIssuance): Table[] {
  const flat = (rows: Row[]): Group[] => [{ key: 'all', label: null, rows }]
  const zoneRows = (cells: (zoneId: string) => ReactNode[]): Row[] =>
    issuance.zones.map((z) => ({ key: z.id, label: z.name, cells: cells(z.id) }))

  const levelBlocks = snowLevelBlocks(issuance)

  const temps = tempPeriods(issuance)
  const winds = windBlocks(issuance)

  return [
    {
      id: 'snow-level',
      nav: 'Snow & freezing level',
      title: 'Snow and Freezing Level',
      unit: 'ft',
      detail: SNOW_LEVEL_DETAIL,
      legend: <SnowLevelLegend />,
      rowLabel: 'Zone',
      columns: levelBlocks.map((b) => blockColumn(issuance, b)),
      groups: flat(
        issuance.zones.map((z) =>
          levelRow(
            z,
            levelBlocks.map((b) => {
              const cell = issuance.snowLevel[z.id]?.[b.key]
              return {
                key: b.key,
                level: deriveSnowLevel(cell?.freezing),
                snow: levelKind(issuance, z.id, b) === 'snow',
              }
            }),
          ),
        ),
      ),
      filled: true,
    },
    {
      id: 'temps',
      nav: "5000' temps",
      title: "5000' Temperatures",
      unit: '°F',
      detail: TEMPS_DETAIL,
      legend: <TempLegend />,
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
      title: 'Ridgeline Winds',
      unit: 'mph',
      detail: WIND_DETAIL,
      legend: <WindLegend />,
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

/** The sum of the values given, or null when there are none. */
function sumOf(values: (number | null | undefined)[]): number | null {
  const known = values.filter((v): v is number => v != null)
  return known.length ? known.reduce((a, b) => a + b, 0) : null
}

/** A sum of hundredths back to hundredths, dropping float noise (0.1 + 0.2 → 0.3). */
function hundredths(value: number | null): number | null {
  return value == null ? null : Math.round(value * 100) / 100
}

/** One period's (or the total's) water equivalent then snow, the pair shaded by the snow. */
function precipSnowPair(qpf: number | null | undefined, snow: number | null) {
  const some = snow != null && snow > 0
  const fill = snowFill(snow)
  return {
    cells: [
      <span key="we" className="tabular-nums text-muted-foreground">
        {fmtQpf(qpf)}
      </span>,
      <SnowValue key="snow" text={snowRange(snow)} some={some} />,
    ],
    fills: [fill, fill],
  }
}

/**
 * Water equivalent and the new snow it makes, by station, the stations grouped under their zones:
 * each period split in two, then the whole window's total.
 */
/** One column pair of the precipitation and snow table: the periods its values add up. */
interface PrecipSlot {
  column: Column
  periods: NWACWeatherPeriod[]
}

export type PrecipHours = '12' | '24'

/** Each period on its own (12 hours), or folded into nights and the days after (24). */
function precipSlots(issuance: NWACWeatherIssuance, hours: PrecipHours): PrecipSlot[] {
  const periods = precipPeriods(issuance)
  if (hours === '12') return periods.map((p) => ({ column: periodColumn(p), periods: [p] }))
  return dayGroups(periods).map((g) => {
    const first = fmtCalendarDate(g.periods[0].date)
    const last = fmtCalendarDate(g.periods[g.periods.length - 1].date)
    return {
      column: {
        key: g.key,
        date: first === last ? first : `${first} – ${last}`,
        sub: g.partial ?? 'Night + Day',
        group: g.key,
      },
      periods: g.periods,
    }
  })
}

/**
 * Water equivalent and the new snow it makes, by station, the stations grouped under their zones:
 * each 12 or 24 hours split in two, then the whole window's total.
 */
function precipSnowTable(issuance: NWACWeatherIssuance, hours: PrecipHours): Table {
  const slots = precipSlots(issuance, hours)
  const periods = precipPeriods(issuance)
  const row = (p: NWACWeatherIssuance['points'][number]): Row => {
    const cell = (period: NWACWeatherPeriod) => issuance.precip[p.code]?.[period.key]
    const totalOf = (of: NWACWeatherPeriod[]) =>
      precipSnowPair(
        hundredths(sumOf(of.map((period) => cell(period)?.qpf))),
        sumOf(of.map((period) => deriveSnow(cell(period)?.qpf, cell(period)?.density))),
      )
    const pairs = [...slots.map((s) => totalOf(s.periods)), totalOf(periods)]
    return {
      key: p.code,
      label: p.name,
      cells: pairs.flatMap((pair) => pair.cells),
      fills: pairs.flatMap((pair) => pair.fills),
    }
  }
  const split = (column: Column): Column[] =>
    ['Precip', 'Snow'].map((part) => ({
      ...column,
      key: `${column.key}-${part}`,
      part,
      split: column.key,
    }))
  return {
    id: `precip-snow-${hours}`,
    nav: 'Precipitation & snow',
    title: 'Precipitation and Snow',
    unit: 'in',
    note: 'Precipitation (liquid, in) and new snow by station; Total covers the whole forecast.',
    detail: PRECIP_DETAIL,
    legend: <SnowFillLegend />,
    aside: <PrecipHoursToggle />,
    rowLabel: 'Station',
    groupColumn: 'Zone',
    columns: [
      ...slots.map((s) => s.column).flatMap(split),
      ...split({ key: 'total', date: 'Total', sub: null, group: 'total', total: true }),
    ],
    groups: stationGroups(issuance, row),
  }
}

/** The stations in zone order, grouped under their zones, each made a row by `row`. */
function stationGroups(
  issuance: NWACWeatherIssuance,
  row: (p: NWACWeatherIssuance['points'][number]) => Row,
): Group[] {
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
  return groups.filter((g) => g.rows.length > 0)
}

function extendedTable(issuance: NWACWeatherIssuance): Table {
  const zones = issuance.zones.filter((z) => issuance.extendedSnowLevel[z.id])
  const blocks = issuance.extendedBlocks
  // No precipitation beyond the main window, so a level is a snow level unless the forecaster
  // marked it a freezing level.
  return {
    id: 'extended-snow-level',
    nav: 'Extended',
    title: 'Snow Levels',
    unit: 'ft',
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
        rows: zones.map((z) =>
          levelRow(
            z,
            blocks.map((b) => {
              const cell = issuance.extendedSnowLevel[z.id]?.[b.key]
              return {
                key: b.key,
                level: deriveSnowLevel(cell?.freezing),
                snow: cell?.mode !== 'freezing',
              }
            }),
          ),
        ),
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

const isSplit = (t: Table) => t.columns.some((c) => c.part)

/** Runs of columns sharing a split: one period's values. */
function splitRuns(columns: Column[]) {
  const out: { first: Column; span: number }[] = []
  for (const c of columns) {
    const last = out[out.length - 1]
    if (last && c.split && last.first.split === c.split) last.span++
    else out.push({ first: c, span: 1 })
  }
  return out
}

/** The rule before a column: one at each period's first value, heavier before a total. */
function leftRule(columns: Column[], i: number) {
  const c = columns[i]
  if (!c?.split || columns[i - 1]?.split === c.split) return undefined
  return c.total ? 'border-l-2' : 'border-l'
}

/**
 * Three rows for a table whose periods are split: a date over its periods, each period's Day or
 * Night (with its sun or moon) over its values' labels. A column without a sub-label (the total)
 * takes the first two rows with its name.
 */
function SplitHead({ table: t }: { table: Table }) {
  const runs = splitRuns(t.columns)
  const dateRow = columnGroups(t.columns)
  const ruleAt = (c: Column) => leftRule(t.columns, t.columns.indexOf(c))
  return (
    <>
      <tr className="bg-muted">
        <RowLabelHead table={t} rowSpan={3} />
        {dateRow.map((g) => (
          <th
            key={g.key}
            scope="colgroup"
            colSpan={g.span}
            rowSpan={g.first.sub ? 1 : 2}
            className={cn(
              'px-2 pb-0.5 pt-2 text-center font-semibold whitespace-nowrap',
              !g.first.sub && 'align-bottom',
              ruleAt(g.first),
            )}
          >
            {g.first.date}
          </th>
        ))}
      </tr>
      <tr className="bg-muted">
        {runs
          .filter((r) => r.first.sub)
          .map((r) => (
            <th
              key={r.first.key}
              scope="colgroup"
              colSpan={r.span}
              className={cn('px-2 py-0.5 text-center', ruleAt(r.first))}
            >
              <span className={SUB}>
                <DayNightDate date={r.first.sub} night={r.first.night} label={false} />
              </span>
            </th>
          ))}
      </tr>
      <tr className="bg-muted">
        {t.columns.map((c, i) => (
          <th
            key={c.key}
            scope="col"
            className={cn('border-b px-1 pb-2 pt-0.5 text-center', leftRule(t.columns, i))}
          >
            <span className="block whitespace-nowrap text-xs font-normal text-muted-foreground">
              {c.part}
            </span>
          </th>
        ))}
      </tr>
    </>
  )
}

function TableHead({ table: t }: { table: Table }) {
  const head = isSplit(t) ? (
    <SplitHead table={t} />
  ) : t.columns.some((c) => c.group) ? (
    <GroupedHead table={t} />
  ) : (
    <FlatHead table={t} />
  )
  return <thead>{head}</thead>
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
                  className="border-t p-2 pl-3 text-left align-top font-semibold"
                >
                  {g.label ?? DASH}
                </th>
              )}
              <th scope="row" className={cn(STICKY, rule, 'bg-card p-2 text-left font-normal')}>
                {r.label}
              </th>
              {r.cells.map((cell, c) => (
                <td
                  key={t.columns[c]?.key ?? c}
                  className={cn(rule, cellClass, r.fills?.[c], leftRule(t.columns, c))}
                >
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
          {g.label && (
            <tr>
              <th
                scope="rowgroup"
                colSpan={t.columns.length + 1}
                className="border-t bg-muted/50 px-3 py-1.5 text-left text-xs font-semibold"
              >
                {/* Stays in view while the values scroll sideways under it. */}
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
                  'border-t bg-card p-2 pl-3 text-left align-middle font-semibold',
                )}
              >
                {r.label}
              </th>
              {r.cells.map((cell, i) => (
                <td
                  key={t.columns[i]?.key ?? i}
                  className={cn('border-t', cellClass, r.fills?.[i], leftRule(t.columns, i))}
                >
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
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <Heading
          id={headingId}
          className={cn('scroll-mt-24 font-semibold', Heading === 'h4' ? 'text-base' : 'text-lg')}
        >
          {t.title}
          {t.unit && (
            <span className="text-base font-normal text-muted-foreground"> ({t.unit})</span>
          )}
        </Heading>
        {t.aside}
      </div>
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

/**
 * Label column widths as CSS variables, narrower on a phone so the values get the room: the group
 * column (a grouped table's zones) and the row labels. Static classes, so Tailwind sees them.
 */
const LABEL_VARS = '[--group:5.5rem] [--label:7.5rem] md:[--group:8rem] md:[--label:12rem]'
/** A data column of a grouped table, which is sized to its columns rather than stretched. */
const GROUPED_COL_REM = 5.5
/** A split table's value column, half a period: room for a two-decimal amount. */
const SPLIT_COL_REM = 4
/** The narrowest a data column of a stretched table gets before the table scrolls instead. */
const MIN_COL_REM = 5

function labels(t: Table) {
  return t.groupColumn ? 'var(--group) + var(--label)' : 'var(--label)'
}

/**
 * Fixed layout, so every data column of a table is the same width whatever its values: a grouped
 * table at exactly its columns' width, the others across the page down to a scrolling minimum.
 */
function tableWidth(t: Table) {
  const n = t.columns.length
  if (isSplit(t)) return { width: '100%', minWidth: `calc(${labels(t)} + ${n * SPLIT_COL_REM}rem)` }
  return t.groupColumn
    ? { width: `calc(${labels(t)} + ${n * GROUPED_COL_REM}rem)` }
    : { width: '100%', minWidth: `calc(${labels(t)} + ${n * MIN_COL_REM}rem)` }
}

function TableColumns({ table: t }: { table: Table }) {
  return (
    <colgroup>
      {t.groupColumn && <col style={{ width: 'var(--group)' }} />}
      <col style={{ width: 'var(--label)' }} />
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
      {t.groupColumn ? (
        <>
          <TableBox table={t} className="hidden md:block" />
          {/* On a phone the group column would take half the width: its labels become heading
              rows over their rows instead, and the values get the room. */}
          <TableBox table={{ ...t, groupColumn: undefined }} className="md:hidden" />
        </>
      ) : (
        <TableBox table={t} />
      )}
      {t.legend}
    </section>
  )
}

function TableBox({ table: t, className }: { table: Table; className?: string }) {
  return (
    /* A grouped table is only as wide as its columns; stretched, its few periods sprawl. */
    <div
      className={cn(
        // `relative` makes the box the containing block of the headers' screen-reader labels
        // (absolutely positioned), so they are clipped with the table instead of widening the page.
        'relative overflow-x-auto rounded-md border',
        t.groupColumn && !isSplit(t) && 'w-fit max-w-full',
        className,
      )}
    >
      <table
        className={cn(LABEL_VARS, 'table-fixed border-collapse text-sm')}
        style={tableWidth(t)}
      >
        <TableColumns table={t} />
        <TableHead table={t} />
        <TableBody table={t} />
      </table>
    </div>
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

// One per issuance panel, so the heading's id takes the issuance's anchor.
function ZoneLinks({ links, headingId }: { links: ZoneLink[]; headingId: string }) {
  return (
    <aside aria-labelledby={headingId} className="space-y-3 border-t pt-6 print:hidden">
      <div className="space-y-0.5">
        <h3 id={headingId} className="text-lg font-semibold">
          Looking for weather by zone?
        </h3>
        <p className="text-muted-foreground">
          Each zone&rsquo;s page has its mountain weather with the avalanche forecast.
        </p>
      </div>
      <ul className="flex flex-wrap gap-2">
        {links.map((l) => (
          <li key={l.id}>
            <Link
              href={l.href}
              className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground no-underline transition-colors hover:bg-primary/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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

/** The synopsis, with the zones' weather summary beside it when there is one. */
function SynopsisRow({
  issuance,
  synopsis,
  summary,
}: {
  issuance: NWACWeatherIssuance
  synopsis: string | null
  summary: ReactNode
}) {
  const headingId = `${issuance.type}-synopsis`
  const text = synopsis && (
    <section aria-labelledby={headingId} className="space-y-1">
      <h3 id={headingId} className="scroll-mt-24 text-lg font-semibold">
        Weather Synopsis
      </h3>
      <DiscussionBody html={synopsis} />
    </section>
  )
  // Without a summary the synopsis takes the full width.
  if (!summary) return text
  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] xl:items-start">
      {text || <div />}
      {summary}
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
            <DiscussionBody html={extended} />
          </section>
        )}
        {showTable && <GridTable table={table} anchor={anchor} headingLevel="h4" />}
      </div>
    </section>
  )
}

/** Each sensible-weather day with its date, and each zone's text by day; empty when none. */
function sensibleDays(issuance: NWACWeatherIssuance) {
  const days: SensibleDay[] = sensibleSlots(issuance).map((s) => ({
    ...s,
    date: s.date ? fmtCalendarDate(s.date) : null,
  }))
  const rows: SensibleRow[] = issuance.zones.map((z) => ({
    key: z.id,
    zone: z.name,
    text: Object.fromEntries(
      days.map((d) => [d.key, issuance.sensible[z.id]?.[d.key]?.trim() ?? '']),
    ),
  }))
  const any = rows.some((r) => Object.values(r.text).some(Boolean))
  return { days, rows: any ? rows : [] }
}

/** The precipitation, snow level, temperature and wind tables, in the order both views show them. */
function VariableTables({
  anchor,
  precipSnow,
  snowLevel,
  temps,
  wind,
}: {
  anchor: string
  precipSnow: Record<PrecipHours, Table>
  snowLevel: Table
  temps: Table
  wind: Table
}) {
  const tempsOrWind = hasContent(temps) || hasContent(wind)
  return (
    <>
      {hasContent(precipSnow['12']) && (
        <PrecipHoursSwitch id={`${anchor}-precip-snow`}>
          <PrecipHoursPanel hours="12">
            <GridTable table={precipSnow['12']} anchor={anchor} />
          </PrecipHoursPanel>
          <PrecipHoursPanel hours="24">
            <GridTable table={precipSnow['24']} anchor={anchor} />
          </PrecipHoursPanel>
        </PrecipHoursSwitch>
      )}
      <MaybeTable table={snowLevel} anchor={anchor} />
      {tempsOrWind && (
        <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <MaybeTable table={temps} anchor={anchor} />
          <MaybeTable table={wind} anchor={anchor} />
        </div>
      )}
    </>
  )
}

/** Everything the issuance's card shows, built once for the section tabs and the body. */
export interface OverallParts {
  issuance: NWACWeatherIssuance
  synopsis: string | null
  extended: string | null
  snowLevel: Table
  temps: Table
  wind: Table
  /** By the hours each column covers; the toggle shows one. */
  precipSnow: Record<PrecipHours, Table>
  ext: Table
  sensible: ReturnType<typeof sensibleDays>
}

export function overallParts(issuance: NWACWeatherIssuance): OverallParts {
  const [snowLevel, temps, wind] = zoneTables(issuance)
  return {
    issuance,
    synopsis: authoredOrNull(issuance.synopsis),
    extended: authoredOrNull(issuance.extendedOutlook),
    snowLevel,
    temps,
    wind,
    precipSnow: { '12': precipSnowTable(issuance, '12'), '24': precipSnowTable(issuance, '24') },
    ext: extendedTable(issuance),
    sensible: sensibleDays(issuance),
  }
}

function sectionLinks(p: OverallParts): SectionLink[] {
  const hasExtended = !!p.extended || hasContent(p.ext)
  return [
    ...(p.synopsis ? [{ id: 'synopsis', label: 'Synopsis' }] : []),
    ...(p.sensible.rows.length ? [{ id: 'sensible', label: 'Weather summary' }] : []),
    // The precipitation tables share one anchor, on the wrapper both sit in.
    ...(hasContent(p.precipSnow['12'])
      ? [{ id: 'precip-snow', label: p.precipSnow['12'].nav }]
      : []),
    ...[p.snowLevel, p.temps, p.wind].filter(hasContent).map((t) => ({ id: t.id, label: t.nav })),
    ...(hasExtended ? [{ id: 'extended', label: 'Extended' }] : []),
  ].map((l) => ({ ...l, id: `${p.issuance.type}-${l.id}` }))
}

/** The issuance's section links, for the tabs across the top of its card. */
export function OverallSectionTabs({ parts }: { parts: OverallParts }) {
  return <SectionTabs links={sectionLinks(parts)} />
}

export function Overall({ parts, zonePaths = {} }: { parts: OverallParts; zonePaths?: ZonePaths }) {
  const { issuance, synopsis, extended, snowLevel, temps, wind, sensible, precipSnow, ext } = parts
  // Section anchors read `#afternoon-snow-level`: a date has at most one issuance of each type.
  const anchor = issuance.type
  const zoneLinks = zoneLinksOf(issuance, zonePaths)

  return (
    <div className="space-y-8">
      <SynopsisRow
        issuance={issuance}
        synopsis={synopsis}
        summary={
          sensible.rows.length > 0 && (
            <WeatherSummary
              headingId={`${anchor}-sensible`}
              days={sensible.days}
              rows={sensible.rows.map((r) => ({
                ...r,
                href: zoneLinks.find((l) => l.id === r.key)?.href,
              }))}
            />
          )
        }
      />
      <VariableTables
        anchor={anchor}
        precipSnow={precipSnow}
        snowLevel={snowLevel}
        temps={temps}
        wind={wind}
      />
      <ExtendedSection anchor={anchor} extended={extended} table={ext} />
      {zoneLinks.length > 0 && <ZoneLinks links={zoneLinks} headingId={`${anchor}-zone-links`} />}
    </div>
  )
}
