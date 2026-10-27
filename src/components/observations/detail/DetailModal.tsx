'use client'

/**
 * A record opened over the list — the widget's modal. Its address is the record's own page, so a
 * copied link opens that page, and the browser's back button closes it. The record is fetched
 * prepared (sanitized, galleries arranged) from `/api/<center>/observations/…/<id>` and drawn by
 * the same components as the full page.
 *
 * "Not found" (missing, draft or private upstream) and "couldn't load" are different answers, and
 * both are said plainly rather than showing an empty modal.
 */
import { ChevronLeft, ChevronRight, ExternalLink, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { ObservationKind } from '@/services/nac/model/observation'
import { detailPath, tabPath } from '@/services/nac/observations/routes'

import type { OpenRecord } from '../useViewerLocation'
import { AvalancheDetail } from './AvalancheDetail'
import type { DetailData } from './detailTypes'
import { ObservationDetail } from './ObservationDetail'

type DetailStatus =
  | { state: 'loading' }
  | { state: 'ready'; detail: DetailData }
  | { state: 'not-found' }
  | { state: 'error' }

async function fetchDetail(url: string, signal: AbortSignal): Promise<DetailStatus> {
  const res = await fetch(url, { signal })
  if (res.status === 404) return { state: 'not-found' }
  if (!res.ok) return { state: 'error' }
  const detail: DetailData = await res.json()
  return { state: 'ready', detail }
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

function useDetail(centerSlug: string, record: OpenRecord | null): DetailStatus {
  const [status, setStatus] = useState<DetailStatus>({ state: 'loading' })
  const url = record ? `/api/${centerSlug}${tabPath(record.kind)}/${record.id}` : null
  useEffect(() => {
    if (!url) return
    const controller = new AbortController()
    setStatus({ state: 'loading' })
    fetchDetail(url, controller.signal)
      .then(setStatus)
      .catch((error) => {
        if (!isAbort(error)) setStatus({ state: 'error' })
      })
    return () => controller.abort()
  }, [url])
  return status
}

export const RECORD_TITLES: Record<ObservationKind, string> = {
  observation: 'Field Observation',
  avalanche: 'Avalanche Occurrence',
}

const MESSAGES = {
  'not-found': (noun: string) => ({
    title: 'Not Found',
    body: `The ${noun} doesn’t exist or is private.`,
  }),
  error: (noun: string) => ({
    title: `This ${noun} couldn’t be loaded`,
    body: 'Something went wrong reaching the observation service. Try again in a moment.',
  }),
}

export function DetailMessage({
  status,
  kind,
}: {
  status: 'not-found' | 'error'
  kind: ObservationKind
}) {
  const { title, body } = MESSAGES[status](kind)
  return (
    <div role="alert" className="flex flex-col gap-1 rounded-lg border px-4 py-10 text-center">
      <strong>{title}</strong>
      <span className="text-sm text-muted-foreground">{body}</span>
    </div>
  )
}

interface Neighbours {
  position: number
  count: number
  previous: string | null
  next: string | null
}

type OpenRecordFn = (record: OpenRecord, options?: { replace?: boolean }) => void

/** Previous / next within the page of the list behind the modal, and where this one sits. */
function Stepper({
  kind,
  neighbours,
  onOpen,
}: {
  kind: ObservationKind
  neighbours: Neighbours | null
  onOpen: OpenRecordFn
}) {
  if (!neighbours) return null
  const step = (id: string | null) => id && onOpen({ kind, id }, { replace: true })
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={!neighbours.previous}
        onClick={() => step(neighbours.previous)}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Previous</span>
      </Button>
      <span className="text-sm text-muted-foreground">
        {neighbours.position} of {neighbours.count}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={!neighbours.next}
        onClick={() => step(neighbours.next)}
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Next</span>
      </Button>
    </>
  )
}

function OpenInNewTab({ href }: { href: string }) {
  return (
    <Button asChild variant="ghost" size="sm">
      <a href={href} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Open in a new tab</span>
      </a>
    </Button>
  )
}

function Loading() {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"
    >
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      Loading…
    </div>
  )
}

function Body({
  status,
  record,
  timezone,
  prefix,
  onOpen,
}: {
  status: DetailStatus
  record: OpenRecord
  timezone: string
  prefix: string
  onOpen: OpenRecordFn
}): ReactNode {
  if (status.state === 'loading') return <Loading />
  if (status.state !== 'ready') return <DetailMessage status={status.state} kind={record.kind} />
  const { detail } = status
  if (detail.kind === 'avalanche') {
    return (
      <AvalancheDetail
        detail={detail}
        timezone={timezone}
        prefix={prefix}
        TitleTag="h2"
        onOpenObservation={(id) => onOpen({ kind: 'observation', id })}
      />
    )
  }
  return (
    <ObservationDetail
      detail={detail}
      timezone={timezone}
      prefix={prefix}
      TitleTag="h2"
      onOpenAvalanche={(id) => onOpen({ kind: 'avalanche', id })}
    />
  )
}

interface DetailModalProps {
  centerSlug: string
  timezone: string
  prefix: string
  record: OpenRecord | null
  /** Where the record sits in the page of the list behind it, when it is on that page. */
  neighbours: Neighbours | null
  onOpen: OpenRecordFn
  onClose: () => void
}

function ModalContent({
  record,
  status,
  ...props
}: Omit<DetailModalProps, 'centerSlug' | 'record' | 'onClose'> & {
  record: OpenRecord
  status: DetailStatus
}) {
  return (
    <>
      <div className="flex items-center justify-between border-b px-4 py-2">
        <DialogTitle className="text-base">{RECORD_TITLES[record.kind]}</DialogTitle>
        <DialogDescription className="sr-only">
          The {record.kind} opened from the list, over the list.
        </DialogDescription>
        <div className="flex items-center gap-1 pr-8">
          <Stepper kind={record.kind} neighbours={props.neighbours} onOpen={props.onOpen} />
          <OpenInNewTab href={`${props.prefix}${detailPath(record.kind, record.id)}`} />
        </div>
      </div>
      <div className="overflow-y-auto px-4 pb-6 sm:px-6">
        <Body
          status={status}
          record={record}
          timezone={props.timezone}
          prefix={props.prefix}
          onOpen={props.onOpen}
        />
      </div>
    </>
  )
}

export function DetailModal({ centerSlug, record, onClose, ...props }: DetailModalProps) {
  const status = useDetail(centerSlug, record)
  return (
    <Dialog open={record !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[95dvh] w-[95vw] max-w-5xl flex-col gap-3 overflow-hidden p-0">
        {record && <ModalContent record={record} status={status} {...props} />}
      </DialogContent>
    </Dialog>
  )
}
