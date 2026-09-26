/**
 * Center-level avalanche alert banner — the native replacement for the legacy `warnings` widget
 * on the home page. One solid banner per alert type (warning, watch, special bulletin), each
 * listing the affected zones with a "Learn More" link to the first affected zone's forecast page.
 *
 * Renders nothing when no alert is active, which is its state most of the year.
 *
 * Presentation follows the legacy widget one-for-one: warnings and watches share the danger
 * scale's High red, special bulletins are blue, and each banner is a single full-bleed strip
 * above the page content. Server-rendered, no client JS.
 */
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

import type { CenterWarningGroup } from '@/services/nac/centerWarnings'

import { warningBannerColor, warningBannerHeading } from './warningPresentation'

interface CenterWarningsBannerProps {
  groups: CenterWarningGroup[]
}

export function CenterWarningsBanner({ groups }: CenterWarningsBannerProps) {
  if (groups.length === 0) return null

  return (
    <div>
      {groups.map((group) => {
        // Legacy links to the first affected zone. Disabled zones have no native forecast page,
        // so skip past them; if none of the affected zones has one, the link is omitted entirely.
        const linkedZone = group.entries.find((entry) => entry.zone.slug !== null)?.zone

        return (
          <div
            key={group.productType}
            role="alert"
            className="px-4 py-3 text-white"
            style={{ backgroundColor: warningBannerColor(group.productType) }}
          >
            <div className="container flex flex-col gap-3 sm:flex-row sm:items-center">
              <AlertTriangle
                className="h-8 w-8 shrink-0 sm:h-12 sm:w-12"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <div className="grow">
                <h2 className="mb-1 text-base font-semibold sm:text-lg">
                  {warningBannerHeading(group.productType)}
                </h2>
                <ul>
                  {group.entries.map((entry) => (
                    <li
                      key={entry.zone.id}
                      className="border-l-2 border-white/70 py-0.5 pl-2 text-sm"
                    >
                      {entry.zone.name}
                    </li>
                  ))}
                </ul>
              </div>
              {linkedZone && (
                <Link
                  href={`/forecasts/avalanche/${linkedZone.slug}`}
                  className="shrink-0 rounded border border-transparent bg-white/30 px-4 py-2 text-center text-sm font-medium text-white hover:bg-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Learn More
                </Link>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
