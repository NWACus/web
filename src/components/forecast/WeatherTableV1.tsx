/**
 * Inline/periods weather table (the format with a `periods` key), ported from the afp
 * WeatherTableV1.vue. Header cells are inline HTML period labels; each body row is a field with a
 * value per period, where a value is either a plain string or a set of labeled split-cells. A few
 * well-known fields carry static help.
 */
import type { InlineWeatherData } from '@/services/nac/model/forecast'

import { sanitizeHtml } from './sanitizeHtml'
import { WeatherInfoHint } from './WeatherInfoHint'

/** Static help for the well-known inline fields (hardcoded in the legacy widget). */
const FIELD_HELP: Record<string, string> = {
  'Ridgeline Wind Speed':
    'Ridgetop Wind Speed. CALM - No air motion. Smoke rises vertically. LIGHT - Light to gentle breeze, flags and twigs in motion. MODERATE - Fresh breeze. Small trees sway. Flags stretched. Snow begins to drift. STRONG - Strong breeze. Whole trees in motion. EXTREME - Gale force or higher.',
  Snowfall:
    'Snowfall. Values are estimates from middle and upper elevation. 24hr — snow total from yesterday morning through this morning. 12hr — snow total from last night through this morning.',
  'Snow Water Equivalent':
    'Snow Water Equivalent (SWE). The depth of water that would result if you melted the snowfall. SWE is a better estimate of weight added to the snowpack than snowfall.',
}

export function WeatherTableV1({ table }: { table: InlineWeatherData }) {
  return (
    <div className="my-3 overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="border bg-muted p-2 text-left align-middle font-semibold">
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
              <td className="border p-2 text-left align-middle">
                <span className="font-medium">{row.field}</span>
                {FIELD_HELP[row.field] && <WeatherInfoHint content={FIELD_HELP[row.field]} />}
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
