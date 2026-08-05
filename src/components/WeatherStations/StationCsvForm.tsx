import Script from 'next/script'

type Datalogger = { stid: string; label: string }

// Renders nothing until NEXT_PUBLIC_TURNSTILE_SITE_KEY is configured. The
// widget appends a hidden cf-turnstile-response input that submits with the
// form; the CSV route verifies it.
function TurnstileWidget() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  if (!siteKey) return null
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div className="cf-turnstile" data-sitekey={siteKey} />
    </>
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
  return (
    <form
      method="get"
      action={`/weather/stations/${slug}/csv`}
      className="flex flex-wrap items-end gap-3"
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Datalogger</span>
        <select
          name="stid"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
        >
          {dataloggers.map((datalogger) => (
            <option key={datalogger.stid} value={datalogger.stid}>
              {datalogger.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Year</span>
        <select
          name="year"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Units</span>
        <select
          name="units"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
        >
          <option value="imperial">Imperial</option>
          <option value="metric">Metric</option>
        </select>
      </label>
      <TurnstileWidget />
      <button
        type="submit"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
      >
        Download CSV
      </button>
    </form>
  )
}
