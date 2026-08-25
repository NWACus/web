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
  type SerializedForecast,
  type Zone,
} from '@/utilities/mwf/mwfData'
import { LevelCell, NumberCell, WindDirCell } from './cells'

export interface SectionProps {
  forecast: MwfForecast
  zones: Zone[]
  points: ForecastPoint[]
  extendedZones: Zone[]
  mutate: (fn: (fc: MwfForecast) => void) => void
  // The previous issuance's body re-anchored to this forecast's Day 1 — the
  // Prev reference column. Absent on the first-ever forecast.
  previousBody?: Partial<SerializedForecast> | null
  previousLabel?: string | null
}

// A guidance/Prev reference value: click to fill the entry cell. `matched`
// highlights an entered value that equals the reference (entered zeros
// excluded), so divergence from guidance is visible at a glance.
function Chip({
  label,
  value,
  matched,
  onFill,
}: {
  label: string
  value: string
  matched: boolean
  onFill: () => void
}) {
  return (
    <button
      type="button"
      title={`${label}: click to fill`}
      onClick={onFill}
      className={`rounded border px-1 text-[11px] tabular-nums ${
        matched ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' : 'opacity-80'
      }`}
    >
      {label} {value}
    </button>
  )
}

const entered = (v: number | string | null | undefined): number | null => {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
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

export function PrecipGrid({ forecast, zones, points, mutate, previousBody }: SectionProps) {
  // Column fill: every model title present in any of this period's cells.
  const titlesFor = (periodKey: string): string[] => {
    const titles = new Set<string>()
    points.forEach((pt) => {
      Object.keys(forecast.precip[pt.code]?.[periodKey]?.guidance ?? {}).forEach((t) =>
        titles.add(t),
      )
    })
    return Array.from(titles)
  }
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
                  <div className="mt-0.5 flex flex-wrap justify-center gap-1">
                    {titlesFor(per.key).map((title) => (
                      <button
                        key={title}
                        type="button"
                        title={`Fill every point's ${per.short} QPF from ${title}`}
                        className="rounded border px-1 text-[10px] font-normal"
                        onClick={() =>
                          mutate((fc) => {
                            points.forEach((pt) => {
                              const g = fc.precip[pt.code][per.key].guidance[title]
                              if (g != null) fc.precip[pt.code][per.key].qpf = g
                            })
                          })
                        }
                      >
                        ⇩ {title}
                      </button>
                    ))}
                    {previousBody && (
                      <button
                        type="button"
                        title={`Fill every point's ${per.short} QPF from the previous forecast`}
                        className="rounded border px-1 text-[10px] font-normal"
                        onClick={() =>
                          mutate((fc) => {
                            points.forEach((pt) => {
                              const prev = entered(previousBody.precip?.[pt.code]?.[per.key]?.qpf)
                              if (prev != null) fc.precip[pt.code][per.key].qpf = prev
                            })
                          })
                        }
                      >
                        ⇩ Prev
                      </button>
                    )}
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
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {Object.entries(cell.guidance).map(([title, value]) => (
                            <Chip
                              key={title}
                              label={title}
                              value={String(value)}
                              matched={entered(cell.qpf) === value && value !== 0}
                              onFill={() =>
                                mutate((fc) => {
                                  fc.precip[pt.code][per.key].qpf = value
                                })
                              }
                            />
                          ))}
                          {entered(previousBody?.precip?.[pt.code]?.[per.key]?.qpf) != null && (
                            <Chip
                              label="Prev"
                              value={String(
                                entered(previousBody?.precip?.[pt.code]?.[per.key]?.qpf),
                              )}
                              matched={
                                entered(cell.qpf) ===
                                  entered(previousBody?.precip?.[pt.code]?.[per.key]?.qpf) &&
                                entered(cell.qpf) !== 0
                              }
                              onFill={() =>
                                mutate((fc) => {
                                  const prev = entered(
                                    previousBody?.precip?.[pt.code]?.[per.key]?.qpf,
                                  )
                                  if (prev != null) fc.precip[pt.code][per.key].qpf = prev
                                })
                              }
                            />
                          )}
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

export function SnowLevelTable({
  forecast,
  zones,
  points,
  mutate,
  previousBody,
  previousLabel,
}: SectionProps) {
  const blocks = blocksFor(forecast.meta.type)
  return (
    <Section
      title="Snow & Freezing Level"
      hint="Zone-scale, 6-hour blocks, nearest 500 ft (arrow keys step). The snow/freezing designation auto-sets from precip — click it to override."
    >
      {previousBody?.snowLevel && (
        <button
          type="button"
          className="mb-2 rounded border px-2 py-0.5 text-xs"
          title={previousLabel ? `Copy this table from the ${previousLabel} forecast` : undefined}
          onClick={() =>
            mutate((fc) => {
              zones.forEach((z) => {
                Object.keys(fc.snowLevel[z.id] ?? {}).forEach((bk) => {
                  const prev = entered(previousBody.snowLevel?.[z.id]?.[bk]?.freezing)
                  if (prev != null) fc.snowLevel[z.id][bk].freezing = prev
                })
              })
            })
          }
        >
          Copy all from previous
        </button>
      )}
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
                        {entered(previousBody?.snowLevel?.[z.id]?.[b.key]?.freezing) != null && (
                          <Chip
                            label="Prev"
                            value={String(
                              entered(previousBody?.snowLevel?.[z.id]?.[b.key]?.freezing),
                            )}
                            matched={
                              entered(cell.freezing) ===
                              entered(previousBody?.snowLevel?.[z.id]?.[b.key]?.freezing)
                            }
                            onFill={() =>
                              mutate((fc) => {
                                const prev = entered(
                                  previousBody?.snowLevel?.[z.id]?.[b.key]?.freezing,
                                )
                                if (prev != null) fc.snowLevel[z.id][b.key].freezing = prev
                              })
                            }
                          />
                        )}
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

export function TempTable({ forecast, zones, mutate, previousBody }: SectionProps) {
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
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {Object.entries(cell.guidance).map(([title, v]) => (
                          <Chip
                            key={title}
                            label={title}
                            value={`${v.high}/${v.low}`}
                            matched={
                              entered(cell.high) === v.high &&
                              entered(cell.low) === v.low &&
                              !(v.high === 0 && v.low === 0)
                            }
                            onFill={() =>
                              mutate((fc) => {
                                fc.temps[z.id][per.key].high = v.high
                                fc.temps[z.id][per.key].low = v.low
                              })
                            }
                          />
                        ))}
                        {previousBody?.temps?.[z.id]?.[per.key] &&
                          entered(previousBody.temps[z.id][per.key].high) != null && (
                            <Chip
                              label="Prev"
                              value={`${previousBody.temps[z.id][per.key].high}/${previousBody.temps[z.id][per.key].low}`}
                              matched={false}
                              onFill={() =>
                                mutate((fc) => {
                                  const prev = previousBody.temps?.[z.id]?.[per.key]
                                  if (!prev) return
                                  fc.temps[z.id][per.key].high = entered(prev.high)
                                  fc.temps[z.id][per.key].low = entered(prev.low)
                                })
                              }
                            />
                          )}
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

export function WindTable({ forecast, zones, mutate, previousBody }: SectionProps) {
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
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {Object.entries(cell.guidance).map(([title, v]) => (
                          <Chip
                            key={title}
                            label={title}
                            value={`${v.dir} ${v.speed}`}
                            matched={
                              cell.dir === v.dir && entered(cell.speed) === v.speed && v.speed !== 0
                            }
                            onFill={() =>
                              mutate((fc) => {
                                fc.wind[z.id][b.key].dir = v.dir
                                fc.wind[z.id][b.key].speed = v.speed
                              })
                            }
                          />
                        ))}
                        {previousBody?.wind?.[z.id]?.[b.key]?.dir && (
                          <Chip
                            label="Prev"
                            value={`${previousBody.wind[z.id][b.key].dir} ${previousBody.wind[z.id][b.key].speed}`}
                            matched={false}
                            onFill={() =>
                              mutate((fc) => {
                                const prev = previousBody.wind?.[z.id]?.[b.key]
                                if (!prev) return
                                fc.wind[z.id][b.key].dir = prev.dir
                                fc.wind[z.id][b.key].speed = entered(prev.speed)
                              })
                            }
                          />
                        )}
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
