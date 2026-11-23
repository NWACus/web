/** Annotated example cells for the tables' "How to read" panels, drawn by the tables' own values. */
import { Navigation2, Snowflake } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

import { snowRange } from '@/services/nac/nwacWeatherFormat'
import { cn } from '@/utilities/ui'

import {
  PrecipValue,
  SnowLevelValue,
  SnowValue,
  WindValue,
  levelFill,
  snowFill,
  windFill,
} from './Values'

function Badge({ n, className, style }: { n: number; className?: string; style?: CSSProperties }) {
  return (
    <span
      aria-hidden="true"
      style={style}
      className={cn(
        'inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background',
        className,
      )}
    >
      {n}
    </span>
  )
}

/** A badge on the cell's top edge, centered `at` percent from its left; or on its left edge or corner. */
type Mark = { n: number; at: number } | { n: number; edge: 'left' | 'corner' }

function Cell({
  fill,
  width = 'w-32',
  marks = [],
  className,
  children,
}: {
  fill?: string
  width?: string
  marks?: Mark[]
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'relative flex h-11 items-center justify-center border-y border-r bg-card text-sm first:border-l',
        width,
        fill,
        className,
      )}
    >
      {children}
      {marks.map((m) =>
        'edge' in m ? (
          <Badge
            key={m.n}
            n={m.n}
            className={cn(
              'absolute',
              m.edge === 'corner' ? '-bottom-2.5 -right-2.5' : '-left-2.5 top-1/2 -translate-y-1/2',
            )}
          />
        ) : (
          <Badge
            key={m.n}
            n={m.n}
            className="absolute -top-3 -translate-x-1/2"
            style={{ left: `${m.at}%` }}
          />
        ),
      )}
    </div>
  )
}

function Swatch({ fill }: { fill?: string }) {
  return <span aria-hidden="true" className={cn('inline-block size-3.5 rounded-sm border', fill)} />
}

/** The example cells over their numbered callouts. */
function Example({
  label,
  cells,
  callouts,
}: {
  label: string
  cells: ReactNode
  callouts: { part: ReactNode; text: ReactNode }[]
}) {
  return (
    <figure aria-label={label} className="flex flex-wrap items-start gap-x-8 gap-y-4">
      {/* The callouts carry the meaning; the cells are a picture of them. */}
      <div
        aria-hidden="true"
        className="flex max-w-full shrink-0 flex-wrap gap-x-4 gap-y-6 p-3 text-foreground"
      >
        {cells}
      </div>
      <ol className="min-w-56 flex-1 space-y-1.5 text-foreground">
        {callouts.map((c, i) => (
          <li key={i} className="flex items-start gap-2">
            <Badge n={i + 1} className="mt-px" />
            <span className="min-w-0">
              <span className="inline-flex items-center gap-1 align-bottom font-semibold">
                {c.part}
              </span>{' '}
              {c.text}
            </span>
          </li>
        ))}
      </ol>
    </figure>
  )
}

const WIND_EXAMPLE = { dir: 'SE', speed: 20 }

export function WindExample() {
  const fill = windFill(WIND_EXAMPLE.speed)
  return (
    <Example
      label="Example wind cell"
      cells={
        <div className="flex">
          <Cell
            fill={fill}
            marks={[
              { n: 1, edge: 'left' },
              { n: 2, at: 41 },
              { n: 3, at: 68 },
              { n: 4, edge: 'corner' },
            ]}
          >
            <WindValue cell={WIND_EXAMPLE} compact />
          </Cell>
        </div>
      }
      callouts={[
        {
          part: (
            <>
              <Navigation2 aria-hidden="true" className="size-4 rotate-[315deg] text-primary" />
              Arrow:
            </>
          ),
          text: 'the way the wind blows',
        },
        {
          part: 'SE:',
          text: 'the direction it blows from, on a 16-point compass (VAR = variable)',
        },
        { part: '15–25:', text: 'average speed, mph' },
        {
          part: (
            <>
              <Swatch fill={fill} />
              Fill:
            </>
          ),
          text: 'Light, Moderate, Strong or Extreme',
        },
      ]}
    />
  )
}

export function SnowLevelExample() {
  return (
    <Example
      label="Example snow and freezing level cells"
      cells={
        <>
          <div className="flex">
            <Cell
              fill={levelFill(3000)}
              marks={[
                { n: 1, at: 45 },
                { n: 2, at: 73 },
                { n: 4, edge: 'corner' },
              ]}
            >
              <SnowLevelValue level={3000} snow pill={false} tight={false} />
            </Cell>
          </div>
          <div className="flex">
            <Cell fill={levelFill(6000)} marks={[{ n: 3, at: 73 }]}>
              <SnowLevelValue level={6000} snow={false} pill={false} tight={false} />
            </Cell>
          </div>
        </>
      }
      callouts={[
        { part: "3,000':", text: 'the level, in feet' },
        {
          part: (
            <>
              <Snowflake aria-hidden="true" className="size-3.5 text-sky-700" />
              Snowflake:
            </>
          ),
          text: 'a snow level (precipitation expected)',
        },
        { part: 'No icon:', text: 'a freezing level (no precipitation expected)' },
        {
          part: (
            <>
              <Swatch fill={levelFill(3000)} />
              Fill:
            </>
          ),
          text: 'the elevation',
        },
      ]}
    />
  )
}

const PRECIP_EXAMPLE = { qpf: 0.45, snow: 4 }

export function PrecipExample({ withSnow }: { withSnow: boolean }) {
  const fill = withSnow ? snowFill(PRECIP_EXAMPLE.snow) : undefined
  const snow = snowRange(PRECIP_EXAMPLE.snow)
  const station = (n: number) => (
    <Cell
      width="w-28 sm:w-36"
      marks={[{ n, edge: 'left' }]}
      className="justify-start pl-4 pr-1 font-normal leading-tight"
    >
      Hurricane Ridge
    </Cell>
  )
  const precip = (
    <Cell width="w-[4.5rem]" fill={fill} marks={[{ n: 1, at: 50 }]}>
      <PrecipValue qpf={PRECIP_EXAMPLE.qpf} />
    </Cell>
  )
  const precipCallout = { part: '0.45":', text: 'inches of water at the station' }
  if (!withSnow) {
    return (
      <Example
        label="Example precipitation cell"
        cells={
          <div className="flex">
            {station(2)}
            {precip}
          </div>
        }
        callouts={[precipCallout, { part: 'Station:', text: 'a point in the zone' }]}
      />
    )
  }
  return (
    <Example
      label="Example precipitation and snow cells"
      cells={
        <div className="flex">
          {station(4)}
          {precip}
          <Cell
            width="w-[4.5rem]"
            fill={fill}
            marks={[
              { n: 2, at: 50 },
              { n: 3, edge: 'corner' },
            ]}
          >
            <SnowValue text={snow} some />
          </Cell>
        </div>
      }
      callouts={[
        precipCallout,
        { part: `${snow}:`, text: "inches of new snow at 5000'" },
        {
          part: (
            <>
              <Swatch fill={fill} />
              Fill:
            </>
          ),
          text: 'the snow amount',
        },
        { part: 'Station:', text: 'a point in the zone' },
      ]}
    />
  )
}
