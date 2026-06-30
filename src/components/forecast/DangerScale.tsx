/**
 * North American Public Avalanche Danger Scale legend, matching the legacy widget: a 1–5 color
 * strip ("{level} - {Name}") with an expandable table of travel advice / likelihood / size and
 * distribution per level, plus a link out to the full danger-scale explainer.
 */
import Image from 'next/image'

import {
  DANGER_SCALE_URL,
  dangerColor,
  dangerIconUrl,
  dangerName,
  dangerScaleRows,
} from '@/services/nac/dangerScale'

import { sanitizeHtml } from './sanitizeHtml'

export function DangerScale() {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Danger Scale</h4>
        <a
          href={DANGER_SCALE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm underline hover:no-underline"
        >
          Learn more
        </a>
      </div>

      {/* Color strip: levels 1–5, each capped by its danger color. */}
      <div className="grid grid-cols-5 gap-1">
        {dangerScaleRows.map((row) => (
          <div
            key={row.level}
            className="px-1 py-1 text-center text-xs leading-tight"
            style={{ borderTop: `10px solid ${dangerColor(row.level)}` }}
          >
            <strong>{row.level}</strong> - {row.rating}
          </div>
        ))}
      </div>

      {/* Expandable definitions table (horizontally scrollable on narrow screens). */}
      <details className="rounded-md border">
        <summary className="cursor-pointer select-none px-3 py-2 font-medium">
          Danger scale definitions
        </summary>
        <div className="overflow-x-auto px-3 pb-3">
          <table className="w-full min-w-[640px] border-collapse text-xs">
            <thead>
              <tr>
                <th className="p-1 text-left align-bottom"></th>
                {dangerScaleRows.map((row) => (
                  <th key={row.level} className="p-1 text-center align-bottom font-semibold">
                    <Image
                      src={dangerIconUrl(row.level)}
                      alt={dangerName(row.level)}
                      width={36}
                      height={36}
                      className="mx-auto"
                    />
                    <div className="pt-1">
                      {row.level} - {row.rating}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <th className="p-1 text-left font-semibold">Travel Advice</th>
                {dangerScaleRows.map((row) => (
                  <td
                    key={row.level}
                    className="p-1 align-top"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(row.advice) }}
                  />
                ))}
              </tr>
              <tr className="border-t">
                <th className="p-1 text-left font-semibold">Likelihood of Avalanches</th>
                {dangerScaleRows.map((row) => (
                  <td key={row.level} className="p-1 align-top">
                    {row.likelihood}
                  </td>
                ))}
              </tr>
              <tr className="border-t">
                <th className="p-1 text-left font-semibold">Avalanche Size and Distribution</th>
                {dangerScaleRows.map((row) => (
                  <td key={row.level} className="p-1 align-top">
                    {row.sizeDist}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
