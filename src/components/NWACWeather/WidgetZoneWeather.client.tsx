'use client'

/**
 * NWAC's Mountain Weather inside the legacy forecast widget, mounted in shadow roots on its
 * `nac-loaded` event. Why and how: docs/afp-products/architecture.md, "NWAC's weather".
 */
import Link from 'next/link'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { z } from 'zod'

import { MOUNTAIN_WEATHER_ID } from '@/components/forecast/zoneWeather'
import type { NWACWeatherZoneDay } from '@/services/nac/model/nwacWeather'

import { OverallSummary, ZoneSummary } from './ZoneSummary'
import { takeWeatherRequest } from './ZoneWeatherLink.client'

/** The part of the widget's `ForecastProduct` event detail this needs. */
const nacLoadedDetailSchema = z.object({ zone_id: z.number(), published: z.string() })

interface Slots {
  /** Under the Forecast tab's Mountain Weather; only when the day has weather for the zone. */
  forecast: HTMLElement | null
  /** The Weather Forecast tab's pane; whenever the tab exists. */
  tab: HTMLElement | null
  day: NWACWeatherZoneDay | null
  zoneId: number
  /** The read failed, so the tab can't say whether the day had a forecast. */
  failed: boolean
}

const SLOT_ID = 'nac-additional-content'

/** The pane the widget renders for NWAC's custom tab: `nac-` + the tab's id in center config. */
const TAB_PANE_ID = 'nac-weather-forecast'

/** Marks the host this component put beside the tab's pane, so the next forecast can replace it. */
const TAB_HOST_ATTR = 'data-nwac-weather-tab'

/**
 * A shadow root inside the widget's slot, carrying the page's same-origin stylesheets. Theme
 * variables set on `:root` inherit across the boundary; the rules have to be copied in.
 */
function shadowMount(place: (host: HTMLElement) => void): HTMLElement {
  const host = document.createElement('div')
  place(host)
  const root = host.attachShadow({ mode: 'open' })
  document.head.querySelectorAll('link[rel="stylesheet"], style').forEach((sheet) => {
    if (sheet instanceof HTMLLinkElement && new URL(sheet.href).origin !== location.origin) return
    root.append(sheet.cloneNode(true))
  })
  const mount = document.createElement('div')
  mount.className = 'font-sans text-base text-foreground'
  root.append(mount)
  return mount
}

/** The section's place under the Forecast tab's own Mountain Weather. */
function forecastMount(): HTMLElement | null {
  const slot = document.getElementById(SLOT_ID)
  if (!slot) return null
  const mount = shadowMount((host) => {
    host.style.scrollMarginTop = '1.5rem'
    slot.replaceChildren(host)
  })
  mount.classList.add('mt-6')
  return mount
}

/**
 * The Weather Forecast tab's pane, with the widget's own content (the fetch of the old nwac.us URL
 * and its error) hidden. The widget binds no style on that element, so the hide sticks.
 */
function tabMount(): HTMLElement | null {
  const pane = document.getElementById(TAB_PANE_ID)
  if (!pane) return null
  pane.style.display = 'none'
  // The pane survives a forecast switch inside the widget; the last forecast's section goes.
  pane.parentElement?.querySelectorAll(`[${TAB_HOST_ATTR}]`).forEach((old) => old.remove())
  return shadowMount((host) => {
    host.setAttribute(TAB_HOST_ATTR, '')
    pane.after(host)
  })
}

const GLIDE_MS = 600
/** The most one frame advances the glide, so frames the widget blocks don't skip it. */
const MAX_FRAME_MS = 34
/** When the landing happens regardless of frames, which stall where nothing is painted. */
const GLIDE_LIMIT_MS = 2000
/** How long the widget's late layout changes are corrected for; Safari doesn't anchor scroll. */
const HOLD_MS = 2000

/** Input that takes the scroll back from the page. */
const READER_INPUT = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const

/** Keeps `target` in place while the page above it changes height. */
function land(target: HTMLElement, reader: AbortController) {
  target.scrollIntoView()
  const observer = new ResizeObserver(() => target.scrollIntoView())
  observer.observe(document.body)
  reader.signal.addEventListener('abort', () => observer.disconnect())
  setTimeout(() => reader.abort(), HOLD_MS)
}

/**
 * A smooth scroll that measures its target every frame: the widget changes height while it runs,
 * and the browser's own (`behavior: 'smooth'`) lands where the target was when it started.
 */
function glideTo(target: HTMLElement) {
  const reader = new AbortController()
  READER_INPUT.forEach((type) =>
    window.addEventListener(type, () => reader.abort(), { passive: true, signal: reader.signal }),
  )
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    land(target, reader)
    return
  }

  const px = (value: string) => parseFloat(value) || 0
  const from = window.scrollY
  let elapsed = 0
  let last: number | null = null
  let landed = false
  function finish() {
    if (landed || reader.signal.aborted) return
    landed = true
    land(target, reader)
  }
  const limit = setTimeout(finish, GLIDE_LIMIT_MS)
  reader.signal.addEventListener('abort', () => clearTimeout(limit))

  function step(now: number) {
    if (landed || reader.signal.aborted) return
    elapsed += Math.min(now - (last ?? now), MAX_FRAME_MS)
    last = now
    const progress = elapsed / GLIDE_MS
    if (progress >= 1) {
      finish()
      return
    }
    const offset =
      px(getComputedStyle(target).scrollMarginTop) +
      px(getComputedStyle(document.documentElement).scrollPaddingTop)
    const to = target.getBoundingClientRect().top + window.scrollY - offset
    const eased = 1 - (1 - progress) ** 3
    window.scrollTo({ top: from + (to - from) * eased, behavior: 'instant' })
    requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

function scrollToWeather(slots: Slots) {
  const root = slots.forecast?.getRootNode()
  if (!(root instanceof ShadowRoot)) return
  if (root.host instanceof HTMLElement) glideTo(root.host)
}

/** Scrolls to the weather once it mounts, when the reader came for it. */
function useScrollToWeather(slots: Slots | null) {
  const wanted = useRef(false)
  const loaded = useRef<Slots | null>(null)

  // Before WidgetRouterHandler's effect replaces the hash with the widget's own route.
  useLayoutEffect(() => {
    if (takeWeatherRequest()) wanted.current = true
  }, [])

  // The widget's router reads an unknown hash as a missing product, so on an open page it must not
  // see this one. Capture runs ahead of its own listeners; the browser fires popstate first.
  useLayoutEffect(() => {
    const onHash = (event: Event) => {
      if (window.location.hash !== `#${MOUNTAIN_WEATHER_ID}`) return
      event.stopImmediatePropagation()
      if (!(event instanceof HashChangeEvent)) return
      window.history.replaceState(null, '', new URL(event.oldURL).hash || window.location.pathname)
      if (loaded.current) scrollToWeather(loaded.current)
      else wanted.current = true
    }
    window.addEventListener('popstate', onHash, true)
    window.addEventListener('hashchange', onHash, true)
    return () => {
      window.removeEventListener('popstate', onHash, true)
      window.removeEventListener('hashchange', onHash, true)
    }
  }, [])

  useEffect(() => {
    loaded.current = slots
    if (!slots || !wanted.current) return
    wanted.current = false
    scrollToWeather(slots)
  }, [slots])
}

async function fetchZoneDay(
  center: string,
  zoneId: number,
  published: string,
  signal: AbortSignal,
): Promise<NWACWeatherZoneDay | null> {
  const params = new URLSearchParams({ zone: String(zoneId), published })
  const res = await fetch(`/api/${center}/nwac-weather-zone?${params}`, { signal })
  if (!res.ok) throw new Error(`nwac-weather-zone answered ${res.status}`)
  const body: { day: NWACWeatherZoneDay | null } = await res.json()
  return body.day
}

export function WidgetZoneWeather({
  center,
  timezone,
}: {
  center: string
  timezone: string | null | undefined
}) {
  const [slots, setSlots] = useState<Slots | null>(null)
  useScrollToWeather(slots)

  useEffect(() => {
    let controller: AbortController | null = null

    function onLoaded(event: Event) {
      // A new forecast replaces the widget's DOM, so whatever was shown went with it.
      controller?.abort()
      setSlots(null)
      const detail = nacLoadedDetailSchema.safeParse(
        event instanceof CustomEvent ? event.detail : null,
      )
      if (!detail.success) return
      const { zone_id: zoneId, published } = detail.data

      const current = new AbortController()
      controller = current
      fetchZoneDay(center, zoneId, published, current.signal)
        .then((day) => {
          if (current.signal.aborted) return
          setSlots({
            forecast: day && forecastMount(),
            tab: tabMount(),
            day,
            zoneId,
            failed: false,
          })
        })
        // The forecast itself is unaffected; only the tab says the weather didn't load.
        .catch(() => {
          if (current.signal.aborted) return
          setSlots({ forecast: null, tab: tabMount(), day: null, zoneId, failed: true })
        })
    }

    window.addEventListener('nac-loaded', onLoaded)
    return () => {
      window.removeEventListener('nac-loaded', onLoaded)
      controller?.abort()
    }
  }, [center])

  if (!slots) return null
  const { day, zoneId } = slots
  return (
    <>
      {slots.forecast &&
        day &&
        createPortal(
          <ZoneSummary day={day} avalancheZoneId={zoneId} timezone={timezone} />,
          slots.forecast,
        )}
      {slots.tab &&
        createPortal(
          day ? (
            <OverallSummary day={day} avalancheZoneId={zoneId} timezone={timezone} />
          ) : (
            <NoWeather failed={slots.failed} />
          ),
          slots.tab,
        )}
    </>
  )
}

function NoWeather({ failed }: { failed: boolean }) {
  return (
    <p className="text-muted-foreground">
      {failed
        ? "The Mountain Weather Forecast couldn't be loaded."
        : 'No Mountain Weather Forecast was issued for this day.'}{' '}
      <Link href="/weather/forecast" className="text-secondary underline">
        See the latest Mountain Weather Forecast
      </Link>
    </p>
  )
}
