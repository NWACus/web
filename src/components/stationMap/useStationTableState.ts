'use client'

/**
 * The table view's own state: its sort, the station the search picked out, and whether readings
 * that cross a threshold are colored. The sort and the color toggle are saved per center
 * (`./stationMapPrefs`), as the widget saved them.
 */
import { useCallback, useState } from 'react'

import { DEFAULT_TABLE_SORT, nextSort, type TableSort } from '@/services/snowobs/stationMap/table'

import {
  readColorRulesPref,
  readSortPref,
  writeColorRulesPref,
  writeSortPref,
} from './stationMapPrefs'

function isDefaultSort(sort: TableSort): boolean {
  return (
    sort.column === DEFAULT_TABLE_SORT.column && sort.direction === DEFAULT_TABLE_SORT.direction
  )
}

export function useStationTableState(centerSlug: string, initialHighlight: string | null) {
  const [sort, setSort] = useState<TableSort>(() => readSortPref(centerSlug) ?? DEFAULT_TABLE_SORT)
  const [highlighted, setHighlighted] = useState<string | null>(initialHighlight)
  // On unless the reader turned it off, as the widget's toggle defaulted.
  const [colorRulesOn, setColorRulesOn] = useState(() => readColorRulesPref(centerSlug) ?? true)

  const saveSort = useCallback(
    (next: TableSort) => {
      setSort(next)
      writeSortPref(centerSlug, next)
    },
    [centerSlug],
  )

  /** Sort by `column` — or reverse it if it already is — and say what the sort became. */
  const sortBy = useCallback(
    (column: string): TableSort => {
      const next = nextSort(sort, column)
      saveSort(next)
      return next
    },
    [sort, saveSort],
  )

  const changeColorRules = useCallback(
    (on: boolean) => {
      setColorRulesOn(on)
      writeColorRulesPref(centerSlug, on)
    },
    [centerSlug],
  )

  /**
   * The widget's Reset: back to elevation ascending, nothing picked out, and color rules back on
   * (the widget cleared its saved choice, which defaults on).
   */
  const reset = useCallback(() => {
    saveSort(DEFAULT_TABLE_SORT)
    setHighlighted(null)
    changeColorRules(true)
  }, [saveSort, changeColorRules])

  /**
   * Whether Reset has anything of the table's to undo, so it is offered without a filter set —
   * the widget offered it only with one, which left a sort with no Reset.
   */
  const changed = !isDefaultSort(sort) || highlighted !== null

  return {
    sort,
    sortBy,
    highlighted,
    setHighlighted,
    colorRulesOn,
    changeColorRules,
    reset,
    changed,
  }
}

export type StationTableState = ReturnType<typeof useStationTableState>
