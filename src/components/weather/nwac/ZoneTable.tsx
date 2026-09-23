/**
 * One zone's forecast the way a zone page reads it: the sensible-weather text first, then the
 * numbers by period — snow and temps on the 12h periods, snow level and wind on the 6h blocks
 * beneath. A table from `md` up and on paper; one card per period on a phone.
 */
import type {
  NwacWeatherBlock,
  NwacWeatherIssuance,
  NwacWeatherPeriod,
  NwacWeatherWindCell,
  NwacWeatherZone,
} from '@/services/nac/model/nwacWeather'
import {
  SENSIBLE_SLOTS,
  deriveSnowLevel,
  fmtCalendarDate,
  periodDateGroups,
  rangeBucket,
  snowLevelTones,
  zoneSnow,
} from '@/services/nac/nwacWeatherFormat'
import { cn } from '@/utilities/ui'
import type { ReactNode } from 'react'

import { LevelValue, NIGHT, SnowValue, TempValue, WindValue } from './Values'

const HEAD = 'border-b border-l p-2 text-center font-semibold'
const ROW_LABEL = 'border-t p-2 pl-3 text-left align-middle font-semibold'
const Unit = ({ children }: { children: string }) => (
  <span className="font-normal text-muted-foreground"> {children}</span>
)

interface PeriodView {
  period: NwacWeatherPeriod
  label: string
  night: boolean
  blocks: BlockView[]
}
interface BlockView {
  block: NwacWeatherBlock
  night: boolean
  level: number | null
  tone: number | null
  wind: NwacWeatherWindCell | undefined
}

/** Periods with their 6h blocks; a period the wire gives no blocks still takes one column. */
function periodViews(issuance: NwacWeatherIssuance, zone: NwacWeatherZone): PeriodView[] {
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
  return issuance.periods.map((period) => {
    const night = period.kind === 'night'
    return {
      period,
      night,
      label: `${fmtCalendarDate(period.date)} · ${night ? 'Night' : 'Day'}`,
      blocks: blocks.filter((b) => b.block.period === period.key).map((b) => ({ ...b, night })),
    }
  })
}

function ZoneSnow({
  issuance,
  zone,
  period,
}: {
  issuance: NwacWeatherIssuance
  zone: NwacWeatherZone
  period: NwacWeatherPeriod
}) {
  const snow = zoneSnow(issuance, zone.id, period.key)
  return <SnowValue text={rangeBucket(snow)} some={snow != null && snow > 0} />
}

/** Today / Tonight under the first date, Tomorrow under the second. */
function SensibleCards({
  issuance,
  zone,
}: {
  issuance: NwacWeatherIssuance
  zone: NwacWeatherZone
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
    <thead className="bg-muted/50">
      <tr>
        <td />
        {periods.map((p) => (
          <th
            key={p.period.key}
            scope="colgroup"
            colSpan={periodSpan(p)}
            className={cn(HEAD, p.night && NIGHT)}
          >
            {p.label}
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
        'border-b px-1 pb-2 text-center text-xs font-normal text-muted-foreground',
        first && 'border-l',
        b.night && NIGHT,
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
}: {
  label: string
  unit: string
  periods: PeriodView[]
  cell: (p: PeriodView) => ReactNode
}) {
  return (
    <tr>
      <th scope="row" className={ROW_LABEL}>
        {label}
        <Unit>{unit}</Unit>
      </th>
      {periods.map((p) => (
        <td
          key={p.period.key}
          colSpan={periodSpan(p)}
          className="border-l border-t p-2 text-center"
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
  issuance: NwacWeatherIssuance
  zone: NwacWeatherZone
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
          <PeriodRow
            label="Temp"
            unit="5000' °F"
            periods={periods}
            cell={(p) => <TempValue cell={issuance.temp[zone.id]?.[p.period.key]} />}
          />
          <BlockRow
            label="Snow level"
            unit="ft"
            blocks={blocks}
            cellClassName="border-t p-0.5"
            cell={(b) => <LevelValue level={b.level} tone={b.tone} />}
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
  issuance: NwacWeatherIssuance
  zone: NwacWeatherZone
  p: PeriodView
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 px-3 py-2',
        p.night ? NIGHT : 'bg-muted/50',
      )}
    >
      <h4 className="font-semibold">{p.label}</h4>
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
  issuance: NwacWeatherIssuance
  zone: NwacWeatherZone
  p: PeriodView
}) {
  return (
    <section className="overflow-hidden rounded-lg border">
      <PeriodCardHeader issuance={issuance} zone={zone} p={p} />
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
  issuance: NwacWeatherIssuance
  zone: NwacWeatherZone
  periods: PeriodView[]
}) {
  return (
    <div className="space-y-3 md:hidden print:hidden">
      {periods.map((p) => (
        <PeriodCard key={p.period.key} issuance={issuance} zone={zone} p={p} />
      ))}
      <p className="text-xs text-muted-foreground">
        Snow in inches · temps at 5000&apos; °F · snow level ft · ridgeline wind mph
      </p>
    </div>
  )
}

export function ZoneTable({
  issuance,
  zone,
  heading = true,
}: {
  issuance: NwacWeatherIssuance
  zone: NwacWeatherZone
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

/** The zone's extended snow levels, where the issuance has them (afternoons). */
export function ZoneExtended({
  issuance,
  zone,
}: {
  issuance: NwacWeatherIssuance
  zone: NwacWeatherZone
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
          <thead className="bg-muted/50">
            <tr>
              {blocks.map((b) => (
                <th key={b.key} scope="col" className="border-b p-2 text-center">
                  <span className="font-semibold">{fmtCalendarDate(b.date)}</span>
                  <span className="block text-xs font-normal text-muted-foreground">{b.part}</span>
                </th>
              ))}
            </tr>
          </thead>
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
