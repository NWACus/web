'use client'

import Script from 'next/script'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

type Datalogger = { stid: string; label: string }

type RecaptchaRenderParams = {
  sitekey: string
  callback: () => void
  'expired-callback': () => void
}

declare global {
  interface Window {
    grecaptcha?: { render: (container: HTMLElement, params: RecaptchaRenderParams) => number }
    csvRecaptchaOnload?: () => void
  }
}

// Rendered explicitly: api.js only auto-scans on its first execution, which
// breaks widgets remounted by client-side navigation. The solved token
// submits with the form as a hidden g-recaptcha-response input.
function RecaptchaWidget({
  siteKey,
  onChange,
}: {
  siteKey: string
  onChange: (solved: boolean) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const renderedRef = useRef(false)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    const renderWidget = () => {
      const container = containerRef.current
      if (renderedRef.current || !container || !window.grecaptcha) return
      renderedRef.current = true
      window.grecaptcha.render(container, {
        sitekey: siteKey,
        callback: () => onChangeRef.current(true),
        'expired-callback': () => onChangeRef.current(false),
      })
    }
    if (window.grecaptcha) renderWidget()
    else window.csvRecaptchaOnload = renderWidget
    return () => {
      delete window.csvRecaptchaOnload
    }
  }, [siteKey])

  return (
    <>
      <Script src="https://www.google.com/recaptcha/api.js?onload=csvRecaptchaOnload&render=explicit" />
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

export function StationCsvForm({
  slug,
  dataloggers,
  years,
}: {
  slug: string
  dataloggers: Datalogger[]
  years: number[]
}) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
  const [captchaSolved, setCaptchaSolved] = useState(!siteKey)

  return (
    <form
      method="get"
      action={`/weather/stations/${slug}/csv`}
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
      {siteKey && <RecaptchaWidget siteKey={siteKey} onChange={setCaptchaSolved} />}
      <button
        type="submit"
        disabled={!captchaSolved}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
      >
        Download CSV
      </button>
    </form>
  )
}
