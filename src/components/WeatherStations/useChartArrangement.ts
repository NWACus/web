'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ChartPrefs } from './stationGraphPrefs'
import {
  defaultChartPrefs,
  loadChartPrefs,
  saveChartPrefs,
  swapWithNeighbor,
} from './stationGraphPrefs'
import type { GraphPreset } from './stationGraphPresets'

// Chart order and visibility for the Graphs tab, persisted per browser.
// Prefs load after mount (localStorage is browser-only); saves wait for that
// load so defaults never clobber a stored arrangement. Moves swap with the
// nearest chart the user can actually see: hidden charts and charts whose
// fetch came back empty (sensor absent on this station) are skipped.
export function useChartArrangement(presets: GraphPreset[]) {
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

  const [emptyKeys, setEmptyKeys] = useState<ReadonlySet<string>>(new Set())
  const onEmptyChange = useCallback((key: string, empty: boolean) => {
    setEmptyKeys((prev) => {
      if (prev.has(key) === empty) return prev
      const next = new Set(prev)
      if (empty) next.add(key)
      else next.delete(key)
      return next
    })
  }, [])

  const presetByKey = useMemo(() => new Map(presets.map((p) => [p.key, p])), [presets])
  const orderedPresets = useMemo(
    () => prefs.order.flatMap((key) => presetByKey.get(key) ?? []),
    [prefs.order, presetByKey],
  )

  const isSkippable = (key: string) => prefs.hidden.includes(key) || emptyKeys.has(key)

  return {
    visiblePresets: orderedPresets.filter((p) => !prefs.hidden.includes(p.key)),
    hiddenPresets: orderedPresets.filter((p) => prefs.hidden.includes(p.key)),
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
    onEmptyChange,
  }
}
