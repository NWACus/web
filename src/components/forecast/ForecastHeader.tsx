/**
 * Product metadata — issued, expires, author — side by side with a rule before each, matching the
 * legacy widget's `ProductHeader`. Stacks below md, as the widget's columns did.
 *
 * Rendered as a plain block (no Card) so it composes inside the all-zones listing and the weather
 * section. Times are formatted in the avalanche center's timezone (from the NAC metadata) because
 * the page is server-rendered and has no client locale to fall back on.
 */
import type { Forecast, Summary } from '@/services/nac/model/forecast'
import { formatDateTime } from '@/utilities/formatDateTime'

interface ForecastHeaderProps {
  forecast: Pick<Forecast | Summary, 'published_time' | 'expires_time' | 'author'>
  timezone: string | null | undefined
}

/** The widget's `dddd, MMMM D, YYYY - h:mmA`, e.g. "Sunday, April 5, 2026 - 6:19AM". */
const DATE_FORMAT = 'EEEE, MMMM d, yyyy - h:mma'

function formatInZone(iso: string | null, timezone: string | null | undefined): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (isNaN(date.getTime())) return null
  return formatDateTime(iso, timezone, DATE_FORMAT)
}

interface MetaItem {
  label: string
  value: string | null
}

function hasValue(item: MetaItem): item is { label: string; value: string } {
  return Boolean(item.value)
}

export function ForecastHeader({ forecast, timezone }: ForecastHeaderProps) {
  const items = [
    { label: 'Issued', value: formatInZone(forecast.published_time, timezone) },
    { label: 'Expires', value: formatInZone(forecast.expires_time, timezone) },
    { label: 'Author', value: forecast.author },
  ].filter(hasValue)

  if (items.length === 0) return null

  return (
    <dl className="flex flex-col gap-2 md:flex-row md:gap-[30px] printWide:flex-row printWide:gap-[30px]">
      {items.map(({ label, value }) => (
        <div key={label} className="border-l-[1.5px] py-2 pl-8 md:flex-1 printWide:flex-1">
          <dt className="mb-1 text-sm font-medium text-foreground">{label}</dt>
          <dd className="text-sm text-muted-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
