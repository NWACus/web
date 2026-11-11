/**
 * One zone's weather beside an avalanche forecast, for the 24 hours on show: its sensible weather,
 * then a short table by 12h period (6h snow level and wind inside), or on a phone a labeled card
 * per period. Precipitation and snow are each forecast point's, named, as the MWF gives them.
 */
import type {
  NWACWeatherBlock,
  NWACWeatherIssuance,
  NWACWeatherPeriod,
  NWACWeatherPoint,
  NWACWeatherWindCell,
  NWACWeatherZone,
} from '@/services/nac/model/nwacWeather'
import {
  DASH,
  deriveSnowLevel,
  fmtCalendarDate,
  fmtQpf,
  levelKind,
  pointSnow,
  precipHours,
  sensibleSlotFor,
  snowRange,
  tempPeriods,
  windBlocks,
  zonePoints,
} from '@/services/nac/nwacWeatherFormat'
import { cn } from '@/utilities/ui'
import type { ReactNode } from 'react'

import {
  DayNightDate,
  SnowLevelValue,
  SnowValue,
  TempValue,
  WindValue,
  ZoneKeys,
  snowFill,
  windFill,
} from './Values'

const HEAD = 'border-b border-l p-2 text-center font-semibold'
// The right border is the line between the labels and the cells, whatever the cells draw.
const ROW_LABEL = 'border-r border-t p-2 pl-3 text-left align-middle font-semibold'
/** A row's unit, always in parentheses: "Snow (in)", "5000' Temperatures (°F)". */
const Unit = ({ children }: { children: string }) => (
  <span className="font-normal text-muted-foreground"> ({children})</span>
)
/** The forecast point a precipitation or snow row is for: "Snow (in): Paradise". */
const Point = ({ children }: { children: string }) => (
  <span className="font-normal">: {children}</span>
)

interface PeriodView {
  period: NWACWeatherPeriod
  /** Today, Tonight or Tomorrow, as the MWF names its half-days. */
  name: string
  label: string
  /** The local hours its precipitation and snow cover. */
  hours: string
  /** The zone's weather summary for the period, if the forecaster wrote one. */
  summary: string | null
  night: boolean
  blocks: BlockView[]
}
interface BlockView {
  block: NWACWeatherBlock
  level: number | null
  snow: boolean
  wind: NWACWeatherWindCell | undefined
}

/** The periods shown, with their 6h blocks; one the wire gives no blocks still takes a column. */
function periodViews(
  issuance: NWACWeatherIssuance,
  zone: NWACWeatherZone,
  periodKeys: string[],
  timezone: string,
  held: boolean,
): PeriodView[] {
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
  const shown = issuance.periods.filter((p) => periodKeys.includes(p.key))
  const sensible = issuance.sensible[zone.id] ?? {}
  const summaryOf = (periodKey: string) => {
    const slot = sensibleSlotFor(issuance, periodKey)
    return (slot && sensible[slot]?.trim()) || null
  }
  return shown.map((period, i) => ({
    period,
    name: periodName(period, i, held),
    night: period.kind === 'night',
    label: fmtCalendarDate(period.date),
    hours: precipHours(period, timezone),
    summary: summaryOf(period.key),
    blocks: blocks.filter((b) => b.block.period === period.key),
  }))
}

/**
 * The 24 hours on show are Today and Tonight from 6 am, Tonight and Tomorrow from 6 pm: a night is
 * always Tonight, a day Today when it leads and Tomorrow when it follows the night. A past
 * forecast's are plain Day and Night, as its date already says when.
 */
function periodName(period: NWACWeatherPeriod, index: number, held: boolean): string {
  if (held) return period.kind === 'night' ? 'Night' : 'Day'
  if (period.kind === 'night') return 'Tonight'
  return index === 0 ? 'Today' : 'Tomorrow'
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

/** A point's water equivalent for a period. */
function PrecipAmount({
  issuance,
  point,
  periodKey,
}: {
  issuance: NWACWeatherIssuance
  point: NWACWeatherPoint
  periodKey: string
}) {
  return (
    <span className="tabular-nums">{fmtQpf(issuance.precip[point.code]?.[periodKey]?.qpf)}</span>
  )
}

/** A point's precipitation then its snow, under the Precip and Snow headings over them. */
function PrecipSnowPair({ precip, snow }: { precip: ReactNode; snow: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <span>{precip}</span>
      <span>{snow}</span>
    </div>
  )
}

/** Heads the points' rows, as the overview's paired columns are headed: Precip, then Snow. */
function PrecipSnowHead({ periods }: { periods: PeriodView[] }) {
  return (
    <tr className="bg-muted/40">
      <th scope="rowgroup" className={ROW_LABEL}>
        Precipitation &amp; Snow
        <Unit>in</Unit>
      </th>
      {periods.map((p) => (
        <td
          key={p.period.key}
          className="border-l border-t p-1.5 text-center text-xs text-muted-foreground"
        >
          <div className="grid grid-cols-2 gap-2">
            <span>Precip</span>
            <span>
              Snow
              <span className="block text-[11px] text-muted-foreground/70">5000&apos;</span>
            </span>
          </div>
        </td>
      ))}
    </tr>
  )
}

/** A snow amount as its public range; `chip` carries the snow fill itself, off a table cell. */
function SnowAmount({ snow, chip = false }: { snow: number | null; chip?: boolean }) {
  const value = <SnowValue text={snowRange(snow)} some={snow != null && snow > 0} />
  const fill = chip ? snowFill(snow) : undefined
  return fill ? <span className={cn('rounded px-1.5 py-0.5', fill)}>{value}</span> : value
}

function PeriodHead({ periods }: { periods: PeriodView[] }) {
  return (
    <thead className="bg-muted">
      <tr>
        <td className="border-b border-r" />
        {periods.map((p) => (
          <th key={p.period.key} scope="col" className={cn(HEAD, 'border-b')}>
            <span className="block whitespace-nowrap">
              {p.name}
              <span className="font-normal text-muted-foreground">
                {' · '}
                <DayNightDate date={p.label} night={p.night} label={false} />
              </span>
            </span>
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
  point,
  sub = false,
  periods,
  cell,
  fill,
  covered = periods.length,
}: {
  label: string
  unit?: string
  point?: string
  /** One of a heading row's rows: its label indented and plain. */
  sub?: boolean
  periods: PeriodView[]
  cell: (p: PeriodView) => ReactNode
  /** A cell's background (the snow fills). */
  fill?: (p: PeriodView) => string | undefined
  covered?: number
}) {
  return (
    <tr>
      <th scope="row" className={cn(ROW_LABEL, sub && 'pl-6 font-normal')}>
        {label}
        {unit && <Unit>{unit}</Unit>}
        {point && <Point>{point}</Point>}
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
  Morning: 'Morn',
  Afternoon: 'Aft',
}

/**
 * A 12h cell's two 6h values on one line, each after its part of day: how snow level and wind
 * sit in a table whose columns are all 12h periods, so no part-of-day header is needed.
 */
function BlockPair({ blocks, value }: { blocks: BlockView[]; value: (b: BlockView) => ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {blocks.map((b) => (
        <div key={b.block.key} className="flex items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">
            {PART_SHORT[b.block.part] ?? b.block.part}
          </span>
          {/* Fills the rest of its half, which stretches a snow-level pill as it was when stacked;
              every value the pill's height, so wind rows line up the same. */}
          <div className="grid min-h-7 flex-1 items-center">{value(b)}</div>
        </div>
      ))}
    </div>
  )
}

/** A 6h wind on the overview's fill for its strength, a pill like the snow level's. */
function ShadedWind({ b }: { b: BlockView }) {
  return (
    <span className={cn('grid min-h-7 items-center rounded px-1', windFill(b.wind?.speed))}>
      <WindValue cell={b.wind} compact />
    </span>
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
  const points = zonePoints(issuance, zone.id)
  return (
    <div className="hidden overflow-hidden rounded-md border md:block print:block">
      <table className="w-full table-fixed border-collapse text-base">
        <colgroup>
          {/* Narrower below `xl`, its labels wrapping, so the 6h pairs keep their room. */}
          <col className="w-44 xl:w-60" />
          {periods.map((p) => (
            <col key={p.period.key} />
          ))}
        </colgroup>
        <PeriodHead periods={periods} />
        <tbody>
          <PrecipSnowHead periods={periods} />
          {points.map((point) => {
            const snow = snowCells(periods, (key) => pointSnow(issuance, point.code, key))
            return (
              <PeriodRow
                key={point.code}
                label={point.name}
                sub
                periods={periods}
                fill={snow.fill}
                cell={(p) => (
                  <PrecipSnowPair
                    precip={
                      <PrecipAmount issuance={issuance} point={point} periodKey={p.period.key} />
                    }
                    snow={snow.cell(p)}
                  />
                )}
              />
            )
          })}
          <PeriodRow
            label="Snow & Freezing Level"
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
            cell={(p) => <TempValue cell={issuance.temp[zone.id]?.[p.period.key]} labeled />}
          />
          <PeriodRow
            label="Ridgeline Winds"
            unit="mph"
            periods={periods}
            covered={covered.windPeriods}
            cell={(p) => (
              <BlockPair
                blocks={p.blocks}
                value={(b) => (windOut.has(b.block.key) ? null : <ShadedWind b={b} />)}
              />
            )}
          />
          {periods.some((p) => p.summary) && (
            <PeriodRow
              label="Summary"
              periods={periods}
              cell={(p) => <p className="whitespace-pre-line text-left">{p.summary ?? DASH}</p>}
            />
          )}
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
  point,
  children,
}: {
  label: string
  unit?: string
  point?: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <dt className="min-w-0 font-semibold">
        {label}
        {unit && <Unit>{unit}</Unit>}
        {point && <Point>{point}</Point>}
      </dt>
      {/* The values keep to one line; a long label wraps instead. */}
      <dd className="shrink-0 whitespace-nowrap text-right">{children}</dd>
    </div>
  )
}

/** A phone card's labeled lines: each point's precipitation beside its snow, then the temps. */
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
    <TempValue cell={issuance.temp[zone.id]?.[p.period.key]} labeled />
  )
  const points = zonePoints(issuance, zone.id)
  return (
    <dl className="divide-y border-t">
      {points.map((point) => (
        <CardLine key={point.code} label="Precipitation & Snow" unit="in" point={point.name}>
          <span className="inline-flex items-center gap-2">
            <PrecipAmount issuance={issuance} point={point} periodKey={p.period.key} />
            <SnowAmount snow={pointSnow(issuance, point.code, p.period.key)} chip />
            <span className="text-[11px] text-muted-foreground/70">at 5000&apos;</span>
          </span>
        </CardLine>
      ))}
      <CardLine label="5000' Temperatures" unit="°F">
        {temp}
      </CardLine>
    </dl>
  )
}

const CARD_HEAD = 'px-3 py-2 text-left font-normal'

function CardBlocksHead({ showWind }: { showWind: boolean }) {
  return (
    <thead className="bg-muted text-xs text-muted-foreground">
      <tr>
        <td className="border-r" />
        <th scope="col" className={CARD_HEAD}>
          Snow &amp; Freezing Level <Unit>ft</Unit>
        </th>
        {showWind ? (
          <th scope="col" className={CARD_HEAD}>
            Ridgeline Winds <Unit>mph</Unit>
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
      <td className="px-3 py-1.5">{wind && <ShadedWind b={b} />}</td>
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
        {p.name}
        <span className="font-normal text-muted-foreground">{p.label}</span>
      </h4>
      <p className="border-t px-3 py-1.5 text-xs text-muted-foreground">
        Precipitation &amp; Snow: {p.hours}
      </p>
      <CardSummary issuance={issuance} zone={zone} p={p} tempOut={tempOut} />
      <CardBlocks p={p} windOut={windOut} />
      {p.summary && <p className="whitespace-pre-line border-t px-3 py-2">{p.summary}</p>}
    </section>
  )
}

/** The phone layout, in place of the table: a card per period. */
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
  return (
    <div className="space-y-3 md:hidden print:hidden">
      {periods.map((p, i) => (
        <PeriodCard
          key={p.period.key}
          issuance={issuance}
          zone={zone}
          p={p}
          tempOut={i >= covered.temps}
          windOut={windOut}
        />
      ))}
    </div>
  )
}

/** NWAC's, for a caller that doesn't know the center's. */
const DEFAULT_TIMEZONE = 'America/Los_Angeles'

export function ZoneTable({
  issuance,
  zone,
  periodKeys,
  held = false,
  timezone,
  heading = true,
}: {
  issuance: NWACWeatherIssuance
  zone: NWACWeatherZone
  timezone?: string | null
  /** The periods to show: the 24 hours on show. */
  periodKeys: string[]
  /** A past forecast's 24 hours: Day and Night rather than Today, Tonight and Tomorrow. */
  held?: boolean
  /** The zone's name as a heading; off when the page already names the zone. */
  heading?: boolean
}) {
  const periods = periodViews(issuance, zone, periodKeys, timezone ?? DEFAULT_TIMEZONE, held)
  return (
    <section aria-label={zone.name} className="space-y-4">
      {heading && <h3 className="text-lg font-semibold">{zone.name}</h3>}
      <div className="space-y-2">
        <PeriodTable issuance={issuance} zone={zone} periods={periods} />
        <PeriodCards issuance={issuance} zone={zone} periods={periods} />
        <ZoneKeys />
      </div>
    </section>
  )
}
