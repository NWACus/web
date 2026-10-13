'use client'

/**
 * NWAC's Mountain Weather inside the legacy forecast widget, the way nwac.us puts it there: the
 * widget fires `nac-loaded` on `window` each time it renders a forecast (the current one, or an
 * archived one opened in place), and leaves an empty `#nac-additional-content` beneath its own
 * Mountain Weather section for the host page to fill. This listens for that event, fetches the
 * day the forecast is valid for, and portals the zone section into that element.
 *
 * It also takes over NWAC's "Weather Forecast" tab. The widget builds that tab from the center's
 * config (`widget_config.forecast.tabs`) and owns its button and `#/<zone>/weather-forecast` route,
 * but fills it by fetching a URL that pointed at nwac.us, which no longer answers. So the page hides
 * what the widget loaded there and renders the same zone section in its place, or says the day has
 * no forecast.
 *
 * The section renders inside a shadow root. The widget's stylesheet reverts every table, heading,
 * paragraph and button under `#nac-app` (`all: revert`, at id specificity), which no Tailwind class
 * can beat; the shadow boundary keeps those rules out, and a copy of the page's own stylesheets
 * lets the section look the way it does on a native page.
 */
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { z } from 'zod'

import type { NWACWeatherForecastDay } from '@/services/nac/model/nwacWeather'

import { ZoneSummary } from './ZoneSummary'

/** The part of the widget's `ForecastProduct` event detail this needs. */
const nacLoadedDetailSchema = z.object({ zone_id: z.number(), published: z.string() })

interface Slots {
  /** Under the Forecast tab's Mountain Weather; only when the day has weather for the zone. */
  forecast: HTMLElement | null
  /** The Weather Forecast tab's pane; whenever the tab exists. */
  tab: HTMLElement | null
  day: NWACWeatherForecastDay | null
  zoneId: number
}

const SLOT_ID = 'nac-additional-content'

/** The pane the widget renders for NWAC's custom tab: `nac-` + the tab's id in center config. */
const TAB_PANE_ID = 'nac-weather-forecast'

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
  const mount = shadowMount((host) => slot.replaceChildren(host))
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
  return shadowMount((host) => pane.after(host))
}

async function fetchZoneDay(
  center: string,
  zoneId: number,
  published: string,
  signal: AbortSignal,
): Promise<NWACWeatherForecastDay | null> {
  const params = new URLSearchParams({ zone: String(zoneId), published })
  const res = await fetch(`/api/${center}/nwac-weather-zone?${params}`, { signal })
  if (!res.ok) return null
  const body: { day: NWACWeatherForecastDay | null } = await res.json()
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
          setSlots({ forecast: day && forecastMount(), tab: tabMount(), day, zoneId })
        })
        // No weather is the fallback for a failed read; the forecast itself is unaffected.
        .catch(() => {})
    }

    window.addEventListener('nac-loaded', onLoaded)
    return () => {
      window.removeEventListener('nac-loaded', onLoaded)
      controller?.abort()
    }
  }, [center])

  if (!slots) return null
  const { day, zoneId } = slots
  const section = day && <ZoneSummary day={day} avalancheZoneId={zoneId} timezone={timezone} />
  return (
    <>
      {slots.forecast && section && createPortal(section, slots.forecast)}
      {slots.tab && createPortal(section || <NoWeather />, slots.tab)}
    </>
  )
}

function NoWeather() {
  return (
    <p className="text-muted-foreground">
      No Mountain Weather Forecast was issued for this day.{' '}
      <Link href="/weather/forecast" className="text-secondary underline">
        See the latest Mountain Weather Forecast
      </Link>
    </p>
  )
}
