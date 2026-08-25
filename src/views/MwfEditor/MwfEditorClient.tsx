'use client'

// The MWF editor shell: builds the working forecast model from the tenant's
// config + the stored body, renders the seven sections, and autosaves with a
// debounce. Saving over a published forecast silently opens a correction
// draft (the server returns the new id/revision and the editor adopts them).
import {
  MwfForecast,
  emptyExtendedSnowLevel,
  emptyForecast,
  hydrateForecast,
  serializeForecast,
  type SerializedForecast,
} from '@/utilities/mwf/mwfData'
import { toast } from '@payloadcms/ui'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { LoadedForecast } from './actions'
import { saveDraftAction } from './actions'
import {
  Discussion,
  ExtendedSnowLevelTable,
  PrecipGrid,
  SensibleWeather,
  SnowLevelTable,
  TempTable,
  WindTable,
} from './sections'

export const AUTOSAVE_DEBOUNCE_MS = 1200

function buildModel(initial: LoadedForecast): MwfForecast {
  const zones = initial.config.zones
  const extendedZones = zones.filter((z) => initial.config.extendedZoneIds.includes(z.id))
  const fc = emptyForecast(zones, initial.config.points, initial.issuance)
  if (initial.issuance === 'afternoon') {
    fc.extendedSnowLevel = emptyExtendedSnowLevel(extendedZones)
  }
  fc.meta.initialDate = initial.serviceDate
  if (initial.issuedAt) fc.meta.issued = initial.issuedAt.slice(0, 16)
  hydrateForecast(fc, initial.body ?? undefined)
  fc.meta.type = initial.issuance
  fc.meta.initialDate = initial.serviceDate
  return fc
}

type SaveState = 'saved' | 'dirty' | 'saving' | 'error'

export function MwfEditorClient({ initial }: { initial: LoadedForecast }) {
  const [forecast, setForecast] = useState<MwfForecast>(() => buildModel(initial))
  const [docId, setDocId] = useState(initial.id)
  const [status, setStatus] = useState(initial.status)
  const [revision, setRevision] = useState(initial.revision)
  const [isCorrection, setIsCorrection] = useState(initial.isCorrection)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latest = useRef<{ id: number; body: Partial<SerializedForecast>; issuedAt: string | null }>(
    {
      id: initial.id,
      body: initial.body ?? {},
      issuedAt: initial.issuedAt,
    },
  )

  const zones = initial.config.zones
  const points = initial.config.points
  const extendedZones = zones.filter((z) => initial.config.extendedZoneIds.includes(z.id))

  const save = useCallback(async () => {
    setSaveState('saving')
    const result = await saveDraftAction({
      id: latest.current.id,
      issuance: initial.issuance,
      issuedAt: latest.current.issuedAt,
      body: latest.current.body,
    })
    if ('error' in result) {
      setSaveState('error')
      toast.error(result.error)
      return
    }
    if (result.id !== latest.current.id) {
      // The edit landed on a published row: a correction draft was opened.
      latest.current.id = result.id
      setDocId(result.id)
      setIsCorrection(result.isCorrection)
      toast.info(`Opened correction draft r${result.revision}`)
      window.history.replaceState(null, '', `/admin/mwf?id=${result.id}`)
    }
    setStatus('draft')
    setRevision(result.revision)
    setSaveState('saved')
  }, [initial.issuance])

  const scheduleSave = useCallback(() => {
    setSaveState('dirty')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      void save()
    }, AUTOSAVE_DEBOUNCE_MS)
  }, [save])

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const mutate = useCallback(
    (fn: (fc: MwfForecast) => void) => {
      setForecast((prev) => {
        const next = structuredClone(prev)
        fn(next)
        latest.current.body = serializeForecast(next)
        latest.current.issuedAt = next.meta.issued
        return next
      })
      scheduleSave()
    },
    [scheduleSave],
  )

  const sectionProps = { forecast, zones, points, extendedZones, mutate }
  const saveLabel = {
    saved: 'Saved',
    dirty: 'Unsaved changes…',
    saving: 'Saving…',
    error: 'Save failed — retrying on next change',
  }[saveState]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm">
          <Link className="underline" href="/admin/mwf">
            ← Forecasts
          </Link>
          <span className="font-medium capitalize">
            {forecast.meta.initialDate} · {initial.issuance}
          </span>
          <span className="rounded border px-1.5 py-0.5 text-xs capitalize">
            {status}
            {isCorrection ? ` · correction r${revision}` : revision > 1 ? ` · r${revision}` : ''}
          </span>
          <label className="flex items-center gap-1 text-xs">
            Issue time
            <input
              type="datetime-local"
              className="rounded border px-1.5 py-0.5"
              value={forecast.meta.issued}
              onChange={(e) =>
                mutate((fc) => {
                  fc.meta.issued = e.target.value
                })
              }
            />
          </label>
        </div>
        <span className="text-xs opacity-70" role="status">
          {saveLabel} · #{docId}
        </span>
      </div>

      <PrecipGrid {...sectionProps} />
      <SnowLevelTable {...sectionProps} />
      <ExtendedSnowLevelTable {...sectionProps} />
      <TempTable {...sectionProps} />
      <WindTable {...sectionProps} />
      <SensibleWeather {...sectionProps} />
      <Discussion {...sectionProps} />
    </div>
  )
}
