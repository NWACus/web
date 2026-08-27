'use client'

// The MWF editor shell: builds the working forecast model from the tenant's
// config + the stored body, renders the seven sections, and autosaves with a
// debounce. Saving over a published forecast silently opens a correction
// draft (the server returns the new id/revision and the editor adopts them).
// Publish runs through the validation-gated modal; published forecasts can be
// withdrawn; withdrawn forecasts are read-only.
import {
  MwfForecast,
  applyGuidance,
  applyTempsGuidance,
  applyWindsGuidance,
  emptyExtendedSnowLevel,
  emptyForecast,
  hydrateForecast,
  periodDate,
  serializeForecast,
  type SerializedForecast,
} from '@/utilities/mwf/mwfData'
import { Button, toast } from '@payloadcms/ui'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { GuidanceBundle, LoadedForecast } from './actions'
import { publishForecastAction, removeForecastAction, saveDraftAction } from './actions'
import { toPrecipOverlay, toTempsOverlay, toWindsOverlay } from './guidanceAdapters'
import { PublishModal } from './PublishModal'
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

function buildModel(initial: LoadedForecast, guidance: GuidanceBundle | null): MwfForecast {
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
  if (guidance) {
    const precip = toPrecipOverlay(guidance.precip)
    if (precip) applyGuidance(fc, precip)
    const temps = toTempsOverlay(guidance.temps)
    if (temps) applyTempsGuidance(fc, temps, initial.config.airfireCodeMap)
    const winds = toWindsOverlay(guidance.winds)
    if (winds) applyWindsGuidance(fc, winds, initial.config.airfireCodeMap)
  }
  return fc
}

type SaveState = 'saved' | 'dirty' | 'saving' | 'error'

// Scrollspy pills over the section anchors (the dashboard-v2 editor's nav).
function SectionNav({ sections }: { sections: Array<{ id: string; label: string }> }) {
  const [active, setActive] = useState(sections[0]?.id)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-96px 0px -60% 0px' },
    )
    sections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [sections])
  return (
    <nav className="mwf-section-nav" aria-label="Forecast sections">
      {sections.map(({ id, label }) => (
        <a
          key={id}
          className={`mwf-pill ${active === id ? 'mwf-pill--active' : ''}`}
          href={`#${id}`}
        >
          {label}
        </a>
      ))}
    </nav>
  )
}

export function MwfEditorClient({
  initial,
  guidance,
}: {
  initial: LoadedForecast
  guidance: GuidanceBundle | null
}) {
  const router = useRouter()
  const [forecast, setForecast] = useState<MwfForecast>(() => buildModel(initial, guidance))
  const [docId, setDocId] = useState(initial.id)
  const [status, setStatus] = useState(initial.status)
  const [revision, setRevision] = useState(initial.revision)
  const [isCorrection, setIsCorrection] = useState(initial.isCorrection)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [showPublish, setShowPublish] = useState(false)
  const [publishing, setPublishing] = useState(false)
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
  const readOnly = status === 'withdrawn'

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
      return false
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
    return true
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
      if (readOnly) return
      setForecast((prev) => {
        const next = structuredClone(prev)
        fn(next)
        latest.current.body = serializeForecast(next)
        latest.current.issuedAt = next.meta.issued
        return next
      })
      scheduleSave()
    },
    [scheduleSave, readOnly],
  )

  // Cancel the debounce and persist whatever is pending before publishing.
  const flushSave = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current)
    return save()
  }, [save])

  const publish = useCallback(
    async (issuedAt: string) => {
      setPublishing(true)
      try {
        latest.current.issuedAt = issuedAt
        setForecast((prev) => {
          const next = structuredClone(prev)
          next.meta.issued = issuedAt
          latest.current.body = serializeForecast(next)
          return next
        })
        if (!(await flushSave())) return
        const result = await publishForecastAction(latest.current.id)
        if ('error' in result) {
          toast.error(result.error)
          return
        }
        setStatus('published')
        setShowPublish(false)
        const scheduled = new Date(issuedAt).getTime() > Date.now()
        toast.success(scheduled ? `Publish scheduled for ${issuedAt}` : 'Forecast published')
      } finally {
        setPublishing(false)
      }
    },
    [flushSave],
  )

  const withdraw = useCallback(async () => {
    if (
      !window.confirm(
        'Withdraw this published forecast? The issuance disappears from the public site.',
      )
    )
      return
    const result = await removeForecastAction(docId)
    if ('error' in result) {
      toast.error(result.error)
      return
    }
    toast.success('Forecast withdrawn')
    router.push('/admin/mwf')
  }, [docId, router])

  const deleteDraft = useCallback(async () => {
    if (!window.confirm('Delete this draft outright?')) return
    const result = await removeForecastAction(docId)
    if ('error' in result) {
      toast.error(result.error)
      return
    }
    toast.success('Draft deleted')
    router.push('/admin/mwf')
  }, [docId, router])

  const sectionProps = {
    forecast,
    zones,
    points,
    extendedZones,
    mutate,
    previousBody: initial.previousBody,
    previousLabel: initial.previousLabel,
    guidance,
  }
  const saveLabel = {
    saved: 'Saved',
    dirty: 'Unsaved changes…',
    saving: 'Saving…',
    error: 'Save failed — retrying on next change',
  }[saveState]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link className="mwf-link text-sm" href="/admin/mwf">
            ← Forecasts
          </Link>
          <h2 className="m-0 text-lg font-semibold capitalize">
            {initial.issuance} Forecast · {periodDate(forecast.meta.initialDate, 0)}
          </h2>
          <span className={`mwf-status-chip mwf-status-chip--${status}`}>
            {status}
            {isCorrection ? ` · correction r${revision}` : revision > 1 ? ` · r${revision}` : ''}
          </span>
          {!readOnly && (
            <label className="flex items-center gap-1 text-xs">
              Issue time
              <input
                type="datetime-local"
                className="mwf-input mwf-input--inline"
                value={forecast.meta.issued}
                onChange={(e) =>
                  mutate((fc) => {
                    fc.meta.issued = e.target.value
                  })
                }
              />
            </label>
          )}
        </div>
        <div className="flex items-center gap-3">
          {initial.authorName && (
            <span className="mwf-muted text-xs">
              Forecaster <span className="font-medium">{initial.authorName}</span>
            </span>
          )}
          <span className="mwf-muted text-xs" data-testid="mwf-save-state" role="status">
            {saveLabel} · #{docId}
          </span>
          {status === 'draft' && (
            <>
              <Button size="small" buttonStyle="secondary" onClick={deleteDraft}>
                Delete draft
              </Button>
              <Button size="small" onClick={() => setShowPublish(true)}>
                {isCorrection ? 'Publish correction…' : 'Publish…'}
              </Button>
            </>
          )}
          {status === 'published' && (
            <Button size="small" buttonStyle="secondary" onClick={withdraw}>
              Withdraw
            </Button>
          )}
        </div>
      </div>

      {status === 'published' && (
        <p className="mwf-banner mwf-banner--info">
          This product is published — it is immutable, and your first edit silently opens a
          correction draft.
        </p>
      )}
      {readOnly && (
        <p className="mwf-banner mwf-banner--danger">
          This forecast was withdrawn and is read-only.
        </p>
      )}
      {guidance?.stale && (
        <p className="mwf-banner mwf-banner--warning">
          Model guidance is stale — showing the last good run. A refresh failure never blanks the
          working columns.
        </p>
      )}

      <SectionNav
        sections={[
          { id: 'mwf-discussion', label: 'Discussion' },
          { id: 'mwf-precip', label: 'QPF · Density · Snow' },
          { id: 'mwf-snow-level', label: 'Snow / Freezing Level' },
          ...(initial.issuance === 'afternoon' && extendedZones.length
            ? [{ id: 'mwf-extended', label: 'Extended Snow Level' }]
            : []),
          { id: 'mwf-temps', label: 'Temperatures' },
          { id: 'mwf-wind', label: 'Ridgeline Wind' },
          { id: 'mwf-sensible', label: 'Sensible Weather' },
        ]}
      />

      <Discussion {...sectionProps} />
      <PrecipGrid {...sectionProps} />
      <SnowLevelTable {...sectionProps} />
      <ExtendedSnowLevelTable {...sectionProps} />
      <TempTable {...sectionProps} />
      <WindTable {...sectionProps} />
      <SensibleWeather {...sectionProps} />

      {showPublish && (
        <PublishModal
          forecast={forecast}
          zones={zones}
          points={points}
          extendedZones={extendedZones}
          isCorrection={isCorrection}
          busy={publishing}
          onConfirm={publish}
          onClose={() => setShowPublish(false)}
        />
      )}
    </div>
  )
}
