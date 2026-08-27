'use client'

// The seven MWF editor sections. Each renders from the shared forecast model
// and mutates through the editor's `mutate` callback, which triggers the
// debounced autosave. Model-guidance overlay columns arrive with the guidance
// milestone; the grids leave room for them.
import type { ModelMeta } from '@/services/mwf/guidance'
import {
  MwfForecast,
  PERIODS,
  SENSIBLE_SLOTS,
  blocksFor,
  deriveSnow,
  deriveSnowLevel,
  extendedBlocksFor,
  periodDate,
  precipPeriodsFor,
  qpfOverPrecise,
  snowLevelBlocksFor,
  tempPeriodsFor,
  zoneBlockQpf,
  type ForecastPoint,
  type SerializedForecast,
  type Zone,
} from '@/utilities/mwf/mwfData'
import React, { useState } from 'react'
import type { GuidanceBundle } from './actions'
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
  // The raw guidance bundle — the sections read per-model meta (run stamp,
  // status) from it for the table footers; cell values arrive via the
  // overlay, not from here.
  guidance?: GuidanceBundle | null
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
      className={`mwf-chip ${matched ? 'mwf-chip--matched' : ''}`}
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
  id,
  title,
  hint,
  children,
}: {
  id: string
  title: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="mwf-section">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mwf-hint mb-3 text-xs">{hint}</p>
      {children}
    </section>
  )
}

// The dashboard-v2-style model attribution footer under a guidance-backed
// table: `WRF3UW1 1.33km · 2026082612` per loaded model, and a visible error
// line per model that didn't load — the generic stale banner says something
// is off, this says which model and why.
function ModelMetaFooter({ models }: { models?: ModelMeta[] | null }) {
  if (!models?.length) return null
  const loaded = models.filter((m) => m.status === 'loaded')
  const failed = models.filter((m) => m.status !== 'loaded')
  return (
    <div className="mwf-model-footer mt-2 text-xs">
      {loaded.length > 0 && (
        <p className="mwf-hint flex flex-wrap gap-x-4 gap-y-1">
          {loaded.map((m) => (
            <span key={m.title} title={m.availableHours ? `hours ${m.availableHours}` : undefined}>
              {m.title} · {m.run ?? '—'}
            </span>
          ))}
        </p>
      )}
      {failed.map((m) => (
        <p
          key={m.title}
          className="mwf-model-footer__error"
          title={m.errors?.length ? m.errors.slice(0, 5).join('\n') : undefined}
        >
          ⚠ {m.title} — {m.status}
        </p>
      ))}
    </div>
  )
}

export function PrecipGrid({
  forecast,
  zones,
  points,
  mutate,
  previousBody,
  guidance,
}: SectionProps) {
  // One metric at a time, like the dashboard-v2 grid: QPF is where guidance
  // model columns + Prev + the single Fx entry live; Density is the SLR grid
  // with per-period quick-sets; Snow is the read-only derived view.
  const [metric, setMetric] = useState<'qpf' | 'density' | 'snow'>('qpf')
  const periods = precipPeriodsFor(forecast.meta.type)
  const zoneName = new Map(zones.map((z) => [z.id, z.name]))
  const hasPrev = Boolean(previousBody?.precip && Object.keys(previousBody.precip).length)
  // Model titles present in any cell — one guidance column per model.
  const titles = Array.from(
    new Set(
      points.flatMap((pt) =>
        periods.flatMap((per) => Object.keys(forecast.precip[pt.code]?.[per.key]?.guidance ?? {})),
      ),
    ),
  )

  const prevQpf = (code: string, periodKey: string) =>
    entered(previousBody?.precip?.[code]?.[periodKey]?.qpf)

  const fillColumn = (periodKey: string, value: (code: string) => number | null) =>
    mutate((fc) => {
      points.forEach((pt) => {
        const v = value(pt.code)
        if (v != null) fc.precip[pt.code][periodKey].qpf = v
      })
    })

  const pointCell = (pt: ForecastPoint) => (
    <td className="px-2 py-1.5">
      <div>{pt.name}</div>
      <div className="text-xs opacity-70">
        {pt.code} · {zoneName.get(pt.zone) ?? pt.zone}
      </div>
    </td>
  )

  const periodHead = (per: (typeof periods)[number], colSpan = 1) => (
    <th key={per.key} className="px-2 py-1.5 text-center" colSpan={colSpan}>
      <div className="font-medium">{periodDate(forecast.meta.initialDate, per.dayOffset)}</div>
      <div className="text-xs font-normal opacity-70">{per.kind === 'night' ? 'Night' : 'Day'}</div>
    </th>
  )

  return (
    <Section
      id="mwf-precip"
      title="QPF · Density · Snow"
      hint="Per-point, 12-hour blocks. Snow is derived (QPF × 100 / density) and not editable. Density is needed only where QPF > 0."
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="mwf-hint text-xs">Showing</span>
        <div className="mwf-seg" role="group" aria-label="Precipitation metric">
          {(['qpf', 'density', 'snow'] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={metric === m ? 'mwf-seg--active' : ''}
              onClick={() => setMetric(m)}
            >
              {m === 'qpf' ? 'QPF' : m === 'density' ? 'Density' : 'Snow'}
            </button>
          ))}
        </div>
      </div>

      {metric === 'qpf' && (
        <div className="overflow-x-auto">
          <table className="mwf-table w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left">
                <th className="px-2 py-1.5 font-medium" rowSpan={2}>
                  Forecast point
                </th>
                {periods.map((per) => periodHead(per, titles.length + (hasPrev ? 1 : 0) + 1))}
                <th className="px-2 py-1.5 text-center" rowSpan={2}>
                  Σ QPF
                </th>
              </tr>
              <tr>
                {periods.map((per) => (
                  <React.Fragment key={per.key}>
                    {titles.map((title) => (
                      <th key={title} className="px-1 py-1 text-center">
                        <button
                          type="button"
                          title={`Fill every point's ${per.short} QPF from ${title}`}
                          className="mwf-mini-btn font-normal"
                          onClick={() =>
                            fillColumn(per.key, (code) => {
                              const g = forecast.precip[code]?.[per.key]?.guidance[title]
                              return g ?? null
                            })
                          }
                        >
                          ⇩ {title}
                        </button>
                      </th>
                    ))}
                    {hasPrev && (
                      <th className="px-1 py-1 text-center">
                        <button
                          type="button"
                          title={`Fill every point's ${per.short} QPF from the previous forecast`}
                          className="mwf-mini-btn font-normal"
                          onClick={() => fillColumn(per.key, (code) => prevQpf(code, per.key))}
                        >
                          ⇩ Prev
                        </button>
                      </th>
                    )}
                    <th className="mwf-fx-head px-1 py-1 text-center">Fx</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {points.map((pt) => {
                const rowValues = periods.map((per) => forecast.precip[pt.code]?.[per.key])
                const any = rowValues.some((c) => c && c.qpf != null && c.qpf !== '')
                const sum = rowValues.reduce((acc, c) => acc + (Number(c?.qpf) || 0), 0)
                return (
                  <tr key={pt.code}>
                    {pointCell(pt)}
                    {periods.map((per) => {
                      const cell = forecast.precip[pt.code]?.[per.key]
                      if (!cell) return <td key={per.key} colSpan={titles.length + 2} />
                      const fx = entered(cell.qpf)
                      const prev = prevQpf(pt.code, per.key)
                      return (
                        <React.Fragment key={per.key}>
                          {titles.map((title) => {
                            const value = cell.guidance[title]
                            return (
                              <td key={title} className="px-1 py-1.5 text-center">
                                {value == null ? (
                                  <span className="mwf-muted">–</span>
                                ) : (
                                  <button
                                    type="button"
                                    title={`${title}: click to fill`}
                                    className={`mwf-guidance-val ${
                                      fx === value && value !== 0 ? 'mwf-guidance-val--matched' : ''
                                    }`}
                                    onClick={() =>
                                      mutate((fc) => {
                                        fc.precip[pt.code][per.key].qpf = value
                                      })
                                    }
                                  >
                                    {value.toFixed(2)}
                                  </button>
                                )}
                              </td>
                            )
                          })}
                          {hasPrev && (
                            <td className="px-1 py-1.5 text-center">
                              {prev == null ? (
                                <span className="mwf-muted">–</span>
                              ) : (
                                <button
                                  type="button"
                                  title="Prev: click to fill"
                                  className={`mwf-guidance-val ${
                                    fx === prev && prev !== 0 ? 'mwf-guidance-val--matched' : ''
                                  }`}
                                  onClick={() =>
                                    mutate((fc) => {
                                      fc.precip[pt.code][per.key].qpf = prev
                                    })
                                  }
                                >
                                  {prev.toFixed(2)}
                                </button>
                              )}
                            </td>
                          )}
                          <td className="px-1 py-1.5">
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
                          </td>
                        </React.Fragment>
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
      )}

      {metric === 'density' && (
        <div className="overflow-x-auto">
          <table className="mwf-table w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left">
                <th className="px-2 py-1.5 font-medium">
                  Forecast point
                  <span className="mwf-hint block text-xs font-normal">SLR quick-set →</span>
                </th>
                {periods.map((per) => (
                  <th key={per.key} className="min-w-28 px-2 py-1.5 text-center">
                    <div className="font-medium">
                      {periodDate(forecast.meta.initialDate, per.dayOffset)}
                    </div>
                    <div className="text-xs font-normal opacity-70">
                      {per.kind === 'night' ? 'Night' : 'Day'}
                    </div>
                    <div className="mt-0.5 flex justify-center gap-1">
                      {[0, 10].map((v) => (
                        <button
                          key={v}
                          type="button"
                          title={`Set every point's ${per.short} SLR to ${v}`}
                          className="mwf-mini-btn"
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
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {points.map((pt) => (
                <tr key={pt.code}>
                  {pointCell(pt)}
                  {periods.map((per) => {
                    const cell = forecast.precip[pt.code]?.[per.key]
                    if (!cell) return <td key={per.key} />
                    return (
                      <td key={per.key} className="px-1.5 py-1.5">
                        <NumberCell
                          ariaLabel={`${pt.code} ${per.short} density`}
                          value={cell.density}
                          onChange={(v) =>
                            mutate((fc) => {
                              fc.precip[pt.code][per.key].density = v
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
      )}

      {metric === 'snow' && (
        <div className="overflow-x-auto">
          <table className="mwf-table w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left">
                <th className="px-2 py-1.5 font-medium">Forecast point</th>
                {periods.map((per) => periodHead(per))}
                <th className="px-2 py-1.5 text-center">Sum</th>
              </tr>
            </thead>
            <tbody>
              {points.map((pt) => {
                const values = periods.map((per) => {
                  const cell = forecast.precip[pt.code]?.[per.key]
                  return cell ? deriveSnow(cell.qpf, cell.density) : null
                })
                const any = values.some((v) => v != null)
                const sum = values.reduce((acc: number, v) => acc + (v ?? 0), 0)
                return (
                  <tr key={pt.code}>
                    {pointCell(pt)}
                    {values.map((v, i) => (
                      <td key={periods[i].key} className="px-2 py-1.5 text-center tabular-nums">
                        {v == null ? <span className="mwf-muted">—</span> : v.toFixed(1)}
                      </td>
                    ))}
                    <td className="px-2 py-1.5 text-center font-medium tabular-nums">
                      {any ? sum.toFixed(1) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <ModelMetaFooter models={guidance?.precip?.models} />
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
  // Mornings carry 6 snow-level blocks; wind still uses the full window.
  const blocks = snowLevelBlocksFor(forecast.meta.type)
  return (
    <Section
      id="mwf-snow-level"
      title="Snow & Freezing Level"
      hint="Zone-scale, 6-hour blocks, nearest 500 ft (arrow keys step). The snow/freezing designation auto-sets from precip — click it to override."
    >
      {previousBody?.snowLevel && (
        <button
          type="button"
          className="mwf-mini-btn mb-2"
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
        <table className="mwf-table w-full border-separate border-spacing-0 text-sm">
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
              <tr key={z.id}>
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
                      <div className="flex items-center gap-1">
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
                          aria-label={`${z.id} ${b.key} designation: ${designation}`}
                          className={`mwf-designation-icon ${
                            designation === 'snow'
                              ? 'mwf-designation--snow'
                              : 'mwf-designation--freezing'
                          }`}
                          onClick={() =>
                            mutate((fc) => {
                              fc.snowLevel[z.id][b.key].mode =
                                designation === 'snow' ? 'freezing' : 'snow'
                            })
                          }
                        >
                          {designation === 'snow' ? '❄' : '💧'}
                          {designation === 'snow' && level != null && (
                            <span className="mwf-designation-level">{level}</span>
                          )}
                        </button>
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-1">
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
      id="mwf-extended"
      title="Extended Snow Level Outlook"
      hint="Afternoon issuances only — four coarse blocks out to day 5, for the configured outlook zones."
    >
      <div className="overflow-x-auto">
        <table className="mwf-table w-full border-separate border-spacing-0 text-sm">
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
              <tr key={z.id}>
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

export function TempTable({ forecast, zones, mutate, previousBody, guidance }: SectionProps) {
  // Temps cover the issuance's first two periods (PR #158).
  const periods = tempPeriodsFor(forecast.meta.type)
  return (
    <Section
      id="mwf-temps"
      title="Temperatures (5,000 ft)"
      hint="High / low per zone per 12-hour period. A high below its low is flagged live and blocks publish."
    >
      <div className="overflow-x-auto">
        <table className="mwf-table w-full border-separate border-spacing-0 text-sm">
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
              <tr key={z.id}>
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
      <ModelMetaFooter models={guidance?.temps?.models} />
    </Section>
  )
}

export function WindTable({ forecast, zones, mutate, previousBody, guidance }: SectionProps) {
  const blocks = blocksFor(forecast.meta.type)
  return (
    <Section
      id="mwf-wind"
      title="Ridgeline Winds"
      hint="Direction (compass points incl. VAR — invalid entries clear) and speed per zone per 6-hour block."
    >
      <div className="overflow-x-auto">
        <table className="mwf-table w-full border-separate border-spacing-0 text-sm">
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
              <tr key={z.id}>
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
      <ModelMetaFooter models={guidance?.winds?.models} />
    </Section>
  )
}

export function SensibleWeather({ forecast, zones, mutate }: SectionProps) {
  return (
    <Section
      id="mwf-sensible"
      title="Sensible Weather"
      hint="Plain-language summary per zone: Today / Tonight and Tomorrow."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {zones.map((z) => {
          const slots = forecast.sensible[z.id]
          if (!slots) return null
          return (
            <div key={z.id} className="flex flex-col gap-1.5">
              <div className="text-sm font-medium">{z.name}</div>
              {SENSIBLE_SLOTS.map((slot) => (
                <label key={slot.key} className="flex flex-col gap-0.5">
                  <span className="mwf-hint text-xs">{slot.label}</span>
                  <textarea
                    aria-label={`${z.id} ${slot.label}`}
                    className="mwf-textarea min-h-16"
                    value={slots[slot.key]}
                    onChange={(e) =>
                      mutate((fc) => {
                        fc.sensible[z.id][slot.key] = e.target.value
                      })
                    }
                  />
                </label>
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
    <Section
      id="mwf-discussion"
      title="Discussion"
      hint="Free-form synopsis (required to publish) and extended outlook (optional)."
    >
      <div className="flex flex-col gap-3">
        <textarea
          aria-label="Synopsis"
          placeholder="Synopsis"
          className="mwf-textarea min-h-24"
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
          className="mwf-textarea min-h-24"
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
