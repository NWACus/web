'use client'

/**
 * The list half of the viewer: the count line, the cards, and the page links — 25 to a page from
 * the server, as the widget pages. Every state is visible: waiting on the map, loading, an error
 * (`role="alert"`, never an empty list standing in for one), and "nothing found".
 */
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

import { paginationItems } from '@/components/forecast/archive/ArchivePagination'
import { Button } from '@/components/ui/button'
import type { ObservationKind } from '@/services/nac/model/observation'
import type { ObservationListResponse } from '@/services/nac/observations/cards'

import type { ListStatus } from '../useObservationList'
import { ObservationCard } from './ObservationCard'

const NOUNS: Record<ObservationKind, { one: string; many: string; title: string }> = {
  observation: { one: 'observation', many: 'observations', title: 'Observations' },
  avalanche: { one: 'avalanche', many: 'avalanches', title: 'Avalanches' },
}

interface CountScope {
  place: string | null
  zoneCount: number
}

function scopeText({ place, zoneCount }: CountScope): string {
  if (place) return `near ${place}`
  if (zoneCount === 0) return 'within map area'
  return zoneCount === 1 ? 'within selected zone' : 'within selected zones'
}

/**
 * "25 observations within map area", "…within selected zones", "…near Snoqualmie Pass, WA". The
 * avalanches tab counts avalanches, not reports: a report of twelve counts twelve.
 */
export function countLine(
  kind: ObservationKind,
  data: ObservationListResponse,
  scope: CountScope,
): string {
  const count = kind === 'observation' ? data.total : (data.avalancheCount ?? 0)
  const noun = count === 1 ? NOUNS[kind].one : NOUNS[kind].many
  return `${count} ${noun} ${scopeText(scope)}`
}

function Pagination({
  page,
  pages,
  onPage,
}: {
  page: number
  pages: number
  onPage: (page: number) => void
}) {
  if (pages <= 1) return null
  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center justify-center gap-1 py-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Previous page</span>
      </Button>
      {paginationItems(page, pages).map((item, index) =>
        item === null ? (
          <span key={`gap-${index}`} className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={item}
            type="button"
            size="sm"
            variant={item === page ? 'outline' : 'ghost'}
            aria-current={item === page ? 'page' : undefined}
            onClick={() => onPage(item)}
          >
            {item}
          </Button>
        ),
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Next page</span>
      </Button>
    </nav>
  )
}

function Message({ alert, children }: { alert?: boolean; children: React.ReactNode }) {
  return (
    <div
      role={alert ? 'alert' : 'status'}
      className="flex flex-col items-center gap-1 rounded-lg border px-4 py-10 text-center text-sm text-muted-foreground"
    >
      {children}
    </div>
  )
}

interface ObservationListProps {
  kind: ObservationKind
  status: ListStatus
  scope: CountScope
  highlightedId: string | null
  hrefFor: (id: string) => string
  onOpen: (id: string) => void
  onHighlight: (id: string | null) => void
  onPage: (page: number) => void
}

function Cards({
  data,
  highlightedId,
  hrefFor,
  onOpen,
  onHighlight,
}: Omit<ObservationListProps, 'kind' | 'status' | 'scope' | 'onPage'> & {
  data: ObservationListResponse
}) {
  if (data.items.length === 0) {
    return (
      <Message>
        <strong className="text-foreground">Nothing found</strong>
        Try adjusting the filter criteria.
      </Message>
    )
  }
  return (
    <ul className="flex flex-col gap-3">
      {data.items.map((card) => (
        <li key={card.id}>
          <ObservationCard
            card={card}
            href={hrefFor(card.id)}
            highlighted={highlightedId === card.id}
            onOpen={() => onOpen(card.id)}
            onHighlight={onHighlight}
          />
        </li>
      ))}
    </ul>
  )
}

export function ObservationList({ kind, status, scope, onPage, ...cards }: ObservationListProps) {
  const nouns = NOUNS[kind]
  if (status.state === 'error') {
    return (
      <Message alert>
        <strong className="text-foreground">{nouns.title} couldn&apos;t be loaded.</strong>
        Try again in a moment, or adjust the map or filters.
      </Message>
    )
  }
  if (status.state !== 'ready') {
    return (
      <Message>
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        Loading {nouns.many}…
      </Message>
    )
  }
  const { data } = status
  return (
    <div className="flex flex-col gap-3">
      <p className="font-bold" aria-live="polite">
        {countLine(kind, data, scope)}
      </p>
      <Cards data={data} {...cards} />
      <Pagination page={data.page} pages={data.pages} onPage={onPage} />
    </div>
  )
}
