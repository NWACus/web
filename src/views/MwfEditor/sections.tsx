'use client'

// The seven MWF editor sections. Each renders from the shared forecast model
// and mutates through the editor's `mutate` callback, which triggers the
// debounced autosave. Model-guidance overlay columns arrive with the guidance
// milestone; the grids leave room for them.
import {
  MwfForecast,
  PERIODS,
  SENSIBLE_SLOTS,
  blocksFor,
  deriveSnow,
  deriveSnowLevel,
  extendedBlocksFor,
  periodDate,
  periodsFor,
  qpfOverPrecise,
  zoneBlockQpf,
  type ForecastPoint,
  type Zone,
} from '@/utilities/mwf/mwfData'
import { LevelCell, NumberCell, WindDirCell } from './cells'

export interface SectionProps {
  forecast: MwfForecast
  zones: Zone[]
  points: ForecastPoint[]
  extendedZones: Zone[]
  mutate: (fn: (fc: MwfForecast) => void) => void
}

const PERIOD_BY_KEY = Object.fromEntries(PERIODS.map((p) => [p.key, p]))
const PART_LABEL: Record<string, string> = {
  am: 'Morning',
  pm: 'Afternoon',
  ev: 'Evening',
  nt: 'Night',
}

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border p-4">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mb-3 text-xs opacity-70">{hint}</p>
      {children}
    </section>
  )
}

export function PrecipGrid({ forecast, zones, points, mutate }: SectionProps) {
  const periods = periodsFor(forecast.meta.type)
  const zoneName = new Map(zones.map((z) => [z.id, z.name]))
  return (
    <Section
      title="Precipitation · Density · Snow"
      hint="Per-point, 12-hour blocks. Snow is derived (QPF × 100 / density) and not editable. Density is needed only where QPF > 0."
    >
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left">
              <th className="px-2 py-1.5 font-medium">Forecast point</th>
              {periods.map((per) => (
                <th key={per.key} className="min-w-40 px-2 py-1.5 text-center">
                  <div className="font-medium">
                    {periodDate(forecast.meta.initialDate, per.dayOffset)}
                  </div>
                  <div className="text-xs font-normal opacity-70">
                    {per.kind === 'night' ? 'Night' : 'Day'} · QPF / SLR / Snow
                  </div>
                </th>
              ))}
              <th className="px-2 py-1.5 text-center">Σ QPF</th>
            </tr>
          </thead>
          <tbody>
            {points.map((pt) => {
              const rowValues = periods.map((per) => forecast.precip[pt.code]?.[per.key])
              const any = rowValues.some((c) => c && c.qpf != null && c.qpf !== '')
              const sum = rowValues.reduce((acc, c) => acc + (Number(c?.qpf) || 0), 0)
              return (
                <tr key={pt.code} className="border-t">
                  <td className="px-2 py-1.5">
                    <div>{pt.name}</div>
                    <div className="text-xs opacity-70">{zoneName.get(pt.zone) ?? pt.zone}</div>
                  </td>
                  {periods.map((per) => {
                    const cell = forecast.precip[pt.code]?.[per.key]
                    if (!cell) return <td key={per.key} />
                    const snow = deriveSnow(cell.qpf, cell.density)
                    return (
                      <td key={per.key} className="px-1.5 py-1.5">
                        <div className="flex items-center gap-1">
                          <NumberCell
                            ariaLabel={`${pt.code} ${per.short} QPF`}
                            value={cell.qpf}
                            invalid={qpfOverPrecise(cell.qpf)}
                            onChange={(v) =>
                              mutate((fc) => {
                                fc.precip[pt.code][per.key].qpf = v
                              })
                            }
                          />
                          <NumberCell
                            ariaLabel={`${pt.code} ${per.short} density`}
                            value={cell.density}
                            onChange={(v) =>
                              mutate((fc) => {
                                fc.precip[pt.code][per.key].density = v
                              })
                            }
                          />
                          <span className="min-w-10 text-right text-xs tabular-nums opacity-80">
                            {snow == null ? '–' : `${snow}"`}
                          </span>
                        </div>
                      </td>
                    )
                  })}
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {any ? sum.toFixed(2) : '–'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex gap-2">
        {periods.map((per) => (
          <div key={per.key} className="flex items-center gap-1 text-xs">
            <span className="opacity-70">{per.short} SLR:</span>
            {[10, 0].map((v) => (
              <button
                key={v}
                type="button"
                className="rounded border px-1.5 py-0.5"
                onClick={() =>
                  mutate((fc) => {
                    points.forEach((pt) => {
                      fc.precip[pt.code][per.key].density = v
                    })
                  })
                }
              >
                {v}
              </button>
            ))}
          </div>
        ))}
      </div>
    </Section>
  )
}

function levelHeader(forecast: MwfForecast, blockKey: string, period: string) {
  const per = PERIOD_BY_KEY[period]
  return {
    date: periodDate(forecast.meta.initialDate, per ? per.dayOffset : 0),
    part: PART_LABEL[blockKey.slice(0, 2)] ?? blockKey,
  }
}

export function SnowLevelTable({ forecast, zones, points, mutate }: SectionProps) {
  const blocks = blocksFor(forecast.meta.type)
  return (
    <Section
      title="Snow & Freezing Level"
      hint="Zone-scale, 6-hour blocks, nearest 500 ft (arrow keys step). The snow/freezing designation auto-sets from precip — click it to override."
    >
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="px-2 py-1.5 text-left font-medium">Zone</th>
              {blocks.map((b) => {
                const h = levelHeader(forecast, b.key, b.period)
                return (
                  <th key={b.key} className="min-w-24 px-2 py-1.5 text-center">
                    <div className="font-medium">{h.part}</div>
                    <div className="text-xs font-normal opacity-70">{h.date}</div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => (
              <tr key={z.id} className="border-t">
                <td className="px-2 py-1.5">{z.name}</td>
                {blocks.map((b) => {
                  const cell = forecast.snowLevel[z.id]?.[b.key]
                  if (!cell) return <td key={b.key} />
                  const auto =
                    zoneBlockQpf(forecast.precip, points, z.id, b.key) > 0.005 ? 'snow' : 'freezing'
                  const designation = cell.mode === 'auto' ? auto : cell.mode
                  const level =
                    designation === 'snow' ? deriveSnowLevel(cell.freezing, cell.drop) : null
                  return (
                    <td key={b.key} className="px-1.5 py-1.5">
                      <div className="flex flex-col items-stretch gap-0.5">
                        <LevelCell
                          ariaLabel={`${z.id} ${b.key} level`}
                          value={cell.freezing}
                          onChange={(v) =>
                            mutate((fc) => {
                              fc.snowLevel[z.id][b.key].freezing = v
                            })
                          }
                        />
                        <button
                          type="button"
                          title="Toggle snow vs freezing designation"
                          className={`rounded px-1 text-[11px] ${
                            designation === 'snow' ? 'text-sky-700' : 'text-amber-700'
                          }`}
                          onClick={() =>
                            mutate((fc) => {
                              fc.snowLevel[z.id][b.key].mode =
                                designation === 'snow' ? 'freezing' : 'snow'
                            })
                          }
                        >
                          {designation === 'snow'
                            ? `❄ snow${level != null ? ` ${level}` : ''}`
                            : '💧 freezing'}
                        </button>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}

export function ExtendedSnowLevelTable({ forecast, extendedZones, mutate }: SectionProps) {
  const blocks = extendedBlocksFor(forecast.meta.type)
  if (!blocks.length || !extendedZones.length) return null
  return (
    <Section
      title="Extended Snow Level Outlook"
      hint="Afternoon issuances only — four coarse blocks out to day 5, for the configured outlook zones."
    >
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="px-2 py-1.5 text-left font-medium">Zone</th>
              {blocks.map((b) => (
                <th key={b.key} className="min-w-24 px-2 py-1.5 text-center">
                  <div className="font-medium">{b.part}</div>
                  <div className="text-xs font-normal opacity-70">
                    {periodDate(forecast.meta.initialDate, b.dayOffset)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {extendedZones.map((z) => (
              <tr key={z.id} className="border-t">
                <td className="px-2 py-1.5">{z.name}</td>
                {blocks.map((b) => {
                  const cell = forecast.extendedSnowLevel[z.id]?.[b.key]
                  if (!cell) return <td key={b.key} />
                  return (
                    <td key={b.key} className="px-1.5 py-1.5">
                      <LevelCell
                        ariaLabel={`${z.id} extended ${b.key} level`}
                        value={cell.freezing}
                        onChange={(v) =>
                          mutate((fc) => {
                            fc.extendedSnowLevel[z.id][b.key].freezing = v
                          })
                        }
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}

export function TempTable({ forecast, zones, mutate }: SectionProps) {
  const periods = periodsFor(forecast.meta.type)
  return (
    <Section
      title="Temperatures (5,000 ft)"
      hint="High / low per zone per 12-hour period. A high below its low is flagged live and blocks publish."
    >
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="px-2 py-1.5 text-left font-medium">Zone</th>
              {periods.map((per) => (
                <th key={per.key} className="min-w-28 px-2 py-1.5 text-center">
                  <div className="font-medium">
                    {periodDate(forecast.meta.initialDate, per.dayOffset)}
                  </div>
                  <div className="text-xs font-normal opacity-70">
                    {per.kind === 'night' ? 'Night' : 'Day'} · high / low
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => (
              <tr key={z.id} className="border-t">
                <td className="px-2 py-1.5">{z.name}</td>
                {periods.map((per) => {
                  const cell = forecast.temps[z.id]?.[per.key]
                  if (!cell) return <td key={per.key} />
                  const conflict =
                    cell.high != null &&
                    cell.high !== '' &&
                    cell.low != null &&
                    cell.low !== '' &&
                    Number(cell.high) < Number(cell.low)
                  return (
                    <td key={per.key} className="px-1.5 py-1.5">
                      <div
                        className="flex items-center gap-1"
                        title={conflict ? 'High is below low' : undefined}
                      >
                        <NumberCell
                          ariaLabel={`${z.id} ${per.short} high`}
                          value={cell.high}
                          invalid={conflict}
                          onChange={(v) =>
                            mutate((fc) => {
                              fc.temps[z.id][per.key].high = v
                            })
                          }
                        />
                        <NumberCell
                          ariaLabel={`${z.id} ${per.short} low`}
                          value={cell.low}
                          invalid={conflict}
                          onChange={(v) =>
                            mutate((fc) => {
                              fc.temps[z.id][per.key].low = v
                            })
                          }
                        />
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}

export function WindTable({ forecast, zones, mutate }: SectionProps) {
  const blocks = blocksFor(forecast.meta.type)
  return (
    <Section
      title="Ridgeline Winds"
      hint="Direction (compass points incl. VAR — invalid entries clear) and speed per zone per 6-hour block."
    >
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="px-2 py-1.5 text-left font-medium">Zone</th>
              {blocks.map((b) => {
                const h = levelHeader(forecast, b.key, b.period)
                return (
                  <th key={b.key} className="min-w-24 px-2 py-1.5 text-center">
                    <div className="font-medium">{h.part}</div>
                    <div className="text-xs font-normal opacity-70">{h.date}</div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => (
              <tr key={z.id} className="border-t">
                <td className="px-2 py-1.5">{z.name}</td>
                {blocks.map((b) => {
                  const cell = forecast.wind[z.id]?.[b.key]
                  if (!cell) return <td key={b.key} />
                  return (
                    <td key={b.key} className="px-1.5 py-1.5">
                      <div className="flex items-center gap-1">
                        <WindDirCell
                          ariaLabel={`${z.id} ${b.key} direction`}
                          value={cell.dir}
                          onChange={(v) =>
                            mutate((fc) => {
                              fc.wind[z.id][b.key].dir = v
                            })
                          }
                        />
                        <NumberCell
                          ariaLabel={`${z.id} ${b.key} speed`}
                          value={cell.speed}
                          onChange={(v) =>
                            mutate((fc) => {
                              fc.wind[z.id][b.key].speed = v
                            })
                          }
                        />
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}

export function SensibleWeather({ forecast, zones, mutate }: SectionProps) {
  return (
    <Section title="Sensible Weather" hint="Free text per zone: Today / Tonight and Tomorrow.">
      <div className="flex flex-col gap-3">
        {zones.map((z) => {
          const slots = forecast.sensible[z.id]
          if (!slots) return null
          return (
            <div key={z.id} className="grid gap-2 md:grid-cols-[12rem_1fr_1fr]">
              <div className="pt-1.5 text-sm">{z.name}</div>
              {SENSIBLE_SLOTS.map((slot) => (
                <textarea
                  key={slot.key}
                  aria-label={`${z.id} ${slot.label}`}
                  placeholder={slot.label}
                  className="min-h-16 rounded border p-2 text-sm"
                  value={slots[slot.key]}
                  onChange={(e) =>
                    mutate((fc) => {
                      fc.sensible[z.id][slot.key] = e.target.value
                    })
                  }
                />
              ))}
            </div>
          )
        })}
      </div>
    </Section>
  )
}

export function Discussion({ forecast, mutate }: SectionProps) {
  return (
    <Section title="Discussion" hint="Synopsis and extended synopsis for the whole forecast.">
      <div className="flex flex-col gap-3">
        <textarea
          aria-label="Synopsis"
          placeholder="Synopsis"
          className="min-h-24 rounded border p-2 text-sm"
          value={forecast.discussion.synopsis}
          onChange={(e) =>
            mutate((fc) => {
              fc.discussion.synopsis = e.target.value
            })
          }
        />
        <textarea
          aria-label="Extended synopsis"
          placeholder="Extended synopsis"
          className="min-h-24 rounded border p-2 text-sm"
          value={forecast.discussion.extended}
          onChange={(e) =>
            mutate((fc) => {
              fc.discussion.extended = e.target.value
            })
          }
        />
      </div>
    </Section>
  )
}
