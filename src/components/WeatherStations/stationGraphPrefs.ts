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
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultChartPrefs(presetKeys)
    const parsed: unknown = JSON.parse(raw)
    if (!isStoredPrefs(parsed)) return defaultChartPrefs(presetKeys)
    return reconcileChartPrefs(parsed, presetKeys)
  } catch {
    return defaultChartPrefs(presetKeys)
  }
}

export function saveChartPrefs(prefs: ChartPrefs): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // Private mode / quota errors just lose persistence, never the feature.
  }
}

// Swaps `key` with its nearest neighbor in `direction`, skipping keys the
// caller marks unswappable (hidden charts, charts with no data on this
// station). Returns `order` unchanged when there is no such neighbor.
export function swapWithNeighbor(
  order: string[],
  key: string,
  direction: -1 | 1,
  isSkippable: (key: string) => boolean,
): string[] {
  const from = order.indexOf(key)
  if (from === -1) return order
  let to = from + direction
  while (to >= 0 && to < order.length && isSkippable(order[to])) {
    to += direction
  }
  if (to < 0 || to >= order.length) return order
  const next = [...order]
  next[from] = order[to]
  next[to] = order[from]
  return next
}
