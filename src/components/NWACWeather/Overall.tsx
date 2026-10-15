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
  SENSIBLE_SLOTS,
  blockDate,
  deriveSnow,
  deriveSnowLevel,
  fmtCalendarDate,
  fmtQpf,
  fmtSnowAmount,
  periodDateGroups,
  precipPeriods,
  snowLevelBlocks,
  snowLevelTones,
  tempPeriods,
  windBlocks,
} from '@/services/nac/nwacWeatherFormat'
import { cn } from '@/utilities/ui'

import { SectionTabs, type SectionLink } from './SectionTabs.client'
import { DayNightDate, LevelValue, SnowValue, TempValue, WindValue } from './Values'
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
   * A third header row under the sub-label, for a period split into several values ("WE",
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
  /** Beside the title, bottom-aligned: what the shading means. */
  legend?: ReactNode
}

/** Avalanche zone id → the path of that zone's forecast page. */
export type ZonePaths = Record<number, string>

const STICKY = 'sticky left-0 z-10'

// The wording of the info bubbles on NWAC's legacy Mountain Weather Forecast page.
const PRECIP_DETAIL = [
  'Water Equivalent (WE) is the liquid water equivalent of all precipitation types; rain, snow, ice pellets, etc., forecast to the hundredth of an inch at specific locations. To use WE as a proxy for snowfall amounts, start with a snow to water ratio of 10:1 (10 inches of snow = 1 inch WE). Temperatures at or near freezing will generally have a lower ratio (heavy wet snow) and very cold temperatures can have a much higher ratio (dry fluffy snow).',
  'The label LT, is shorthand for ‘less than’.',
]
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
      id: 'snow-level',
      nav: 'Snow & freezing level',
      title: 'Snow and Freezing Level',
      unit: 'ft',
      note: 'Where rain turns to snow. Darker is higher.',
      detail: SNOW_LEVEL_DETAIL,
      rowLabel: 'Zone',
      columns: levelBlocks.map((b) => blockColumn(issuance, b)),
      groups: flat(zoneRows((id) => levelsByZone.get(id) ?? [])),
      filled: true,
    },
    {
      id: 'temps',
      nav: "5000' temps",
      title: "5000' Temperatures",
      unit: '°F',
      note: 'High / low.',
      detail: TEMPS_DETAIL,
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
      note: 'Arrows point the way the wind blows.',
      detail: WIND_DETAIL,
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

/** Snow fills, deepening with the amount; none under half an inch. */
const SNOW_FILLS = ['bg-blue-50', 'bg-blue-100', 'bg-blue-200', 'bg-blue-300']
const SNOW_FILL_LEGEND = ['1–3"', '3–6"', '6–10"', '10"+']

function snowFill(snow: number | null): string | undefined {
  if (snow == null || snow < 0.5) return undefined
  if (snow <= 3) return SNOW_FILLS[0]
  if (snow <= 6) return SNOW_FILLS[1]
  if (snow <= 10) return SNOW_FILLS[2]
  return SNOW_FILLS[3]
}

/** The sum of the values given, or null when there are none. */
function sumOf(values: (number | null | undefined)[]): number | null {
  const known = values.filter((v): v is number => v != null)
  return known.length ? known.reduce((a, b) => a + b, 0) : null
}

/** One period's (or the total's) water equivalent then snow, the pair shaded by the snow. */
function precipSnowPair(qpf: number | null | undefined, snow: number | null, shade: boolean) {
  const some = snow != null && snow >= 0.5
  // A dry period reads as one muted 0, not two.
  const dry = qpf != null && qpf <= 0 && !some
  const fill = shade ? snowFill(snow) : undefined
  return {
    cells: [
      <span key="we" className="tabular-nums text-muted-foreground">
        {dry ? '' : fmtQpf(qpf)}
      </span>,
      <SnowValue key="snow" text={fmtSnowAmount(snow)} some={some} />,
    ],
    fills: [fill, fill],
  }
}

function SnowFillLegend() {
  return (
    <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      Fill deepens with snow:
      {SNOW_FILL_LEGEND.map((label, i) => (
        <span
          key={label}
          className={cn('rounded-sm border px-2 py-0.5 text-foreground', SNOW_FILLS[i])}
        >
          {label}
        </span>
      ))}
    </p>
  )
}

/**
 * Water equivalent and the new snow it makes, by station, the stations grouped under their zones:
 * each period split in two, then the whole window's total.
 */
function precipSnowTable(issuance: NWACWeatherIssuance): Table {
  const periods = precipPeriods(issuance)
  const row = (p: NWACWeatherIssuance['points'][number]): Row => {
    const cells = periods.map((period) => issuance.precip[p.code]?.[period.key])
    const snows = cells.map((c) => deriveSnow(c?.qpf, c?.density))
    const pairs = [
      ...cells.map((c, i) => precipSnowPair(c?.qpf, snows[i], true)),
      precipSnowPair(sumOf(cells.map((c) => c?.qpf)), sumOf(snows), false),
    ]
    return {
      key: p.code,
      label: p.name,
      cells: pairs.flatMap((pair) => pair.cells),
      fills: pairs.flatMap((pair) => pair.fills),
    }
  }
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
  const split = (column: Column): Column[] =>
    ['WE', 'Snow'].map((part) => ({
      ...column,
      key: `${column.key}-${part}`,
      part,
      split: column.key,
    }))
  return {
    id: 'precip-snow',
    nav: 'Precipitation & snow',
    title: 'Precipitation and Snow',
    unit: 'in',
    note: 'Water Equivalent (WE) and new snow by station. Total is the whole forecast window.',
    detail: PRECIP_DETAIL,
    legend: <SnowFillLegend />,
    rowLabel: 'Station',
    groupColumn: 'Zone',
    columns: [
      ...periods.map(periodColumn).flatMap(split),
      ...split({ key: 'total', date: 'Total', sub: null, group: 'total', total: true }),
    ],
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
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <Heading
          id={headingId}
          className={cn('scroll-mt-24 font-semibold', Heading === 'h4' ? 'text-base' : 'text-lg')}
        >
          {t.title}
          {t.unit && (
            <span className="text-base font-normal text-muted-foreground"> ({t.unit})</span>
          )}
        </Heading>
        {t.legend}
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
/** A split table's value column, half a period: room for "LT 0.10". */
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
    <div className="grid gap-8 xl:grid-cols-2 xl:items-start">
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
  const dates = periodDateGroups(issuance.periods)
  // An afternoon issuance's first date is only its night, so "Today / Tonight" reads "Tonight".
  const firstIsNight = issuance.periods
    .filter((p) => p.date === dates[0]?.date)
    .every((p) => p.kind === 'night')
  const days: SensibleDay[] = SENSIBLE_SLOTS.map((s, i) => ({
    key: s.key,
    label: i === 0 && firstIsNight ? 'Tonight' : s.label,
    date: dates[i] ? fmtCalendarDate(dates[i].date) : null,
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

/** Everything the issuance's card shows, built once for the section tabs and the body. */
export interface OverallParts {
  issuance: NWACWeatherIssuance
  synopsis: string | null
  extended: string | null
  snowLevel: Table
  temps: Table
  wind: Table
  precipSnow: Table
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
    precipSnow: precipSnowTable(issuance),
    ext: extendedTable(issuance),
    sensible: sensibleDays(issuance),
  }
}

function sectionLinks(p: OverallParts): SectionLink[] {
  const hasExtended = !!p.extended || hasContent(p.ext)
  return [
    ...(p.synopsis ? [{ id: 'synopsis', label: 'Synopsis' }] : []),
    ...(p.sensible.rows.length ? [{ id: 'sensible', label: 'Weather summary' }] : []),
    ...[p.precipSnow, p.snowLevel, p.temps, p.wind]
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
  const { issuance, synopsis, extended, snowLevel, temps, wind, sensible, precipSnow, ext } = parts
  // Section anchors read `#afternoon-snow-level`: a date has at most one issuance of each type.
  const anchor = issuance.type
  const tempsOrWind = hasContent(temps) || hasContent(wind)
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
      <MaybeTable table={precipSnow} anchor={anchor} />
      <MaybeTable table={snowLevel} anchor={anchor} />
      {tempsOrWind && (
        <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <MaybeTable table={temps} anchor={anchor} />
          <MaybeTable table={wind} anchor={anchor} />
        </div>
      )}
      <ExtendedSection anchor={anchor} extended={extended} table={ext} />
      {zoneLinks.length > 0 && <ZoneLinks links={zoneLinks} />}
    </div>
  )
}
