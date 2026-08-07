import { readLocalStorage, writeLocalStorage } from '@/utilities/safeLocalStorage'

// Per-browser chart arrangement for the station Graphs tab: preset order plus
// hidden charts, persisted to localStorage.

export type ChartPrefs = { order: string[]; hidden: string[] }

const STORAGE_KEY = 'nwac-station-graph-prefs'

export function defaultChartPrefs(presetKeys: string[]): ChartPrefs {
  return { order: [...presetKeys], hidden: [] }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

function isStoredPrefs(value: unknown): value is ChartPrefs {
  return (
    typeof value === 'object' &&
    value !== null &&
    'order' in value &&
    'hidden' in value &&
    isStringArray(value.order) &&
    isStringArray(value.hidden)
  )
}

// Stored prefs survive preset changes: unknown keys drop out, presets added
// since the save append in their default position.
export function reconcileChartPrefs(stored: ChartPrefs, presetKeys: string[]): ChartPrefs {
  const known = new Set(presetKeys)
  const order = stored.order.filter((key) => known.has(key))
  for (const key of presetKeys) {
    if (!order.includes(key)) order.push(key)
  }
  return { order, hidden: stored.hidden.filter((key) => known.has(key)) }
}

export function loadChartPrefs(presetKeys: string[]): ChartPrefs {
  const raw = readLocalStorage(STORAGE_KEY)
  if (!raw) return defaultChartPrefs(presetKeys)
  try {
    const parsed: unknown = JSON.parse(raw)
    return isStoredPrefs(parsed)
      ? reconcileChartPrefs(parsed, presetKeys)
      : defaultChartPrefs(presetKeys)
  } catch {
    return defaultChartPrefs(presetKeys)
  }
}

export function saveChartPrefs(prefs: ChartPrefs): void {
  writeLocalStorage(STORAGE_KEY, JSON.stringify(prefs))
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
