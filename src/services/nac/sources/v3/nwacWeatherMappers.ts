/** products-api NWAC weather wire → model. Pure; unit-tested. */
import type {
  NWACWeatherForecastDay,
  NWACWeatherGrid,
  NWACWeatherIssuance,
  NWACWeatherLevelCell,
} from '../../model/nwacWeather'
import type {
  NWACWeatherForecastWire,
  NWACWeatherForecastsWire,
} from '../../types/nwacWeatherSchemas'

function grid<Row, Cell>(
  rows: Row[],
  outer: (row: Row) => string,
  inner: (row: Row) => string,
  cell: (row: Row) => Cell,
): NWACWeatherGrid<Cell> {
  const out: NWACWeatherGrid<Cell> = {}
  for (const row of rows) {
    const o = outer(row)
    ;(out[o] ??= {})[inner(row)] = cell(row)
  }
  return out
}

export function mapV3NWACWeatherIssuance(wire: NWACWeatherForecastWire): NWACWeatherIssuance {
  const extendedKeys = new Set(wire.extendedBlocks.map((b) => b.key))
  const level = (row: NWACWeatherForecastWire['snowLevel'][number]): NWACWeatherLevelCell => ({
    freezing: row.freezing ?? null,
    drop: row.drop ?? null,
    mode: row.mode ?? null,
  })

  return {
    id: wire.id,
    type: wire.type,
    issuedAt: wire.issuedAt,
    serviceDate: wire.serviceDate,
    author: wire.author,
    synopsis: wire.synopsis,
    extendedOutlook: wire.extendedOutlook,
    zones: wire.zones.map((z) => ({
      id: z.id,
      name: z.name,
      avalancheZoneId: z.avalancheZoneId ?? null,
    })),
    points: wire.points.map((p) => ({
      code: p.code,
      name: p.name,
      zoneId: p.zoneId ?? null,
      zoneName: p.zone ?? '',
      avalancheZoneId: p.avalancheZoneId ?? null,
    })),
    periods: wire.periods.map((p) => ({
      key: p.key,
      label: p.label,
      short: p.short ?? null,
      kind: p.kind === 'night' ? 'night' : 'day',
      date: p.date,
      precip: p.precip ?? true,
    })),
    blocks: wire.blocks.map((b) => ({
      key: b.key,
      label: b.label,
      part: b.part ?? b.label,
      period: b.period ?? null,
    })),
    extendedBlocks: wire.extendedBlocks.map((b) => ({
      key: b.key,
      label: b.label,
      part: b.part ?? b.label,
      date: b.date,
    })),
    precip: grid(
      wire.precip,
      (r) => r.point,
      (r) => r.period,
      (r) => ({ qpf: r.qpf ?? null, density: r.density ?? null }),
    ),
    temp: grid(
      wire.temp,
      (r) => r.zone,
      (r) => r.period,
      (r) => ({ high: r.high ?? null, low: r.low ?? null }),
    ),
    wind: grid(
      wire.wind,
      (r) => r.zone,
      (r) => r.block,
      (r) => ({ dir: r.dir ?? null, speed: r.speed ?? null }),
    ),
    // The wire folds the extended outlook's levels into `snowLevel`; the extended block keys
    // are the only thing telling them apart.
    snowLevel: grid(
      wire.snowLevel.filter((r) => !extendedKeys.has(r.block)),
      (r) => r.zone,
      (r) => r.block,
      level,
    ),
    extendedSnowLevel: grid(
      wire.snowLevel.filter((r) => extendedKeys.has(r.block)),
      (r) => r.zone,
      (r) => r.block,
      level,
    ),
    sensible: grid(
      wire.sensible,
      (r) => r.zone,
      (r) => r.slot,
      (r) => r.text ?? '',
    ),
  }
}

export function mapV3NWACWeatherForecastDay(
  wire: NWACWeatherForecastsWire,
): NWACWeatherForecastDay | null {
  if (!wire.available || !wire.serviceDate || wire.forecasts.length === 0) return null
  return {
    serviceDate: wire.serviceDate,
    issuances: wire.forecasts.map(mapV3NWACWeatherIssuance),
  }
}
