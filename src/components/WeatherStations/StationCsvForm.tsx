'use client'

import Script from 'next/script'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

type Datalogger = { stid: string; label: string }

// reCAPTCHA's data-callback attributes only take global function names.
declare global {
  interface Window {
    csvRecaptchaSolved?: () => void
    csvRecaptchaExpired?: () => void
  }
}

function useCaptchaGate(siteKey: string | undefined): boolean {
  const [solved, setSolved] = useState(!siteKey)
  useEffect(() => {
    if (!siteKey) return
    window.csvRecaptchaSolved = () => setSolved(true)
    window.csvRecaptchaExpired = () => setSolved(false)
    return () => {
      delete window.csvRecaptchaSolved
      delete window.csvRecaptchaExpired
    }
  }, [siteKey])
  return solved
}

// The checkbox widget appends a hidden g-recaptcha-response input that
// submits with the form; the CSV route verifies it.
function RecaptchaWidget({ siteKey }: { siteKey: string }) {
  return (
    <>
      <Script src="https://www.google.com/recaptcha/api.js" async defer />
      <div
        className="g-recaptcha"
        data-sitekey={siteKey}
        data-callback="csvRecaptchaSolved"
        data-expired-callback="csvRecaptchaExpired"
      />
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
  const captchaSolved = useCaptchaGate(siteKey)

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
      {siteKey && <RecaptchaWidget siteKey={siteKey} />}
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
