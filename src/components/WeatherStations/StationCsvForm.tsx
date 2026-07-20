type Datalogger = { stid: string; label: string }

// Plain GET form → the CSV route handler, which streams the file as a download.
// No client JS needed: the browser navigates and the attachment downloads.
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
      <button
        type="submit"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
      >
        Download CSV
      </button>
    </form>
  )
}
