import type { GraphPreset } from './stationGraphPresets'

// Chart order and visibility for the Graphs tab. Session-only, so a change to
// the defaults reaches everyone instead of being masked by a stored
// arrangement.

export type ChartPrefs = { order: string[]; hidden: string[] }

export function defaultChartPrefs(presets: GraphPreset[]): ChartPrefs {
  return {
    order: presets.map((p) => p.key),
    hidden: presets.filter((p) => p.defaultHidden).map((p) => p.key),
  }
}

// Swaps `key` with its neighbor in `direction`; returns `order` unchanged
// when there is none.
export function swapWithNeighbor(order: string[], key: string, direction: -1 | 1): string[] {
  const from = order.indexOf(key)
  if (from === -1) return order
  const to = from + direction
  if (to < 0 || to >= order.length) return order
  const next = [...order]
  next[from] = order[to]
  next[to] = order[from]
  return next
}

// Moves `key` to `overKey`'s position, shifting the keys between them.
export function moveToKey(order: string[], key: string, overKey: string): string[] {
  const from = order.indexOf(key)
  const to = order.indexOf(overKey)
  if (from === -1 || to === -1 || from === to) return order
  const next = [...order]
  next.splice(to, 0, ...next.splice(from, 1))
  return next
}
