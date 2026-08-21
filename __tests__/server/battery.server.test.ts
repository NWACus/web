import {
  BATTERY_THRESHOLDS,
  BatteryThresholds,
  evaluateStation,
} from '@/services/snowobs/batteryEvaluation'

const HOUR = 3_600_000
const NOW = Date.parse('2026-08-21T00:00:00Z')
const station = { stid: '57', name: 'White Chuck Mountain', elevation: 5030 }

/** Hourly readings ending at `now`, oldest first. */
function series(volts: number[], now = NOW) {
  return volts.map((v, i) => ({ at: now - (volts.length - 1 - i) * HOUR, volts: v }))
}

const thresholds: BatteryThresholds = BATTERY_THRESHOLDS

describe('evaluateStation', () => {
  it('reports ok inside the healthy range', () => {
    expect(evaluateStation(station, series([13, 13, 14, 13]), thresholds, NOW).status).toBe('ok')
  })

  it('reports low at or below the low threshold', () => {
    const result = evaluateStation(station, series([13, 13, 11, 11, 11]), thresholds, NOW)
    expect(result.status).toBe('low')
    expect(result.voltage).toBe(11)
  })

  it('reports high at or above the high threshold', () => {
    // Django's range is 11-17 and Dennis confirmed >17V is a real fault worth
    // investigating, not just a charging peak.
    const result = evaluateStation(station, series([13, 14, 17, 17, 17]), thresholds, NOW)
    expect(result.status).toBe('high')
  })

  it('stays low for as long as the battery is low', () => {
    // Repeats are prevented by the mute in `stationAlerts`, not by this function
    // -- White Chuck read 11V for 336 consecutive hourly readings.
    expect(evaluateStation(station, series(Array(48).fill(11)), thresholds, NOW).status).toBe('low')
  })

  it('requires consecutive breaching readings, so one glitch cannot mute a station', () => {
    expect(evaluateStation(station, series([13, 13, 13, 11]), thresholds, NOW).status).toBe('ok')
  })

  it('ignores a transient spike that recovers', () => {
    expect(evaluateStation(station, series([13, 18, 13, 13, 13]), thresholds, NOW).status).toBe(
      'ok',
    )
  })

  it('treats an old last reading as stale rather than healthy', () => {
    const result = evaluateStation(station, series([13, 13, 13], NOW - 12 * HOUR), thresholds, NOW)
    expect(result.status).toBe('stale')
  })

  it('reports unknown when a station has no battery readings', () => {
    const result = evaluateStation(station, [], thresholds, NOW)
    expect(result.status).toBe('unknown')
    expect(result.voltage).toBeNull()
  })

  it('reports ok again once readings return to range', () => {
    expect(evaluateStation(station, series([11, 11, 13, 13, 13]), thresholds, NOW).status).toBe(
      'ok',
    )
  })
})
