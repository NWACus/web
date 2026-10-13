/**
 * One zone's forecast the way a zone page reads it: the sensible-weather text first, then the
 * numbers by period — snow and temps on the 12h periods, snow level and wind on the 6h blocks
 * beneath. A zone forecast from several points shows each point's snow under the zone's. A table from `md` up and on paper; one card per period on a phone.
 */
import type {
  NWACWeatherBlock,
  NWACWeatherExtendedBlock,
  NWACWeatherIssuance,
  NWACWeatherPeriod,
  NWACWeatherPoint,
  NWACWeatherWindCell,
  NWACWeatherZone,
} from '@/services/nac/model/nwacWeather'
import {
  SENSIBLE_SLOTS,
  deriveSnowLevel,
  fmtCalendarDate,
  fmtSnowAmount,
  periodDateGroups,
  pointSnow,
  rangeBucket,
  snowLevelTones,
  zonePoints,
  zoneSnow,
} from '@/services/nac/nwacWeatherFormat'
import { cn } from '@/utilities/ui'
import type { ReactNode } from 'react'

import { DayNightDate, LevelValue, SnowValue, TempValue, WindValue } from './Values'

const HEAD = 'border-b border-l p-2 text-center font-semibold'
const ROW_LABEL = 'border-t p-2 pl-3 text-left align-middle font-semibold'
const Unit = ({ children }: { children: string }) => (
  <span className="font-normal text-muted-foreground"> {children}</span>
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
  tone: number | null
  wind: NWACWeatherWindCell | undefined
}

/** Periods with their 6h blocks; a period the wire gives no blocks still takes one column. */
function periodViews(issuance: NWACWeatherIssuance, zone: NWACWeatherZone): PeriodView[] {
  const levels = issuance.blocks.map((b) => {
    const cell = issuance.snowLevel[zone.id]?.[b.key]
    return deriveSnowLevel(cell?.freezing, cell?.drop)
  })
  const tones = snowLevelTones(levels)
  const blocks = issuance.blocks.map((block, i) => ({
    block,
    level: levels[i],
    tone: tones[i],
    wind: issuance.wind[zone.id]?.[block.key],
  }))
  return issuance.periods.map((period) => ({
    period,
    night: period.kind === 'night',
    label: fmtCalendarDate(period.date),
    blocks: blocks.filter((b) => b.block.period === period.key),
  }))
}

function ZoneSnow({
  issuance,
  zone,
  period,
}: {
  issuance: NWACWeatherIssuance
  zone: NWACWeatherZone
  period: NWACWeatherPeriod
}) {
  const snow = zoneSnow(issuance, zone.id, period.key)
  return <SnowValue text={rangeBucket(snow)} some={snow != null && snow > 0} />
}

function PointSnow({
  issuance,
  point,
  period,
}: {
  issuance: NWACWeatherIssuance
  point: NWACWeatherPoint
  period: NWACWeatherPeriod
}) {
  const snow = pointSnow(issuance, point.code, period.key)
  return <SnowValue text={fmtSnowAmount(snow)} some={snow != null && snow >= 0.5} />
}

/**
 * The points behind a zone's snow, when there is more than one: the zone row is their mean in a
 * 2-inch band, so each point's own amount sits beneath it.
 */
function snowPoints(issuance: NWACWeatherIssuance, zone: NWACWeatherZone) {
  const points = zonePoints(issuance, zone.id)
  return points.length > 1 ? points : []
}

/** Today / Tonight under the first date, Tomorrow under the second. */
function SensibleCards({
  issuance,
  zone,
}: {
  issuance: NWACWeatherIssuance
  zone: NWACWeatherZone
}) {
  const sensible = issuance.sensible[zone.id] ?? {}
  const dates = periodDateGroups(issuance.periods)
  const cards = SENSIBLE_SLOTS.map((slot, i) => ({
    ...slot,
    date: dates[i]?.date,
    text: sensible[slot.key]?.trim(),
  })).filter((c) => c.text)
  if (cards.length === 0) return null
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cards.map((c) => (
        <section key={c.key} className="space-y-1 rounded-lg bg-muted p-4">
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="text-sm font-semibold">{c.label}</h4>
            {c.date && (
              <span className="text-xs text-muted-foreground">{fmtCalendarDate(c.date)}</span>
            )}
          </div>
          <p className="whitespace-pre-line">{c.text}</p>
        </section>
      ))}
    </div>
  )
}

const periodSpan = (p: PeriodView) => Math.max(1, p.blocks.length)

function PeriodHead({ periods }: { periods: PeriodView[] }) {
  return (
    <thead className="bg-muted">
      <tr>
        <td />
        {periods.map((p) => (
          <th key={p.period.key} scope="colgroup" colSpan={periodSpan(p)} className={HEAD}>
            <DayNightDate date={p.label} night={p.night} />
          </th>
        ))}
      </tr>
      <tr>
        <td className="border-b" />
        {periods.flatMap((p) =>
          p.blocks.map((b, i) => <PartHead key={b.block.key} b={b} first={i === 0} />),
        )}
      </tr>
    </thead>
  )
}

function PartHead({ b, first }: { b: BlockView; first: boolean }) {
  return (
    <th
      scope="col"
      className={cn(
        'border-b px-1 py-1.5 text-center text-sm font-normal text-muted-foreground',
        first && 'border-l',
      )}
    >
      {b.block.part}
    </th>
  )
}

/** One cell per 12h period, spanning that period's blocks. */
function PeriodRow({
  label,
  unit,
  periods,
  cell,
  sub = false,
}: {
  label: string
  unit?: string
  periods: PeriodView[]
  cell: (p: PeriodView) => ReactNode
  /** A point under the zone's row: indented, and lighter. */
  sub?: boolean
}) {
  return (
    <tr className={cn(sub && 'text-muted-foreground')}>
      <th scope="row" className={cn(ROW_LABEL, sub && 'border-t-0 py-1 pl-6 text-xs font-normal')}>
        {label}
        {unit && <Unit>{unit}</Unit>}
      </th>
      {periods.map((p) => (
        <td
          key={p.period.key}
          colSpan={periodSpan(p)}
          className={cn('border-l border-t p-2 text-center', sub && 'border-t-0 py-1 text-xs')}
        >
          {cell(p)}
        </td>
      ))}
    </tr>
  )
}

/** One cell per 6h block. */
function BlockRow({
  label,
  unit,
  blocks,
  cellClassName,
  cell,
}: {
  label: string
  unit: string
  blocks: BlockView[]
  cellClassName: string
  cell: (b: BlockView) => ReactNode
}) {
  return (
    <tr>
      <th scope="row" className={ROW_LABEL}>
        {label}
        <Unit>{unit}</Unit>
      </th>
      {blocks.map((b) => (
        <td key={b.block.key} className={cellClassName}>
          {cell(b)}
        </td>
      ))}
    </tr>
  )
}

function PeriodTable({
  issuance,
  zone,
  periods,
}: {
  issuance: NWACWeatherIssuance
  zone: NWACWeatherZone
  periods: PeriodView[]
}) {
  const blocks = periods.flatMap((p) => p.blocks)
  return (
    <div className="hidden overflow-hidden rounded-md border md:block print:block">
      <table className="w-full table-fixed border-collapse text-sm">
        <colgroup>
          <col className="w-36" />
          {blocks.map((b) => (
            <col key={b.block.key} />
          ))}
        </colgroup>
        <PeriodHead periods={periods} />
        <tbody>
          <PeriodRow
            label="Snow"
            unit="in"
            periods={periods}
            cell={(p) => <ZoneSnow issuance={issuance} zone={zone} period={p.period} />}
          />
          {snowPoints(issuance, zone).map((point) => (
            <PeriodRow
              key={point.code}
              label={point.name}
              periods={periods}
              sub
              cell={(p) => <PointSnow issuance={issuance} point={point} period={p.period} />}
            />
          ))}
          <BlockRow
            label="Snow level"
            unit="ft"
            blocks={blocks}
            cellClassName="border-t p-0.5"
            cell={(b) => <LevelValue level={b.level} tone={b.tone} />}
          />
          <PeriodRow
            label="Temp"
            unit="5000' °F"
            periods={periods}
            cell={(p) => <TempValue cell={issuance.temp[zone.id]?.[p.period.key]} />}
          />
          <BlockRow
            label="Ridge wind"
            unit="mph"
            blocks={blocks}
            cellClassName="border-t p-2 text-center"
            cell={(b) => <WindValue cell={b.wind} />}
          />
        </tbody>
      </table>
    </div>
  )
}

function PeriodCardHeader({
  issuance,
  zone,
  p,
}: {
  issuance: NWACWeatherIssuance
  zone: NWACWeatherZone
  p: PeriodView
}) {
  return (
    <div className="flex items-center justify-between gap-2 bg-muted px-3 py-2">
      <h4 className="font-semibold">
        <DayNightDate date={p.label} night={p.night} />
      </h4>
      <div className="flex items-center gap-3 text-sm">
        <span>
          <span className="sr-only">Snow </span>
          <ZoneSnow issuance={issuance} zone={zone} period={p.period} />
        </span>
        <span>
          <span className="sr-only">Temperature </span>
          <TempValue cell={issuance.temp[zone.id]?.[p.period.key]} />
        </span>
      </div>
    </div>
  )
}

/** On a phone, each point's snow under the period's header. */
function CardPointSnow({
  issuance,
  zone,
  p,
}: {
  issuance: NWACWeatherIssuance
  zone: NWACWeatherZone
  p: PeriodView
}) {
  const points = snowPoints(issuance, zone)
  if (points.length === 0) return null
  return (
    <dl className="space-y-0.5 border-b px-3 py-1.5 text-xs text-muted-foreground">
      {points.map((point) => (
        <div key={point.code} className="flex justify-between gap-2">
          <dt>{point.name}</dt>
          <dd>
            <PointSnow issuance={issuance} point={point} period={p.period} />
          </dd>
        </div>
      ))}
    </dl>
  )
}

function BlockLine({ b }: { b: BlockView }) {
  return (
    <div className="grid grid-cols-[5rem_5.5rem_1fr] items-center gap-2">
      <dt className="text-muted-foreground">{b.block.part}</dt>
      <dd>
        <LevelValue level={b.level} tone={b.tone} />
      </dd>
      <dd>
        <WindValue cell={b.wind} />
      </dd>
    </div>
  )
}

function PeriodCard({
  issuance,
  zone,
  p,
}: {
  issuance: NWACWeatherIssuance
  zone: NWACWeatherZone
  p: PeriodView
}) {
  return (
    <section className="overflow-hidden rounded-lg border">
      <PeriodCardHeader issuance={issuance} zone={zone} p={p} />
      <CardPointSnow issuance={issuance} zone={zone} p={p} />
      <dl className="space-y-1.5 px-3 py-2 text-sm">
        {p.blocks.map((b) => (
          <BlockLine key={b.block.key} b={b} />
        ))}
      </dl>
    </section>
  )
}

function PeriodCards({
  issuance,
  zone,
  periods,
}: {
  issuance: NWACWeatherIssuance
  zone: NWACWeatherZone
  periods: PeriodView[]
}) {
  return (
    <div className="space-y-3 md:hidden print:hidden">
      {periods.map((p) => (
        <PeriodCard key={p.period.key} issuance={issuance} zone={zone} p={p} />
      ))}
      <p className="text-xs text-muted-foreground">
        Snow in inches · snow level ft · temps at 5000&apos; °F · ridgeline wind mph
      </p>
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
      <PeriodTable issuance={issuance} zone={zone} periods={periods} />
      <PeriodCards issuance={issuance} zone={zone} periods={periods} />
    </section>
  )
}

/** A date over its blocks' part-of-day labels, as in the main table's header. */
function ExtendedHead({ blocks }: { blocks: NWACWeatherExtendedBlock[] }) {
  const dates: { date: string; span: number }[] = []
  for (const b of blocks) {
    const last = dates[dates.length - 1]
    if (last && last.date === b.date) last.span++
    else dates.push({ date: b.date, span: 1 })
  }
  return (
    <thead className="bg-muted">
      <tr>
        {dates.map((d, i) => (
          <th
            key={d.date}
            scope="colgroup"
            colSpan={d.span}
            className={cn(HEAD, i === 0 && 'border-l-0')}
          >
            {fmtCalendarDate(d.date)}
          </th>
        ))}
      </tr>
      <tr>
        {blocks.map((b, i) => (
          <th
            key={b.key}
            scope="col"
            className={cn(
              'border-b px-1 py-1.5 text-center text-sm font-normal text-muted-foreground',
              i > 0 && blocks[i - 1].date !== b.date && 'border-l',
            )}
          >
            {b.part}
          </th>
        ))}
      </tr>
    </thead>
  )
}

/** The zone's extended snow levels, where the issuance has them (afternoons). */
export function ZoneExtended({
  issuance,
  zone,
}: {
  issuance: NWACWeatherIssuance
  zone: NWACWeatherZone
}) {
  const levels = issuance.extendedSnowLevel[zone.id]
  const blocks = issuance.extendedBlocks
  if (!levels || blocks.length === 0) return null
  const values = blocks.map((b) => deriveSnowLevel(levels[b.key]?.freezing, levels[b.key]?.drop))
  const tones = snowLevelTones(values)
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">Extended Snow Level (ft)</h4>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[480px] table-fixed border-collapse text-sm">
          <ExtendedHead blocks={blocks} />
          <tbody>
            <tr>
              {blocks.map((b, i) => (
                <td key={b.key} className="p-0.5">
                  <LevelValue level={values[i]} tone={tones[i]} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
