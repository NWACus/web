'use client'

import { Button } from '@/components/ui/button'
import type { StationTables } from '@/services/snowobs/tableHelpers'
import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DateRange } from './stationPeriods'
import { tableChunk } from './stationPeriods'
import { mergeTables } from './stationTableMerge'

/** A long range's unrendered rows: everything before `before`, and whose rows they are. */
export type OlderRows = {
  range: DateRange
  before: string
  source: { page: string } | { station: string }
}

async function fetchChunk(older: OlderRows, chunk: DateRange): Promise<StationTables> {
  const params = new URLSearchParams({ ...older.source, from: chunk.from, to: chunk.to })
  const response = await fetch(`/weather/table-data?${params.toString()}`)
  if (!response.ok) throw new Error(`table-data answered ${response.status}`)
  return response.json()
}

type Loaded = { key: string; chunks: StationTables[]; before: string | null }
type Progress = { key: string; status: 'idle' | 'loading' | 'failed' }

/** Loads a range's older days a chunk at a time, starting over when the range changes. */
export function useOlderTableRows(older: OlderRows | null) {
  const key = older ? `${older.range.from}/${older.range.to}/${older.before}` : ''
  const [loaded, setLoaded] = useState<Loaded>({ key, chunks: [], before: older?.before ?? null })
  const [progress, setProgress] = useState<Progress>({ key, status: 'idle' })
  const status = progress.key === key ? progress.status : 'idle'
  const current: Loaded =
    loaded.key === key ? loaded : { key, chunks: [], before: older?.before ?? null }

  const { before } = current
  const load = useCallback(async () => {
    if (!older || !before) return
    setProgress({ key, status: 'loading' })
    const { chunk, next } = tableChunk(older.range, before)
    try {
      const tables = await fetchChunk(older, chunk)
      setLoaded({ key, chunks: [...current.chunks, tables], before: next })
      setProgress({ key, status: 'idle' })
    } catch {
      setProgress({ key, status: 'failed' })
    }
  }, [older, before, key, current.chunks])

  const merged = useCallback(
    (tables: StationTables) => mergeTables(tables, current.chunks),
    [current.chunks],
  )
  return useMemo(() => ({ before, status, load, merged }), [before, status, load, merged])
}

/** Loads the next rows as the reader nears the table's end; the button covers everyone else. */
export function OlderTableRows({ rows }: { rows: ReturnType<typeof useOlderTableRows> }) {
  const { before, status, load } = rows
  const sentinel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = sentinel.current
    if (!element || !before || status !== 'idle') return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void load()
      },
      { rootMargin: '800px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [before, status, load])

  if (!before) return null
  return (
    <div ref={sentinel} className="flex flex-col items-center gap-2 py-4">
      {status === 'failed' && (
        <p role="alert" className="text-sm text-muted-foreground">
          Older days didn&apos;t load.
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={status === 'loading'}
        onClick={() => void load()}
      >
        {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {status === 'failed' ? 'Try again' : 'Load older days'}
      </Button>
    </div>
  )
}
