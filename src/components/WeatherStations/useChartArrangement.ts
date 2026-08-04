'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ChartPrefs } from './stationGraphPrefs'
import {
  defaultChartPrefs,
  loadChartPrefs,
  saveChartPrefs,
  swapWithNeighbor,
} from './stationGraphPrefs'
import type { GraphPreset } from './stationGraphPresets'

// Chart order and visibility, persisted per browser. Saves wait for the
// post-mount localStorage load so defaults never clobber a stored arrangement.
// `emptyKeys` (sensors absent on this station) only filters what renders, so
// one station's missing sensors never rewrite the stored order.
export function useChartArrangement(presets: GraphPreset[], emptyKeys: ReadonlySet<string>) {
  const presetKeys = useMemo(() => presets.map((p) => p.key), [presets])
  const [prefs, setPrefs] = useState<ChartPrefs>(() => defaultChartPrefs(presetKeys))
  const [prefsLoaded, setPrefsLoaded] = useState(false)
  useEffect(() => {
    setPrefs(loadChartPrefs(presetKeys))
    setPrefsLoaded(true)
  }, [presetKeys])
  useEffect(() => {
    if (prefsLoaded) saveChartPrefs(prefs)
  }, [prefs, prefsLoaded])

  const presetByKey = useMemo(() => new Map(presets.map((p) => [p.key, p])), [presets])
  const orderedPresets = useMemo(
    () => prefs.order.flatMap((key) => presetByKey.get(key) ?? []),
    [prefs.order, presetByKey],
  )

  const isSkippable = (key: string) => prefs.hidden.includes(key) || emptyKeys.has(key)

  return {
    visiblePresets: orderedPresets.filter(
      (p) => !prefs.hidden.includes(p.key) && !emptyKeys.has(p.key),
    ),
    hiddenPresets: orderedPresets.filter(
      (p) => prefs.hidden.includes(p.key) && !emptyKeys.has(p.key),
    ),
    canMove: (key: string, direction: -1 | 1) =>
      swapWithNeighbor(prefs.order, key, direction, isSkippable) !== prefs.order,
    moveChart: (key: string, direction: -1 | 1) =>
      setPrefs((prev) => ({
        ...prev,
        order: swapWithNeighbor(prev.order, key, direction, isSkippable),
      })),
    hideChart: (key: string) => setPrefs((prev) => ({ ...prev, hidden: [...prev.hidden, key] })),
    showChart: (key: string) =>
      setPrefs((prev) => ({ ...prev, hidden: prev.hidden.filter((k) => k !== key) })),
  }
}
