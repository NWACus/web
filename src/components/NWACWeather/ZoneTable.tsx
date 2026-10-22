/**
 * One zone's forecast: its sensible weather, then one table by 12h period (6h snow level and wind
 * inside), or on a phone a tab per date of labeled cards.
 */
import type {
  NWACWeatherBlock,
  NWACWeatherIssuance,
  NWACWeatherPeriod,
  NWACWeatherWindCell,
  NWACWeatherZone,
} from '@/services/nac/model/nwacWeather'
import {
  deriveSnowLevel,
  fmtCalendarDate,
  levelKind,
  periodDateGroups,
  pointSnow,
  sensibleSlots,
  snowRange,
  tempPeriods,
  windBlocks,
  zonePoints,
  zoneSnow,
} from '@/services/nac/nwacWeatherFormat'
import { cn } from '@/utilities/ui'
import type { ReactNode } from 'react'

import { DayTabs } from './DayTabs.client'
import {
  DayNightDate,
  SnowLevelValue,
  SnowValue,
  TempValue,
  WindValue,
  ZoneKey,
  snowFill,
} from './Values'

const HEAD = 'border-b border-l p-2 text-center font-semibold'
// The right border is the line between the labels and the cells, whatever the cells draw.
const ROW_LABEL = 'border-r border-t p-2 pl-3 text-left align-middle font-semibold'
/** A row's unit, always in parentheses: "Snow (in)", "5000' Temperatures (°F)". */
const Unit = ({ children }: { children: string }) => (
  <span className="font-normal text-muted-foreground"> ({children})</span>
)

interface PeriodView {
  period: NWACWeatherPeriod
  label: string
  night: boolean
  blocks: BlockView[]
}
interface BlockView {
  block: NWACWeatherBlock
  level: number | null
  snow: boolean
  wind: NWACWeatherWindCell | undefined
}

/** Periods with their 6h blocks; a period the wire gives no blocks still takes one column. */
function periodViews(issuance: NWACWeatherIssuance, zone: NWACWeatherZone): PeriodView[] {
  const levels = issuance.blocks.map((b) => {
    const cell = issuance.snowLevel[zone.id]?.[b.key]
    return deriveSnowLevel(cell?.freezing)
  })
  const blocks = issuance.blocks.map((block, i) => ({
    block,
    level: levels[i],
    snow: levelKind(issuance, zone.id, block) === 'snow',
    wind: issuance.wind[zone.id]?.[block.key],
  }))
  return issuance.periods.map((period) => ({
    period,
    night: period.kind === 'night',
    label: fmtCalendarDate(period.date),
    blocks: blocks.filter((b) => b.block.period === period.key),
  }))
}

/** A snow row's cells and their fills, each period's amount worked out once. */
function snowCells(periods: PeriodView[], snowOf: (periodKey: string) => number | null) {
  const snow = new Map(periods.map((p) => [p.period.key, snowOf(p.period.key)]))
  const of = (p: PeriodView) => snow.get(p.period.key) ?? null
  return {
    cell: (p: PeriodView) => <SnowAmount snow={of(p)} />,
    fill: (p: PeriodView) => snowFill(of(p)),
  }
}

/** A snow amount as its public range; `chip` carries the snow fill itself, off a table cell. */
function SnowAmount({ snow, chip = false }: { snow: number | null; chip?: boolean }) {
  const value = <SnowValue text={snowRange(snow)} some={snow != null && snow > 0} />
  const fill = chip ? snowFill(snow) : undefined
  return fill ? <span className={cn('rounded px-1.5 py-0.5', fill)}>{value}</span> : value
}

/**
 * The points behind a zone's snow, when there is more than one: the zone row is their mean in a
 * public range, so each point's own amount sits beneath it.
 */
function snowPoints(issuance: NWACWeatherIssuance, zone: NWACWeatherZone) {
  const points = zonePoints(issuance, zone.id)
  return points.length > 1 ? points : []
}

/** The zone's sensible weather, one card per day it has text for. */
function SensibleCards({
  issuance,
  zone,
}: {
  issuance: NWACWeatherIssuance
  zone: NWACWeatherZone
}) {
  const sensible = issuance.sensible[zone.id] ?? {}
  const cards = sensibleSlots(issuance)
    .map((slot) => ({ ...slot, text: sensible[slot.key]?.trim() }))
    .filter((c) => c.text)
  if (cards.length === 0) return null
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cards.map((c) => (
        <section key={c.key} className="space-y-1">
          <div className="flex items-baseline gap-2">
            <h4 className="font-semibold">{c.label}</h4>
            {c.date && (
              <span className="text-muted-foreground">
                <span aria-hidden="true">· </span>
                {fmtCalendarDate(c.date)}
              </span>
            )}
          </div>
          <p className="whitespace-pre-line">{c.text}</p>
        </section>
      ))}
    </div>
  )
}

function PeriodHead({ periods }: { periods: PeriodView[] }) {
  return (
    <thead className="bg-muted">
      <tr>
        <td className="border-b border-r" />
        {periods.map((p) => (
          <th key={p.period.key} scope="col" className={cn(HEAD, 'border-b')}>
            <DayNightDate date={p.label} night={p.night} />
          </th>
        ))}
      </tr>
    </thead>
  )
}

/**
 * How many of `items` lead up to the last one `has` is true for: the rest are past what the
 * forecaster covers (temps and wind run fewer periods than snow levels). All of them when none is.
 */
function coveredCount<T>(items: T[], has: (item: T) => boolean): number {
  let count = 0
  items.forEach((item, i) => {
    if (has(item)) count = i + 1
  })
  return count || items.length
}

/** The hatch that marks what is past the forecast's coverage. */
const HATCH =
  'bg-[repeating-linear-gradient(135deg,transparent_0,transparent_6px,var(--border)_6px,var(--border)_8px)]'

/** How far temps (in periods) and wind (in blocks, and in the periods holding them) run. */
function coverage(issuance: NWACWeatherIssuance, periods: PeriodView[]) {
  const temps = new Set(tempPeriods(issuance).map((p) => p.key))
  const winds = new Set(windBlocks(issuance).map((b) => b.key))
  const blocks = periods.flatMap((p) => p.blocks)
  return {
    temps: coveredCount(periods, (p) => temps.has(p.period.key)),
    winds: coveredCount(blocks, (b) => winds.has(b.block.key)),
    windPeriods: coveredCount(periods, (p) => p.blocks.some((b) => winds.has(b.block.key))),
  }
}

/**
 * The cells past a row's coverage, as one: hatched and labelled, so they read as outside the
 * forecast rather than as values left blank (which show "—").
 */
function NotCovered({ colSpan }: { colSpan: number }) {
  if (colSpan === 0) return null
  return (
    <td
      colSpan={colSpan}
      className={cn(
        'border-l border-t p-2 text-center text-xs italic text-muted-foreground',
        HATCH,
      )}
    >
      No forecast
    </td>
  )
}

/** One cell per 12h period; `covered` periods, then NotCovered. */
function PeriodRow({
  label,
  unit,
  periods,
  cell,
  fill,
  covered = periods.length,
  sub = false,
}: {
  label: string
  unit?: string
  periods: PeriodView[]
  cell: (p: PeriodView) => ReactNode
  /** A cell's background (the snow fills). */
  fill?: (p: PeriodView) => string | undefined
  covered?: number
  /** A point under the zone's row: indented, lighter and not bold. */
  sub?: boolean
}) {
  return (
    <tr className={cn(sub && 'text-muted-foreground')}>
      <th scope="row" className={cn(ROW_LABEL, sub && 'pl-6 font-normal')}>
        {label}
        {unit && <Unit>{unit}</Unit>}
      </th>
      {periods.slice(0, covered).map((p) => (
        <td key={p.period.key} className={cn('border-l border-t p-2 text-center', fill?.(p))}>
          {cell(p)}
        </td>
      ))}
      <NotCovered colSpan={periods.length - covered} />
    </tr>
  )
}

const PART_SHORT: Record<string, string> = {
  Evening: 'Eve',
  Night: 'Night',
  Morning: 'AM',
  Afternoon: 'PM',
}

/**
 * A 12h cell's two 6h values, one per line with its part of day: how snow level and wind sit in
 * a table whose columns are all 12h periods, so no part-of-day header is needed.
 */
function BlockPair({ blocks, value }: { blocks: BlockView[]; value: (b: BlockView) => ReactNode }) {
  return (
    <div className="space-y-1">
      {blocks.map((b) => (
        <div key={b.block.key} className="grid grid-cols-[2.75rem_1fr] items-center gap-2">
          <span className="text-right text-xs text-muted-foreground">
            {PART_SHORT[b.block.part] ?? b.block.part}
          </span>
          {/* Every line the height of a snow-level pill, so wind lines space the same; a grid cell
              stretches its value, which centres it as the pills' text is. */}
          <div className="grid min-h-7 items-center">{value(b)}</div>
        </div>
      ))}
    </div>
  )
}

/** The keys of the 6h blocks after the first `count`: the ones a value isn't forecast for. */
function blocksPast(periods: PeriodView[], count: number) {
  return new Set(
    periods
      .flatMap((p) => p.blocks)
      .slice(count)
      .map((b) => b.block.key),
  )
}

/**
 * The zone's table from `md` up and on paper, one column per 12h period; temps and wind past
 * their coverage read as not forecast.
 */
function PeriodTable({
  issuance,
  zone,
  periods,
}: {
  issuance: NWACWeatherIssuance
  zone: NWACWeatherZone
  periods: PeriodView[]
}) {
  const covered = coverage(issuance, periods)
  const windOut = blocksPast(periods, covered.winds)
  return (
    <div className="hidden overflow-hidden rounded-md border md:block print:block">
      <table className="w-full table-fixed border-collapse text-sm">
        <colgroup>
          <col className="w-48" />
          {periods.map((p) => (
            <col key={p.period.key} />
          ))}
        </colgroup>
        <PeriodHead periods={periods} />
        <tbody>
          <PeriodRow
            label="Snow"
            unit="in"
            periods={periods}
            {...snowCells(periods, (key) => zoneSnow(issuance, zone.id, key))}
          />
          {snowPoints(issuance, zone).map((point) => (
            <PeriodRow
              key={point.code}
              label={point.name}
              periods={periods}
              sub
              {...snowCells(periods, (key) => pointSnow(issuance, point.code, key))}
            />
          ))}
          <PeriodRow
            label="Snow level"
            unit="ft"
            periods={periods}
            cell={(p) => (
              <BlockPair
                blocks={p.blocks}
                value={(b) => <SnowLevelValue level={b.level} snow={b.snow} />}
              />
            )}
          />
          <PeriodRow
            label="5000' Temperatures"
            unit="°F"
            periods={periods}
            covered={covered.temps}
            cell={(p) => <TempValue cell={issuance.temp[zone.id]?.[p.period.key]} />}
          />
          <PeriodRow
            label="Ridge wind"
            unit="mph"
            periods={periods}
            covered={covered.windPeriods}
            cell={(p) => (
              <BlockPair
                blocks={p.blocks}
                value={(b) => (windOut.has(b.block.key) ? null : <WindValue cell={b.wind} />)}
              />
            )}
          />
        </tbody>
      </table>
    </div>
  )
}

/** A small hatched label in place of a temperature past the forecast's coverage, on a phone. */
function NotCoveredChip() {
  return (
    <span className={cn(HATCH, 'rounded px-1.5 py-0.5 text-xs italic text-muted-foreground')}>
      No forecast
    </span>
  )
}

/** One labeled line of a phone card: the name on the left, the value on the right. */
function CardLine({
  label,
  unit,
  sub = false,
  children,
}: {
  label: string
  unit?: string
  /** A point under the zone's snow: indented and lighter. */
  sub?: boolean
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-3 py-2',
        sub && 'pl-6 text-muted-foreground',
      )}
    >
      <dt className={cn(!sub && 'font-semibold')}>
        {label}
        {unit && <Unit>{unit}</Unit>}
      </dt>
      <dd className="text-right">{children}</dd>
    </div>
  )
}

/** A phone card's labeled lines: the zone's snow, each point's under it, the temps. */
function CardSummary({
  issuance,
  zone,
  p,
  tempOut,
}: {
  issuance: NWACWeatherIssuance
  zone: NWACWeatherZone
  p: PeriodView
  tempOut: boolean
}) {
  const temp = tempOut ? (
    <NotCoveredChip />
  ) : (
    <TempValue cell={issuance.temp[zone.id]?.[p.period.key]} />
  )
  return (
    <dl className="divide-y border-t">
      <CardLine label="Snow" unit="in">
        <SnowAmount snow={zoneSnow(issuance, zone.id, p.period.key)} chip />
      </CardLine>
      {snowPoints(issuance, zone).map((point) => (
        <CardLine key={point.code} label={point.name} sub>
          <SnowAmount snow={pointSnow(issuance, point.code, p.period.key)} chip />
        </CardLine>
      ))}
      <CardLine label="5000' Temperatures" unit="°F">
        {temp}
      </CardLine>
    </dl>
  )
}

const CARD_HEAD = 'whitespace-nowrap px-3 py-2 text-left font-normal'

function CardBlocksHead({ showWind }: { showWind: boolean }) {
  return (
    <thead className="bg-muted/50 text-xs text-muted-foreground">
      <tr>
        <td className="border-r" />
        <th scope="col" className={CARD_HEAD}>
          Snow level <Unit>ft</Unit>
        </th>
        {showWind ? (
          <th scope="col" className={CARD_HEAD}>
            Ridge wind <Unit>mph</Unit>
          </th>
        ) : (
          <td />
        )}
      </tr>
    </thead>
  )
}

function CardBlockRow({ b, wind }: { b: BlockView; wind: boolean }) {
  return (
    <tr className="border-t">
      <th scope="row" className="border-r px-3 py-2 text-left font-normal text-muted-foreground">
        {b.block.part}
      </th>
      <td className="px-3 py-1.5">
        <SnowLevelValue level={b.level} snow={b.snow} />
      </td>
      <td className="px-3 py-2">{wind && <WindValue cell={b.wind} />}</td>
    </tr>
  )
}

/**
 * A phone card's 6h blocks: the snow level and ridgeline wind by part of day, in three equal
 * columns. Wind runs fewer periods than the snow level; past that its column stays empty.
 */
function CardBlocks({ p, windOut }: { p: PeriodView; windOut: Set<string> }) {
  const showWind = p.blocks.some((b) => !windOut.has(b.block.key))
  return (
    <table className="w-full table-fixed border-collapse border-t">
      <CardBlocksHead showWind={showWind} />
      <tbody>
        {p.blocks.map((b) => (
          <CardBlockRow key={b.block.key} b={b} wind={!windOut.has(b.block.key)} />
        ))}
      </tbody>
    </table>
  )
}

/** One 12h period on a phone, every value labeled. */
function PeriodCard({
  issuance,
  zone,
  p,
  tempOut,
  windOut,
}: {
  issuance: NWACWeatherIssuance
  zone: NWACWeatherZone
  p: PeriodView
  /** Past the temps' coverage. */
  tempOut: boolean
  /** The block keys past the wind's coverage. */
  windOut: Set<string>
}) {
  return (
    <section className="overflow-hidden rounded-lg border text-sm">
      <h4 className="flex items-center gap-2 bg-muted px-3 py-2 text-base font-semibold">
        <DayNightDate date={null} night={p.night} label={false} />
        {p.night ? 'Night' : 'Day'}
      </h4>
      <CardSummary issuance={issuance} zone={zone} p={p} tempOut={tempOut} />
      <CardBlocks p={p} windOut={windOut} />
    </section>
  )
}

/** The phone layout, in place of the table: a tab per date of that date's period cards. */
function PeriodCards({
  issuance,
  zone,
  periods,
}: {
  issuance: NWACWeatherIssuance
  zone: NWACWeatherZone
  periods: PeriodView[]
}) {
  const covered = coverage(issuance, periods)
  const windOut = blocksPast(periods, covered.winds)
  const card = (p: PeriodView) => (
    <PeriodCard
      key={p.period.key}
      issuance={issuance}
      zone={zone}
      p={p}
      tempOut={periods.indexOf(p) >= covered.temps}
      windOut={windOut}
    />
  )
  const days = periodDateGroups(issuance.periods).map(({ date }) => {
    const [dow, ...rest] = fmtCalendarDate(date).split(' ')
    return {
      key: date,
      dow,
      date: rest.join(' '),
      content: periods.filter((p) => p.period.date === date).map(card),
    }
  })
  return (
    <div className="md:hidden print:hidden">
      <DayTabs days={days} />
    </div>
  )
}

export function ZoneTable({
  issuance,
  zone,
  heading = true,
}: {
  issuance: NWACWeatherIssuance
  zone: NWACWeatherZone
  /** The zone's name as a heading; off when the page already names the zone. */
  heading?: boolean
}) {
  const periods = periodViews(issuance, zone)
  return (
    <section aria-label={zone.name} className="space-y-4">
      {heading && <h3 className="text-lg font-semibold">{zone.name}</h3>}
      <SensibleCards issuance={issuance} zone={zone} />
      <div className="space-y-2">
        <PeriodTable issuance={issuance} zone={zone} periods={periods} />
        <PeriodCards issuance={issuance} zone={zone} periods={periods} />
        <ZoneKey />
      </div>
    </section>
  )
}
