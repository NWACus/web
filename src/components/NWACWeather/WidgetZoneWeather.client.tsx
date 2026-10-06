'use client'

/**
 * NWAC's Mountain Weather inside the legacy forecast widget, the way nwac.us puts it there: the
 * widget fires `nac-loaded` on `window` each time it renders a forecast (the current one, or an
 * archived one opened in place), and leaves an empty `#nac-additional-content` beneath its own
 * Mountain Weather section for the host page to fill. This listens for that event, fetches the
 * day the forecast is valid for, and portals the zone section into that element.
 *
 * The section renders inside a shadow root. The widget's stylesheet reverts every table, heading,
 * paragraph and button under `#nac-app` (`all: revert`, at id specificity), which no Tailwind class
 * can beat; the shadow boundary keeps those rules out, and a copy of the page's own stylesheets
 * lets the section look the way it does on a native page.
 */
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { z } from 'zod'

import type { NWACWeatherForecastDay } from '@/services/nac/model/nwacWeather'

import { ZoneSummary } from './ZoneSummary'

/** The part of the widget's `ForecastProduct` event detail this needs. */
const nacLoadedDetailSchema = z.object({ zone_id: z.number(), published: z.string() })

interface Slot {
  target: HTMLElement
  day: NWACWeatherForecastDay
  zoneId: number
}

const SLOT_ID = 'nac-additional-content'

/**
 * A shadow root inside the widget's slot, carrying the page's same-origin stylesheets. Theme
 * variables set on `:root` inherit across the boundary; the rules have to be copied in.
 */
function shadowMount(slot: HTMLElement): HTMLElement {
  const host = document.createElement('div')
  slot.replaceChildren(host)
  const root = host.attachShadow({ mode: 'open' })
  document.head.querySelectorAll('link[rel="stylesheet"], style').forEach((sheet) => {
    if (sheet instanceof HTMLLinkElement && new URL(sheet.href).origin !== location.origin) return
    root.append(sheet.cloneNode(true))
  })
  const mount = document.createElement('div')
  mount.className = 'mt-6 font-sans text-base text-foreground'
  root.append(mount)
  return mount
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
  const [slot, setSlot] = useState<Slot | null>(null)

  useEffect(() => {
    let controller: AbortController | null = null

    function onLoaded(event: Event) {
      // A new forecast replaces the widget's DOM, so whatever was shown went with it.
      controller?.abort()
      setSlot(null)
      const detail = nacLoadedDetailSchema.safeParse(
        event instanceof CustomEvent ? event.detail : null,
      )
      if (!detail.success) return
      const { zone_id: zoneId, published } = detail.data

      const current = new AbortController()
      controller = current
      fetchZoneDay(center, zoneId, published, current.signal)
        .then((day) => {
          const slot = document.getElementById(SLOT_ID)
          if (day && slot && !current.signal.aborted) {
            setSlot({ target: shadowMount(slot), day, zoneId })
          }
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

  if (!slot) return null
  return createPortal(
    <ZoneSummary day={slot.day} avalancheZoneId={slot.zoneId} timezone={timezone} />,
    slot.target,
  )
}
