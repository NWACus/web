// Public render of one MWF issuance from its normalized model. Pure and
// synchronous: everything comes from the forecast's own publish snapshot
// (config + structure), so archived forecasts render exactly as published.
import type { MwfPublicForecast } from '@/services/products/mwf/source'
import {
  DEFAULT_DROP_FT,
  deriveSnow,
  deriveSnowLevel,
  periodDate,
  type Entered,
} from '@/utilities/mwf/mwfData'

const entered = (v: Entered | undefined): number | null => {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const dash = '–'

function Table({
  caption,
  head,
  children,
}: {
  caption: string
  head: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <caption className="pb-1 text-left text-base font-semibold">{caption}</caption>
        <thead>{head}</thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function MwfForecastView({ forecast }: { forecast: MwfPublicForecast }) {
  const { body, config, structure } = forecast
  const slice = structure.issuances[forecast.issuance]
  const periods = structure.periods.filter((p) => slice.periods.includes(p.key))
  const blocks = structure.blocks.filter((b) => slice.blocks.includes(b.key))
  const extendedBlocks = structure.extendedBlocks.filter((b) =>
    slice.extendedBlocks.includes(b.key),
  )
  const extendedZones = config.zones.filter((z) => config.extendedZoneIds.includes(z.id))
  const periodByKey = new Map(structure.periods.map((p) => [p.key, p]))
  const anchor = forecast.serviceDate

  // Snow-vs-freezing designation for a zone block: the stored override, else
  // the zone's mean QPF for the block's parent period against the threshold.
  const zoneBlockQpf = (zoneId: string, blockPeriod: string): number => {
    const points = config.points.filter((p) => p.zone === zoneId)
    if (!points.length) return 0
    const sum = points.reduce(
      (acc, p) => acc + (entered(body.precip?.[p.code]?.[blockPeriod]?.qpf) ?? 0),
      0,
    )
    return sum / points.length
  }

  return (
    <article className="flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-bold capitalize">
          {forecast.issuance} forecast · {forecast.serviceDate}
        </h2>
        <p className="text-sm opacity-70">
          Issued {forecast.issuedAt ? new Date(forecast.issuedAt).toLocaleString() : dash}
          {forecast.isCorrection ? ` · correction (revision ${forecast.revision})` : ''}
        </p>
      </header>

      {body.discussion?.synopsis && (
        <section>
          <h3 className="text-base font-semibold">Synopsis</h3>
          <p className="whitespace-pre-line text-sm">{body.discussion.synopsis}</p>
        </section>
      )}

      <Table
        caption="Precipitation (QPF in inches · derived snow)"
        head={
          <tr className="text-left">
            <th className="px-2 py-1">Forecast point</th>
            {periods.map((per) => (
              <th key={per.key} className="px-2 py-1 text-center">
                <div>{periodDate(anchor, per.dayOffset)}</div>
                <div className="text-xs font-normal opacity-70">
                  {per.kind === 'night' ? 'Night' : 'Day'}
                </div>
              </th>
            ))}
          </tr>
        }
      >
        {config.points.map((pt) => (
          <tr key={pt.code} className="border-t">
            <td className="px-2 py-1">{pt.name}</td>
            {periods.map((per) => {
              const cell = body.precip?.[pt.code]?.[per.key]
              const qpf = entered(cell?.qpf)
              const snow = cell ? deriveSnow(cell.qpf, cell.density) : null
              return (
                <td key={per.key} className="px-2 py-1 text-center tabular-nums">
                  {qpf == null ? dash : `${qpf}"`}
                  {snow != null && snow > 0 ? (
                    <span className="opacity-70"> · {snow}&quot; snow</span>
                  ) : null}
                </td>
              )
            })}
          </tr>
        ))}
      </Table>

      <Table
        caption="Snow level (ft)"
        head={
          <tr className="text-left">
            <th className="px-2 py-1">Zone</th>
            {blocks.map((b) => {
              const per = periodByKey.get(b.period)
              return (
                <th key={b.key} className="px-2 py-1 text-center">
                  <div>{b.part}</div>
                  <div className="text-xs font-normal opacity-70">
                    {periodDate(anchor, per?.dayOffset ?? 0)}
                  </div>
                </th>
              )
            })}
          </tr>
        }
      >
        {config.zones.map((z) => (
          <tr key={z.id} className="border-t">
            <td className="px-2 py-1">{z.name}</td>
            {blocks.map((b) => {
              const cell = body.snowLevel?.[z.id]?.[b.key]
              const freezing = entered(cell?.freezing)
              if (freezing == null) {
                return (
                  <td key={b.key} className="px-2 py-1 text-center">
                    {dash}
                  </td>
                )
              }
              const designation =
                cell?.mode === 'snow' || cell?.mode === 'freezing'
                  ? cell.mode
                  : zoneBlockQpf(z.id, b.period) > 0.005
                    ? 'snow'
                    : 'freezing'
              const value =
                designation === 'snow'
                  ? deriveSnowLevel(freezing, cell?.drop ?? DEFAULT_DROP_FT)
                  : freezing
              return (
                <td key={b.key} className="px-2 py-1 text-center tabular-nums">
                  {value}
                  <span className="block text-[10px] opacity-70">
                    {designation === 'snow' ? 'snow' : 'freezing'}
                  </span>
                </td>
              )
            })}
          </tr>
        ))}
      </Table>

      {extendedBlocks.length > 0 && extendedZones.length > 0 && (
        <Table
          caption="Extended snow level outlook (ft)"
          head={
            <tr className="text-left">
              <th className="px-2 py-1">Zone</th>
              {extendedBlocks.map((b) => (
                <th key={b.key} className="px-2 py-1 text-center">
                  <div>{b.part}</div>
                  <div className="text-xs font-normal opacity-70">
                    {periodDate(anchor, b.dayOffset)}
                  </div>
                </th>
              ))}
            </tr>
          }
        >
          {extendedZones.map((z) => (
            <tr key={z.id} className="border-t">
              <td className="px-2 py-1">{z.name}</td>
              {extendedBlocks.map((b) => {
                const cell = body.extendedSnowLevel?.[z.id]?.[b.key]
                const freezing = entered(cell?.freezing)
                const value =
                  freezing == null ? null : deriveSnowLevel(freezing, cell?.drop ?? DEFAULT_DROP_FT)
                return (
                  <td key={b.key} className="px-2 py-1 text-center tabular-nums">
                    {value ?? dash}
                  </td>
                )
              })}
            </tr>
          ))}
        </Table>
      )}

      <Table
        caption="Temperatures at 5,000 ft (°F, high / low)"
        head={
          <tr className="text-left">
            <th className="px-2 py-1">Zone</th>
            {periods.map((per) => (
              <th key={per.key} className="px-2 py-1 text-center">
                <div>{periodDate(anchor, per.dayOffset)}</div>
                <div className="text-xs font-normal opacity-70">
                  {per.kind === 'night' ? 'Night' : 'Day'}
                </div>
              </th>
            ))}
          </tr>
        }
      >
        {config.zones.map((z) => (
          <tr key={z.id} className="border-t">
            <td className="px-2 py-1">{z.name}</td>
            {periods.map((per) => {
              const cell = body.temps?.[z.id]?.[per.key]
              const high = entered(cell?.high)
              const low = entered(cell?.low)
              return (
                <td key={per.key} className="px-2 py-1 text-center tabular-nums">
                  {high == null && low == null ? dash : `${high ?? dash} / ${low ?? dash}`}
                </td>
              )
            })}
          </tr>
        ))}
      </Table>

      <Table
        caption="Ridgeline winds (mph)"
        head={
          <tr className="text-left">
            <th className="px-2 py-1">Zone</th>
            {blocks.map((b) => {
              const per = periodByKey.get(b.period)
              return (
                <th key={b.key} className="px-2 py-1 text-center">
                  <div>{b.part}</div>
                  <div className="text-xs font-normal opacity-70">
                    {periodDate(anchor, per?.dayOffset ?? 0)}
                  </div>
                </th>
              )
            })}
          </tr>
        }
      >
        {config.zones.map((z) => (
          <tr key={z.id} className="border-t">
            <td className="px-2 py-1">{z.name}</td>
            {blocks.map((b) => {
              const cell = body.wind?.[z.id]?.[b.key]
              const speed = entered(cell?.speed)
              return (
                <td key={b.key} className="px-2 py-1 text-center tabular-nums">
                  {cell?.dir || speed != null ? `${cell?.dir ?? ''} ${speed ?? ''}`.trim() : dash}
                </td>
              )
            })}
          </tr>
        ))}
      </Table>

      {body.sensible && (
        <section>
          <h3 className="text-base font-semibold">Sensible weather</h3>
          <div className="flex flex-col gap-2">
            {config.zones.map((z) => {
              const slots = body.sensible?.[z.id]
              if (!slots || (!slots.morning && !slots.afternoon)) return null
              return (
                <div key={z.id} className="text-sm">
                  <span className="font-medium">{z.name}: </span>
                  {slots.morning && <span>{slots.morning} </span>}
                  {slots.afternoon && <span className="opacity-80">{slots.afternoon}</span>}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {body.discussion?.extended && (
        <section>
          <h3 className="text-base font-semibold">Extended synopsis</h3>
          <p className="whitespace-pre-line text-sm">{body.discussion.extended}</p>
        </section>
      )}
    </article>
  )
}

// The stacked public view: every visible issuance for the date, newest first.
export function MwfStackedView({
  forecasts,
  emptyMessage = 'No mountain weather forecast is available for this date.',
}: {
  forecasts: MwfPublicForecast[]
  emptyMessage?: string
}) {
  if (!forecasts.length) {
    return <p className="text-sm opacity-70">{emptyMessage}</p>
  }
  return (
    <div className="flex flex-col gap-10">
      {forecasts.map((forecast) => (
        <MwfForecastView key={forecast.id} forecast={forecast} />
      ))}
    </div>
  )
}
