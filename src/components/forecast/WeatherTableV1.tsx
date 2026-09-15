/**
 * Inline/periods weather table (the format with a `periods` key), ported from the afp
 * WeatherTableV1.vue. Header cells are inline HTML period labels; each body row is a field with a
 * value per period, where a value is either a plain string or a set of labeled split-cells. A few
 * well-known fields carry static help.
 */
import type { InlineWeatherData } from '@/services/nac/model/forecast'

import { sanitizeHtml } from './sanitizeHtml'
import { WeatherInfoHint } from './WeatherInfoHint'

/**
 * Static help for the well-known inline fields (hardcoded in the legacy widget), in the same HTML
 * shape the v2 API sends `rows[].help` in, so both tables' hints read the same.
 */
const FIELD_HELP: Record<string, string> = {
  'Ridgeline Wind Speed':
    '<h5>Ridgetop Wind Speed</h5><strong>CALM</strong> - No air motion. Smoke rises vertically.<br><strong>LIGHT</strong> - Light to gentle breeze, flags and twigs in motion.<br><strong>MODERATE</strong> - Fresh breeze. Small trees sway. Flags stretched. Snow begins to drift.<br><strong>STRONG</strong> - Strong breeze. Whole trees in motion.<br><strong>EXTREME</strong> - Gale force or higher.',
  Snowfall:
    '<h5>Snowfall</h5>Values are estimates from middle and upper elevation.<br><strong>24hr</strong> - Snow total from yesterday morning through this morning.<br><strong>12hr</strong> - Snow total from last night through this morning.',
  'Snow Water Equivalent':
    '<h5>Snow Water Equivalent (SWE)</h5>The depth of water that would result if you melted the snowfall. SWE is a better estimate of weight added to the snowpack than snowfall.',
}

export function WeatherTableV1({ table }: { table: InlineWeatherData }) {
  return (
    <div className="my-3 overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        {/* The heavier rule under the heading row wins the border-collapse tie on width. */}
        <thead className="border-b-2 border-b-muted-foreground">
          <tr>
            {/* Row headings never wrap; the zone name is long enough to eat a phone's whole table width. */}
            <th className="border bg-muted px-3 py-2 text-left align-middle font-semibold md:whitespace-nowrap">
              {table.zone_name}
            </th>
            {table.periods.map((heading, i) => (
              <th
                key={i}
                className="border p-2 text-center align-middle font-normal"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(heading) }}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {table.data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td className="whitespace-nowrap border px-3 py-2 text-left align-middle">
                <span className="font-medium">{row.field}</span>
                {FIELD_HELP[row.field] && (
                  <WeatherInfoHint html={FIELD_HELP[row.field]} field={row.field} />
                )}
              </td>
              {row.values.map((value, i) => (
                <td key={i} className="border p-2 text-center align-middle">
                  {typeof value === 'string' ? (
                    <span>
                      {value}
                      {row.unit && value !== '' && (
                        <span className="text-muted-foreground"> {row.unit}</span>
                      )}
                    </span>
                  ) : (
                    <span className="flex flex-col gap-1">
                      {value.map((split, j) => (
                        <span key={j}>
                          <span className="font-medium">{split.label}:</span> {split.value}
                          {row.unit && split.value !== '' && (
                            <span className="text-muted-foreground"> {row.unit}</span>
                          )}
                        </span>
                      ))}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
