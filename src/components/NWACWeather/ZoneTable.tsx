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
  sensibleSlotFor,
  snowRange,
  snowTier,
  tempPeriods,
  windBlocks,
  zonePoints,
} from '@/services/nac/nwacWeatherFormat'
import { cn } from '@/utilities/ui'
import { MapPin } from 'lucide-react'
import type { ReactNode } from 'react'

import { CardKeys, KeyButton, KeyRow } from './CardKeys.client'
import {
  DayNightDate,
  SnowLevelValue,
  SnowValue,
  TempValue,
  WindValue,
  ZoneKeys,
  levelFill,
  levelStep,
  snowFill,
  windFill,
  windStep,
} from './Values'

const HEAD = 'border-b border-l p-2 text-center font-semibold'
// The right border is the line between the labels and the cells, whatever the cells draw.
const ROW_LABEL = 'border-r border-t p-2 pl-3 text-left align-middle font-semibold'
/** A row's unit, always in parentheses: "Snow (in)", "Temperatures @ 5000' (°F)". */
const Unit = ({ children }: { children: string }) => (
  <span className="font-normal text-muted-foreground"> ({children})</span>
)

interface PeriodView {
  period: NWACWeatherPeriod
  /** Today, Tonight or Tomorrow, as the MWF names its half-days. */
  name: string
  label: string
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
    <div className="grid grid-cols-2 items-center gap-2">
      <span>{precip}</span>
      <span>{snow}</span>
    </div>
  )
}

/** A sub-head row: muted, its pair of heads per period in the two halves of each cell. */
const SUB_HEAD_CELL = 'border-l border-t p-1.5 text-center text-xs text-muted-foreground'

/** Heads the stations' rows, as the phone card does: Station, then Precip and Snow by period. */
function PrecipSnowHead({ periods }: { periods: PeriodView[] }) {
  return (
    <tr className="bg-muted">
      <th scope="rowgroup" className={cn(ROW_LABEL, 'text-sm font-normal text-muted-foreground')}>
        Station
      </th>
      {periods.map((p) => (
        <td key={p.period.key} className={SUB_HEAD_CELL}>
          <div className="grid grid-cols-2 gap-2">
            <span>
              Precip
              <span className="block">(in)</span>
            </span>
            <span>
              Snow @ 5000&apos;
              <span className="block">(in)</span>
            </span>
          </div>
        </td>
      ))}
    </tr>
  )
}

/** A snow amount as its public range; its cell carries the fill. */
function SnowAmount({ snow }: { snow: number | null }) {
  return <SnowValue text={snowRange(snow)} some={snow != null && snow > 0} />
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
  pin = false,
  divide = false,
  flush = false,
  periods,
  cell,
  fill,
  covered = periods.length,
}: {
  label: string
  unit?: string
  /** A station's row: its name plain, after a pin. */
  pin?: boolean
  /** A heavier line above, where the stations end and the zone-wide rows begin. */
  divide?: boolean
  /** Cells without padding, for values that fill their own halves edge to edge. */
  flush?: boolean
  periods: PeriodView[]
  cell: (p: PeriodView) => ReactNode
  /** A cell's background across its whole width (the snow fills). */
  fill?: (p: PeriodView) => string | undefined
  covered?: number
}) {
  return (
    <tr className={cn(divide && '[&>*]:border-t-2')}>
      <th scope="row" className={cn(ROW_LABEL, pin && 'font-normal')}>
        {pin ? (
          <span className="flex items-start gap-1.5">
            <MapPin aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted-foreground" />
            {label}
          </span>
        ) : (
          label
        )}
        {unit && <Unit>{unit}</Unit>}
      </th>
      {periods.slice(0, covered).map((p) => (
        <td
          key={p.period.key}
          className={cn('border-l border-t text-center', flush ? 'h-px p-0' : 'p-2', fill?.(p))}
        >
          {cell(p)}
        </td>
      ))}
      <NotCovered colSpan={periods.length - covered} />
    </tr>
  )
}

/** Heads the 6h rows: each period's parts of day over the two halves of its cell. */
function BlockHead({ periods }: { periods: PeriodView[] }) {
  return (
    <tr className="bg-muted">
      <td className="border-r border-t" />
      {periods.map((p) => (
        <th key={p.period.key} scope="col" className={cn(SUB_HEAD_CELL, 'font-normal')}>
          <div className="grid grid-cols-2 gap-2">
            {p.blocks.map((b) => (
              <span key={b.block.key}>{b.block.part}</span>
            ))}
          </div>
        </th>
      ))}
    </tr>
  )
}

/**
 * A 12h cell's two 6h values side by side, under BlockHead's parts of day, each half filled edge
 * to edge; its row's cells drop their padding (`flush`) so the fills meet the borders.
 */
function BlockPair({
  blocks,
  value,
  fill,
}: {
  blocks: BlockView[]
  value: (b: BlockView) => ReactNode
  fill: (b: BlockView) => string | undefined
}) {
  return (
    <div className="grid h-full grid-cols-2">
      {blocks.map((b, i) => (
        <div
          key={b.block.key}
          className={cn('grid min-h-11 items-center p-2', i > 0 && 'border-l', fill(b))}
        >
          {value(b)}
        </div>
      ))}
    </div>
  )
}

const levelCellFill = (b: BlockView) => (b.level == null ? undefined : levelFill(b.level))

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
          {points.map((point) => (
            <PeriodRow
              key={point.code}
              label={point.name}
              pin
              periods={periods}
              fill={(p) => snowFill(pointSnow(issuance, point.code, p.period.key))}
              cell={(p) => (
                <PrecipSnowPair
                  precip={
                    <PrecipAmount issuance={issuance} point={point} periodKey={p.period.key} />
                  }
                  snow={<SnowAmount snow={pointSnow(issuance, point.code, p.period.key)} />}
                />
              )}
            />
          ))}
          <PeriodRow
            label="Temperatures @ 5000'"
            unit="°F"
            divide
            periods={periods}
            covered={covered.temps}
            cell={(p) => <TempValue cell={issuance.temp[zone.id]?.[p.period.key]} />}
          />
          <BlockHead periods={periods} />
          <PeriodRow
            label="Snow level"
            unit="ft"
            periods={periods}
            flush
            cell={(p) => (
              <BlockPair
                blocks={p.blocks}
                fill={levelCellFill}
                value={(b) => (
                  <SnowLevelValue level={b.level} snow={b.snow} pill={false} tight={false} />
                )}
              />
            )}
          />
          <PeriodRow
            label="Ridge wind"
            unit="mph"
            periods={periods}
            covered={covered.windPeriods}
            flush
            cell={(p) => (
              <BlockPair
                blocks={p.blocks}
                fill={(b) => (windOut.has(b.block.key) ? undefined : windFill(b.wind?.speed))}
                value={(b) =>
                  windOut.has(b.block.key) ? null : <WindValue cell={b.wind} compact />
                }
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

const CARD_LABEL = 'border-t px-3 py-2 text-left align-middle'
const CARD_CELL = 'border-t px-2 py-1.5 text-center align-middle'
const CARD_HEAD =
  'border-t bg-muted px-2 py-1.5 text-center text-xs font-normal text-muted-foreground'

/** A row of column heads, with a head over the row labels when they need one. */
function CardHeads({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <tr>
      {label ? (
        <th scope="col" className={cn(CARD_HEAD, 'pl-3 text-left')}>
          {label}
        </th>
      ) : (
        <td className="border-t bg-muted" />
      )}
      {children}
    </tr>
  )
}

/** A point's snow; tapping it opens the snow key at its step. */
function CardSnow({ snow }: { snow: number | null }) {
  const step = snowTier(snow)
  const value = <SnowAmount snow={snow} />
  if (step == null) return value
  return (
    <KeyButton kind="snow" hit={step}>
      {value}
    </KeyButton>
  )
}

/**
 * One 12h period on a phone: a single grid with what's measured down the left. The 12h values
 * (each point's precip and snow, then temps) span the period; snow level and wind sit under its 6h
 * parts. Each row's key opens under it.
 */
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
  const points = zonePoints(issuance, zone.id)
  const showWind = p.blocks.some((b) => !windOut.has(b.block.key))
  return (
    <section className="overflow-hidden rounded-lg border text-sm">
      <h4 className="flex items-center gap-2 bg-muted px-3 py-2 text-base font-semibold">
        <DayNightDate date={null} night={p.night} label={false} />
        {p.name}
        <span className="font-normal text-muted-foreground">{p.label}</span>
      </h4>
      <CardKeys>
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[40%]" />
            <col className="w-[30%]" />
            <col className="w-[30%]" />
          </colgroup>
          <tbody>
            {points.length > 0 && (
              <CardHeads label="Station">
                <th scope="col" className={CARD_HEAD}>
                  Precip
                  <span className="block">(in)</span>
                </th>
                <th scope="col" className={CARD_HEAD}>
                  <KeyButton kind="snow" unit="in" unitBelow className="font-normal">
                    Snow @ 5000&apos;
                  </KeyButton>
                </th>
              </CardHeads>
            )}
            {points.map((point) => (
              <tr key={point.code}>
                <th scope="row" className={cn(CARD_LABEL, 'font-normal')}>
                  <span className="flex items-start gap-1">
                    <MapPin
                      aria-hidden="true"
                      className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                    />
                    {point.name}
                  </span>
                </th>
                <td className={CARD_CELL}>
                  <PrecipAmount issuance={issuance} point={point} periodKey={p.period.key} />
                </td>
                <td
                  className={cn(CARD_CELL, snowFill(pointSnow(issuance, point.code, p.period.key)))}
                >
                  <CardSnow snow={pointSnow(issuance, point.code, p.period.key)} />
                </td>
              </tr>
            ))}
            <KeyRow kind="snow" colSpan={3} />
            {/* A heavier line where the stations end and the zone-wide rows begin. */}
            <tr className="[&>*]:border-t-2">
              <th scope="row" className={cn(CARD_LABEL, 'font-semibold')}>
                Temperatures @ 5000&apos;<Unit>°F</Unit>
              </th>
              <td colSpan={2} className={CARD_CELL}>
                {tempOut ? (
                  <NotCoveredChip />
                ) : (
                  <TempValue cell={issuance.temp[zone.id]?.[p.period.key]} />
                )}
              </td>
            </tr>
            {p.blocks.length > 0 && (
              <>
                <CardHeads>
                  {p.blocks.map((b) => (
                    <th key={b.block.key} scope="col" className={CARD_HEAD}>
                      {b.block.part}
                    </th>
                  ))}
                </CardHeads>
                <tr>
                  <th scope="row" className={CARD_LABEL}>
                    <KeyButton kind="level" unit="ft">
                      <span className="whitespace-nowrap">Snow level</span>
                    </KeyButton>
                  </th>
                  {p.blocks.map((b) => (
                    <td key={b.block.key} className={cn(CARD_CELL, 'border-l', levelCellFill(b))}>
                      {b.level == null ? (
                        <SnowLevelValue level={null} snow={b.snow} />
                      ) : (
                        <KeyButton kind="level" hit={levelStep(b.level)}>
                          <SnowLevelValue
                            level={b.level}
                            snow={b.snow}
                            pill={false}
                            tight={false}
                          />
                        </KeyButton>
                      )}
                    </td>
                  ))}
                </tr>
                <KeyRow kind="level" colSpan={3} />
                {showWind && (
                  <>
                    <tr>
                      <th scope="row" className={CARD_LABEL}>
                        <KeyButton kind="wind" unit="mph">
                          <span className="whitespace-nowrap">Ridge wind</span>
                        </KeyButton>
                      </th>
                      {p.blocks.map((b) => (
                        <td
                          key={b.block.key}
                          className={cn(
                            CARD_CELL,
                            'border-l',
                            !windOut.has(b.block.key) && windFill(b.wind?.speed),
                          )}
                        >
                          {!windOut.has(b.block.key) && (
                            <KeyButton kind="wind" hit={windStep(b.wind?.speed)}>
                              <WindValue cell={b.wind} compact />
                            </KeyButton>
                          )}
                        </td>
                      ))}
                    </tr>
                    <KeyRow kind="wind" colSpan={3} />
                  </>
                )}
              </>
            )}
          </tbody>
        </table>
      </CardKeys>
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

export function ZoneTable({
  issuance,
  zone,
  periodKeys,
  held = false,
  heading = true,
}: {
  issuance: NWACWeatherIssuance
  zone: NWACWeatherZone
  /** The periods to show: the 24 hours on show. */
  periodKeys: string[]
  /** A past forecast's 24 hours: Day and Night rather than Today, Tonight and Tomorrow. */
  held?: boolean
  /** The zone's name as a heading; off when the page already names the zone. */
  heading?: boolean
}) {
  const periods = periodViews(issuance, zone, periodKeys, held)
  return (
    <section aria-label={zone.name} className="space-y-4">
      {heading && <h3 className="text-lg font-semibold">{zone.name}</h3>}
      <div className="space-y-2">
        <PeriodTable issuance={issuance} zone={zone} periods={periods} />
        <PeriodCards issuance={issuance} zone={zone} periods={periods} />
        <div className="hidden md:block print:block">
          <ZoneKeys />
        </div>
      </div>
    </section>
  )
}
