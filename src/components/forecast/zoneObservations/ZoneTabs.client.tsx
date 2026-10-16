'use client'

/**
 * The live forecast page's tab bar (Forecast-9): the forecast, then the zone's Observations and
 * Avalanches, laid out like the widget's. The tab lives in `?tab=`, read after hydration rather
 * than through `useSearchParams`, which would drop this subtree out of the static HTML. The
 * forecast panel stays mounted while hidden, so a freshness refresh updates it in place, and it's
 * what prints.
 */
import type { ZoneObservations } from '@/services/nac/model/zoneObservations'
import { cn } from '@/utilities/ui'
import { Binoculars, MapPin, MountainSnow } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

import { ButtonLink } from '@/components/ButtonLink'
import { Button } from '@/components/ui/button'

import { sectionHeading } from '../forecastHeadings'
import { AvalancheCard, ObservationCard } from './ZoneObservationCards'
import { parseZoneTab, type ZoneTab } from './zoneTabs'

type Load = { state: 'idle' | 'loading' | 'error' } | { state: 'loaded'; data: ZoneObservations }

interface ZoneTabsProps {
  endpoint: string
  zoneName: string
  forecastLabel: string
  bottomLine: ReactNode
  panel: ReactNode
}

export function ZoneTabs({ endpoint, zoneName, forecastLabel, bottomLine, panel }: ZoneTabsProps) {
  const { tab, setTab } = useZoneTabFromUrl()
  const [load, retry] = useZoneObservations(endpoint, tab !== 'forecast')

  function selectTab(next: ZoneTab, { replace = false } = {}) {
    if (next === tab) return
    setTab(next)
    const search = new URLSearchParams(window.location.search)
    if (next === 'forecast') search.delete('tab')
    else search.set('tab', next)
    // A click is a navigation, as the widget's router links were: Back returns to the previous
    // tab. Arrow keys replace instead, so stepping through the bar isn't three history entries.
    if (replace) window.history.replaceState(null, '', urlWith(search))
    else window.history.pushState(null, '', urlWith(search))
  }

  return (
    <>
      {bottomLine}
      <ZoneTabBar tab={tab} onSelect={selectTab} forecastLabel={forecastLabel} />
      <div
        id="zone-tab-forecast"
        role="tabpanel"
        aria-labelledby="zone-tab-button-forecast"
        className={tab === 'forecast' ? undefined : 'hidden print:block'}
      >
        {panel}
      </div>
      <section
        id="zone-tab-records"
        role="tabpanel"
        aria-labelledby={`zone-tab-button-${tab === 'avalanches' ? 'avalanches' : 'observations'}`}
        hidden={tab === 'forecast'}
        className="print:hidden"
      >
        {tab !== 'forecast' && (
          <ZoneObservationsPane tab={tab} load={load} retry={retry} zoneName={zoneName} />
        )}
      </section>
    </>
  )
}

function urlWith(search: URLSearchParams): string {
  const query = search.toString()
  return `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
}

/**
 * The tab in the address, starting from the forecast so the first render matches the static HTML.
 * An unknown `?tab=` is dropped from the address, as the widget redirects an unknown tab.
 */
function useZoneTabFromUrl() {
  const [tab, setTab] = useState<ZoneTab>('forecast')

  useEffect(() => {
    function readAddress() {
      const search = new URLSearchParams(window.location.search)
      const raw = search.get('tab')
      const parsed = parseZoneTab(raw)
      if (raw !== null && parsed === 'forecast') {
        search.delete('tab')
        window.history.replaceState(window.history.state, '', urlWith(search))
      }
      setTab(parsed)
    }
    readAddress()
    window.addEventListener('popstate', readAddress)
    return () => window.removeEventListener('popstate', readAddress)
  }, [])

  return { tab, setTab }
}

/** Fetched the first time a zone tab opens, then kept for the visit; an error can be retried. */
function useZoneObservations(endpoint: string, wanted: boolean): [Load, () => void] {
  const [load, setLoad] = useState<Load>({ state: 'idle' })

  useEffect(() => {
    if (!wanted || load.state !== 'idle') return
    setLoad({ state: 'loading' })
    fetch(endpoint)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: ZoneObservations) => setLoad({ state: 'loaded', data }))
      .catch(() => setLoad({ state: 'error' }))
  }, [endpoint, wanted, load.state])

  return [load, () => setLoad({ state: 'idle' })]
}

const TABS: { id: ZoneTab; label?: string }[] = [
  { id: 'forecast' },
  { id: 'observations', label: 'Observations' },
  { id: 'avalanches', label: 'Avalanches' },
]

/** Sized to their labels and scrolled sideways when they overflow, as the widget's are. */
function ZoneTabBar({
  tab,
  onSelect,
  forecastLabel,
}: {
  tab: ZoneTab
  onSelect: (tab: ZoneTab, options?: { replace?: boolean }) => void
  forecastLabel: string
}) {
  const barRef = useRef<HTMLDivElement>(null)

  // Unlike the widget, keep the selected tab in view when the bar overflows on a phone.
  useEffect(() => {
    const bar = barRef.current
    const selected = bar?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (!bar || !selected) return
    const pastRight =
      selected.offsetLeft + selected.offsetWidth - (bar.scrollLeft + bar.clientWidth)
    if (pastRight > 0) bar.scrollLeft += pastRight
    else if (selected.offsetLeft < bar.scrollLeft) bar.scrollLeft = selected.offsetLeft
  }, [tab])

  function onKeyDown(event: KeyboardEvent) {
    const index = TABS.findIndex((t) => t.id === tab)
    const target =
      event.key === 'ArrowRight'
        ? (index + 1) % TABS.length
        : event.key === 'ArrowLeft'
          ? (index - 1 + TABS.length) % TABS.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? TABS.length - 1
              : null
    if (target === null) return
    event.preventDefault()
    const next = TABS[target]
    onSelect(next.id, { replace: true })
    document.getElementById(`zone-tab-button-${next.id}`)?.focus()
  }

  return (
    <div
      ref={barRef}
      role="tablist"
      aria-label="Forecast, observations and avalanches"
      onKeyDown={onKeyDown}
      className="flex overflow-x-auto border-b border-[#e0e2e5] print:hidden"
      data-print-hide
    >
      {TABS.map((t) => (
        <button
          key={t.id}
          id={`zone-tab-button-${t.id}`}
          role="tab"
          type="button"
          aria-selected={tab === t.id}
          aria-controls={t.id === 'forecast' ? 'zone-tab-forecast' : 'zone-tab-records'}
          tabIndex={tab === t.id ? 0 : -1}
          onClick={() => onSelect(t.id)}
          className={cn(
            '-mb-px shrink-0 whitespace-nowrap border-b-[3px] px-4 py-2.5 text-sm font-semibold sm:px-5',
            tab === t.id
              ? 'border-primary text-primary'
              : 'border-transparent text-[#797d80] hover:text-foreground',
          )}
        >
          {t.label ?? forecastLabel}
        </button>
      ))}
    </div>
  )
}

/** Flat under the tab bar, as the widget's pane is: no card around the cards. */
function ZoneObservationsPane({
  tab,
  load,
  retry,
  zoneName,
}: {
  tab: 'observations' | 'avalanches'
  load: Load
  retry: () => void
  zoneName: string
}) {
  const noun = tab === 'observations' ? 'Observations' : 'Avalanches'

  return (
    <div className="space-y-5" aria-busy={load.state === 'loading' || load.state === 'idle'}>
      <div>
        <h2 className={sectionHeading}>Recent {noun}</h2>
        <p className="mt-1 flex items-center gap-1.5 text-lg font-semibold text-muted-foreground">
          <MapPin aria-hidden className="size-5" />
          {zoneName}
        </p>
      </div>

      <PaneBody tab={tab} load={load} retry={retry} />

      {/* The widget's labels, shortened on a phone as its are. */}
      <div className="flex flex-wrap justify-center gap-2">
        <ButtonLink href="/observations">
          All Obs<span className="hidden sm:inline">ervations</span>
        </ButtonLink>
        <ButtonLink href="/observations/submit" variant="secondary">
          Submit Ob<span className="hidden sm:inline">servation</span>
        </ButtonLink>
      </div>
    </div>
  )
}

function PaneBody({
  tab,
  load,
  retry,
}: {
  tab: 'observations' | 'avalanches'
  load: Load
  retry: () => void
}) {
  if (load.state === 'error') {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
        <p>Recent {tab} couldn&apos;t be loaded.</p>
        <Button variant="outline" size="sm" onClick={retry}>
          Try again
        </Button>
      </div>
    )
  }
  if (load.state !== 'loaded') {
    return <p className="py-8 text-center text-muted-foreground">Loading recent {tab}…</p>
  }

  const items = tab === 'observations' ? load.data.observations : load.data.avalanches
  if (items.length === 0) {
    const Icon = tab === 'observations' ? Binoculars : MountainSnow
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
        <Icon aria-hidden className="size-10" />
        <p>{tab === 'observations' ? 'No recent observations' : 'No recent avalanches'}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {tab === 'observations'
        ? load.data.observations.map((obs) => <ObservationCard key={obs.id} obs={obs} />)
        : load.data.avalanches.map((avy) => <AvalancheCard key={avy.id} avy={avy} />)}
    </div>
  )
}
