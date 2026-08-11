/**
 * North American Public Avalanche Danger Scale legend, matching the legacy widget: the widget's
 * own "Avalanche Danger Scale" heading, a 1–5 color strip ("{level} - {Name}"), and an expandable
 * table of travel advice / likelihood / size and distribution per level, plus a link out to the
 * full danger-scale explainer.
 *
 * The heading is the disclosure trigger — the widget titles the legend that way, and a separate
 * "Danger scale definitions" toggle underneath was both extra wording the widget doesn't have and
 * a second thing competing for the same job. The table still opens below the color strip.
 */
import { ChevronRight } from 'lucide-react'
import Image from 'next/image'

import {
  DANGER_SCALE_URL,
  dangerColor,
  dangerIconSize,
  dangerIconUrl,
  dangerName,
  dangerScaleRows,
} from '@/services/nac/dangerScale'
import { DangerLevel } from '@/services/nac/types/forecastSchemas'

import { ExternalLink } from './ExternalLink'
import { sanitizeHtml } from './sanitizeHtml'

export function DangerScale() {
  return (
    <details className="group text-xs">
      {/* The heading and the color strip both live in the summary so the strip stays visible when
          the definitions are collapsed — inside <details> but outside <summary>, it would not. */}
      <summary className="cursor-pointer select-none list-none space-y-2 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 font-semibold">
            <ChevronRight
              className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90"
              aria-hidden="true"
            />
            Avalanche Danger Scale
          </span>
          {/* Opens in a new tab, so the toggle it also triggers is never seen. */}
          <ExternalLink href={DANGER_SCALE_URL} className="font-normal">
            Learn more
          </ExternalLink>
        </span>

        {/*
          Color strip. "General Information" leads it, set apart by a gap, exactly as the widget's
          legend does — without it nothing on the page explains the blue an unrated zone is drawn
          in, which is every zone for much of the year.
        */}
        <span className="grid grid-cols-6 gap-1">
          <span
            className="mr-2 block px-1 py-1 text-center leading-tight"
            style={{ borderTop: `10px solid ${dangerColor(DangerLevel.GeneralInformation)}` }}
          >
            <span className="sm:hidden">General Info</span>
            <span className="hidden sm:inline">General Information</span>
          </span>
          {dangerScaleRows.map((row) => (
            <span
              key={row.level}
              className="block px-1 py-1 text-center leading-tight"
              style={{ borderTop: `10px solid ${dangerColor(row.level)}` }}
            >
              <strong>{row.level}</strong> - <span className="sm:hidden">{row.abbreviation}</span>
              <span className="hidden sm:inline">{row.rating}</span>
            </span>
          ))}
        </span>
      </summary>

      <div className="overflow-x-auto pt-2">
        <table className="w-full min-w-[640px] border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-1 text-left align-bottom"></th>
              {dangerScaleRows.map((row) => (
                <th key={row.level} className="p-1 text-center align-bottom font-semibold">
                  <Image
                    src={dangerIconUrl(row.level)}
                    alt={dangerName(row.level)}
                    width={dangerIconSize(row.level).width}
                    height={dangerIconSize(row.level).height}
                    className="mx-auto h-9 w-auto"
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
  )
}
