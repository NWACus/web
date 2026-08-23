'use client'

import { useMemo, useState } from 'react'
import type { ChartPrefs } from './stationGraphPrefs'
import { defaultChartPrefs, moveToKey, swapWithNeighbor } from './stationGraphPrefs'
import type { GraphPreset } from './stationGraphPresets'

// Chart order and visibility for one visit. `emptyKeys` (sensors absent on this
// station) only filters what renders, so one station's missing sensors never
// rewrite the order.
export function useChartArrangement(presets: GraphPreset[], emptyKeys: ReadonlySet<string>) {
  const [prefs, setPrefs] = useState<ChartPrefs>(() => defaultChartPrefs(presets))

  const presetByKey = useMemo(() => new Map(presets.map((p) => [p.key, p])), [presets])
  const orderedPresets = useMemo(
    () => prefs.order.flatMap((key) => presetByKey.get(key) ?? []),
    [prefs.order, presetByKey],
  )

  return {
    orderedPresets,
    visiblePresets: orderedPresets.filter(
      (p) => !prefs.hidden.includes(p.key) && !emptyKeys.has(p.key),
    ),
    hiddenPresets: orderedPresets.filter(
      (p) => prefs.hidden.includes(p.key) && !emptyKeys.has(p.key),
    ),
    isHidden: (key: string) => prefs.hidden.includes(key),
    canMove: (key: string, direction: -1 | 1) =>
      swapWithNeighbor(prefs.order, key, direction) !== prefs.order,
    moveChart: (key: string, direction: -1 | 1) =>
      setPrefs((prev) => ({ ...prev, order: swapWithNeighbor(prev.order, key, direction) })),
    reorderChart: (key: string, overKey: string) =>
      setPrefs((prev) => ({ ...prev, order: moveToKey(prev.order, key, overKey) })),
    hideChart: (key: string) => setPrefs((prev) => ({ ...prev, hidden: [...prev.hidden, key] })),
    showChart: (key: string) =>
      setPrefs((prev) => ({ ...prev, hidden: prev.hidden.filter((k) => k !== key) })),
    resetArrangement: () => setPrefs(defaultChartPrefs(presets)),
  }
}
