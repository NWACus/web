'use client'

import { Loader2 } from 'lucide-react'
import Script from 'next/script'
import type { FormEvent, ReactNode, RefObject } from 'react'
import { useEffect, useRef, useState } from 'react'

type Datalogger = { stid: string; label: string }

type TurnstileRenderParams = {
  sitekey: string
  callback: () => void
  'expired-callback': () => void
  'error-callback': () => void
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, params: TurnstileRenderParams) => string
      reset: (widgetId: string) => void
    }
    csvTurnstileOnload?: () => void
  }
}

// Rendered explicitly: api.js only auto-scans on its first execution, which
// breaks widgets remounted by client-side navigation. The solved token
// submits with the form as a hidden cf-turnstile-response input.
function TurnstileWidget({
  siteKey,
  onChange,
  idRef,
}: {
  siteKey: string
  onChange: (solved: boolean) => void
  idRef: RefObject<string | null>
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    const renderWidget = () => {
      const container = containerRef.current
      if (idRef.current !== null || !container || !window.turnstile) return
      idRef.current = window.turnstile.render(container, {
        sitekey: siteKey,
        callback: () => onChangeRef.current(true),
        'expired-callback': () => onChangeRef.current(false),
        'error-callback': () => onChangeRef.current(false),
      })
    }
    if (window.turnstile) renderWidget()
    else window.csvTurnstileOnload = renderWidget
    return () => {
      delete window.csvTurnstileOnload
    }
  }, [siteKey, idRef])

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=csvTurnstileOnload&render=explicit" />
      <div ref={containerRef} />
    </>
  )
}

function FormSelect({
  label,
  name,
  children,
}: {
  label: string
  name: string
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <select
        name={name}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
      >
        {children}
      </select>
    </label>
  )
}

function DownloadButton({ downloading, disabled }: { downloading: boolean; disabled: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
    >
      {downloading && <Loader2 className="h-4 w-4 animate-spin" />}
      {downloading ? 'Preparing CSV…' : 'Download CSV'}
    </button>
  )
}

function formParams(form: HTMLFormElement): URLSearchParams {
  const entries = Array.from(new FormData(form), ([name, value]) => [name, String(value)])
  return new URLSearchParams(entries)
}

async function downloadCsv(url: string, filename: string): Promise<void> {
  // no-store: the URL repeats exactly, and a re-download should see new observations.
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const objectUrl = URL.createObjectURL(await response.blob())
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  // Firefox only follows a click on an anchor that is in the document, and
  // revoking in the same tick can cancel the save.
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
}

export function StationCsvForm({
  slug,
  dataloggers,
  years,
}: {
  slug: string
  dataloggers: Datalogger[]
  years: number[]
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const [captchaSolved, setCaptchaSolved] = useState(!siteKey)
  const [downloading, setDownloading] = useState(false)
  const [failed, setFailed] = useState(false)
  const widgetIdRef = useRef<string | null>(null)
  const action = `/weather/stations/${slug}/csv`

  // A Turnstile token is single-use, so every attempt costs the current solve.
  function rearmCaptcha() {
    const widgetId = widgetIdRef.current
    if (widgetId === null || !window.turnstile) return
    window.turnstile.reset(widgetId)
    setCaptchaSolved(false)
  }

  // Fetched rather than submitted so the wait for a year of data has a spinner.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const params = formParams(event.currentTarget)
    setDownloading(true)
    setFailed(false)
    try {
      const name = `${slug}-${params.get('stid')}-${params.get('year')}.csv`
      await downloadCsv(`${action}?${params.toString()}`, name)
    } catch {
      setFailed(true)
    } finally {
      setDownloading(false)
      rearmCaptcha()
    }
  }

  return (
    <form
      method="get"
      action={action}
      onSubmit={handleSubmit}
      onChange={() => setFailed(false)}
      className="flex min-h-96 flex-col items-start gap-4"
    >
      <div className="flex flex-wrap items-end gap-3">
        <FormSelect label="Datalogger" name="stid">
          {dataloggers.map((datalogger) => (
            <option key={datalogger.stid} value={datalogger.stid}>
              {datalogger.label}
            </option>
          ))}
        </FormSelect>
        <FormSelect label="Year" name="year">
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </FormSelect>
        <FormSelect label="Units" name="units">
          <option value="imperial">Imperial</option>
          <option value="metric">Metric</option>
        </FormSelect>
      </div>
      {siteKey && (
        <TurnstileWidget siteKey={siteKey} onChange={setCaptchaSolved} idRef={widgetIdRef} />
      )}
      <DownloadButton downloading={downloading} disabled={!captchaSolved || downloading} />
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          That download failed. Try again, or pick a different year.
        </p>
      )}
    </form>
  )
}
