// Battery-voltage monitoring, ported from Django's `Measurement.save()` hook
// (nwac/apps/weatherstations/models.py). Anything outside 11-17V needs looking
// into, so a station that leaves the range alerts once and is then muted in
// `stationAlerts` until someone re-enables it -- otherwise a known fault waiting
// on a repair trip would mail every hour. The mute, not the reading history, is
// what stops repeats.

export const BATTERY_VOLTAGE = 'battery_voltage'

export type BatteryThresholds = {
  low: number
  /** Voltage at or above this is unhealthy too, not just a low battery. */
  high?: number
  /** Readings that must agree before a station is considered breached. */
  consecutive: number
  /** Readings older than this are treated as absent, not as healthy. */
  staleHours: number
}

// Fixed rather than environment-driven: these describe NWAC's hardware, so they
// should change under review alongside the logic that reads them.
export const BATTERY_THRESHOLDS: BatteryThresholds = {
  low: 11,
  high: 17,
  consecutive: 3,
  staleHours: 6,
}

export type BatteryStatus = 'ok' | 'low' | 'high' | 'stale' | 'unknown'

export type StationBattery = {
  stid: string
  name: string
  elevation: number | null
  voltage: number | null
  readingAt: string | null
  status: BatteryStatus
}

export type Reading = { at: number; volts: number }

function breaches(volts: number, t: BatteryThresholds): boolean {
  if (volts <= t.low) return true
  return t.high !== undefined && volts >= t.high
}

// SnowObs returns each variable as a column parallel to `date_time`, so a
// reading is only usable when both sides are present at the same index.
export function readingsFor(
  dateTime: unknown[] | undefined,
  voltage: unknown[] | undefined,
): Reading[] {
  if (!dateTime || !voltage) return []
  const out: Reading[] = []
  for (let i = 0; i < dateTime.length; i++) {
    const stamp = dateTime[i]
    const at = typeof stamp === 'string' ? Date.parse(stamp) : NaN
    const volts = voltage[i]
    if (!Number.isNaN(at) && typeof volts === 'number') out.push({ at, volts })
  }
  return out.sort((a, b) => a.at - b.at)
}

/**
 * Derive a station's current state from its recent readings.
 *
 * `consecutive` guards against a single glitch reading muting a healthy station,
 * which would then need a human to un-mute it for no reason. Whether an alert is
 * actually sent depends on the station's `alerting` flag, not on anything here.
 */
export function evaluateStation(
  station: { stid: string; name?: string | null; elevation?: number | null },
  readings: Reading[],
  thresholds: BatteryThresholds,
  now: number,
): StationBattery {
  const base = {
    stid: station.stid,
    name: station.name ?? station.stid,
    elevation: station.elevation ?? null,
  }

  if (readings.length === 0) {
    return { ...base, voltage: null, readingAt: null, status: 'unknown' }
  }

  const latest = readings[readings.length - 1]
  const readingAt = new Date(latest.at).toISOString()

  // A dead logger stops reporting, and its last good reading is not evidence
  // that the battery is fine. Stale is its own state, never "ok".
  if (now - latest.at > thresholds.staleHours * 3_600_000) {
    return { ...base, voltage: latest.volts, readingAt, status: 'stale' }
  }

  const tail = readings.slice(-thresholds.consecutive)
  const breaching =
    tail.length >= thresholds.consecutive && tail.every((r) => breaches(r.volts, thresholds))

  const status: BatteryStatus = !breaching
    ? 'ok'
    : thresholds.high !== undefined && latest.volts >= thresholds.high
      ? 'high'
      : 'low'

  return { ...base, voltage: latest.volts, readingAt, status }
}
