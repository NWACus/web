/**
 * The card shown when a reader hovers a zone on the danger map.
 *
 * Content and ordering follow the legacy danger-map widget's popup: a colored header stating the
 * rating (or that the season has ended), a warning strip when one is in effect, the zone name, the
 * publication window, and the danger scale's travel advice. All of it is derived server-side by
 * `zonePopup`; this only renders.
 */
import { AlertTriangle, OctagonAlert } from 'lucide-react'
import Image from 'next/image'

import type { ZonePopup } from '@/services/nac/dangerMap/dangerMapZones'
import {
  dangerColor,
  dangerIconSize,
  dangerIconUrl,
  dangerName,
  dangerTextColor,
} from '@/services/nac/dangerScale'

/**
 * The colored banner across the top: the zone's rating and its danger icon, or — off-season — a
 * plain grey notice, since a rating would be describing a season that ended months ago.
 */
function PopupHeader({ popup }: { popup: ZonePopup }) {
  if (popup.offSeason) {
    return (
      <div className="flex items-center gap-3 bg-neutral-200 px-4 py-3">
        <OctagonAlert className="h-9 w-9 shrink-0 text-neutral-500" aria-hidden="true" />
        <div className="text-sm font-bold uppercase leading-tight tracking-wide">
          {popup.headline}
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex items-center justify-between gap-2 py-3 pl-4 pr-2"
      style={{
        backgroundColor: dangerColor(popup.dangerLevel),
        color: dangerTextColor(popup.dangerLevel),
      }}
    >
      <div>
        <div className="text-sm font-bold uppercase tracking-wide">{popup.headline}</div>
        <div className="text-xs font-bold uppercase">{popup.subhead}</div>
      </div>
      <Image
        src={dangerIconUrl(popup.dangerLevel)}
        alt={dangerName(popup.dangerLevel)}
        width={dangerIconSize(popup.dangerLevel).width}
        height={dangerIconSize(popup.dangerLevel).height}
        className="h-12 w-auto shrink-0"
      />
    </div>
  )
}

/** The red strip between header and body, shown only while a warning is in effect. */
function WarningStrip({ popup }: { popup: ZonePopup }) {
  if (!popup.hasWarning) return null

  return (
    <div
      className="flex items-center gap-2 px-4 py-1 text-xs font-bold uppercase tracking-wide text-white"
      style={{ backgroundColor: dangerColor(4) }}
    >
      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>Avalanche Warning in Effect</span>
    </div>
  )
}

/** Zone name, plus its avalanche center on an all-centers map where the zones differ. */
function ZoneIdentity({ popup }: { popup: ZonePopup }) {
  return (
    <div>
      <div className="font-bold uppercase tracking-wide">{popup.zoneName}</div>
      {popup.centerName && (
        <div className="text-xs uppercase text-neutral-500">{popup.centerName}</div>
      )}
    </div>
  )
}

/** The forecast's validity window — both ends or neither, as the widget shows it. */
function ValidityWindow({ popup }: { popup: ZonePopup }) {
  if (!popup.publishedText || !popup.expiresText) return null

  return (
    <div className="text-xs leading-relaxed">
      <strong>PUBLISHED:</strong> {popup.publishedText}
      <br />
      <strong>EXPIRES:</strong> {popup.expiresText}
    </div>
  )
}

function TravelAdvice({ popup }: { popup: ZonePopup }) {
  if (!popup.advice) return null

  return (
    <div className="text-xs leading-relaxed">
      <div className="font-bold uppercase tracking-wide">Travel Advice</div>
      {/* Advice is a literal in `dangerScale.ts` (the published danger scale), not API or user
          content, so it carries only the <strong> we wrote and needs no sanitizer — which also
          keeps sanitize-html out of the client bundle. */}
      <div dangerouslySetInnerHTML={{ __html: popup.advice }} />
    </div>
  )
}

export function ZonePopupCard({ popup }: { popup: ZonePopup }) {
  return (
    <div className="w-[300px] overflow-hidden rounded-md bg-white text-left text-sm text-neutral-900 shadow-lg">
      <PopupHeader popup={popup} />
      <WarningStrip popup={popup} />

      <div className="space-y-2 px-4 py-3">
        <ZoneIdentity popup={popup} />
        <ValidityWindow popup={popup} />
        <TravelAdvice popup={popup} />
      </div>
    </div>
  )
}
