/**
 * The card shown when a reader hovers a zone on the danger map.
 *
 * Content, ordering and styling follow the legacy danger-map widget's popup: a grey header stating
 * the rating (or that the season has ended, or that an info exchange has observations instead)
 * with the danger icon overhanging its right edge, a warning strip when one is in effect, the zone
 * name, the publication window, and the danger scale's travel advice. All of it is derived by
 * `zonePopup`; this only renders.
 */
import { AlertTriangle } from 'lucide-react'
import Image from 'next/image'

import type { ZonePopup } from '@/services/nac/dangerMap/dangerMapZones'
import { dangerColor, dangerIconSize, dangerIconUrl, dangerName } from '@/services/nac/dangerScale'

/** The widget's header grey (its `$gray-300`). */
const HEADER_GREY = '#e8ecee'
/** A shade under the widget's `$gray-light` (#797d80), which misses WCAG AA on white at 0.8rem. */
const MUTED_GREY = '#737373'

/**
 * The widget's solid alert octagon. Lucide's `OctagonAlert` paints the octagon after the "!", so
 * filling it hides the mark; this is the same geometry with the octagon drawn first.
 */
function SolidOctagonAlert({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill={MUTED_GREY}
        d="M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z"
      />
      <path stroke={HEADER_GREY} strokeWidth={2.5} strokeLinecap="round" d="M12 16h.01M12 7.5v5" />
    </svg>
  )
}

/**
 * The grey banner across the top: the zone's rating with its danger icon hanging off the right
 * edge, or — off-season — a notice with a stop icon, since a rating would describe a season that
 * ended months ago.
 */
function PopupHeader({ popup }: { popup: ZonePopup }) {
  if (popup.offSeason) {
    return (
      <div
        className="relative mb-2 py-[0.8rem] pl-20 pr-8"
        style={{ backgroundColor: HEADER_GREY }}
      >
        <SolidOctagonAlert className="absolute left-4 top-1/2 h-11 w-11 -translate-y-1/2" />
        <div className="text-[1rem] font-bold uppercase tracking-[0.5px]">{popup.headline}</div>
      </div>
    )
  }

  return (
    <div
      className="relative mb-2 mr-12 py-[0.8rem] pl-4 pr-8"
      style={{ backgroundColor: HEADER_GREY }}
    >
      <div className="text-[1rem] font-bold uppercase tracking-[0.5px]">{popup.headline}</div>
      <div className="text-[0.8rem] font-bold uppercase">{popup.subhead}</div>
      <Image
        src={dangerIconUrl(popup.dangerLevel)}
        alt={dangerName(popup.dangerLevel)}
        width={dangerIconSize(popup.dangerLevel).width}
        height={dangerIconSize(popup.dangerLevel).height}
        className="absolute left-full top-[5px] -ml-7 h-[55px] w-auto max-w-none"
      />
    </div>
  )
}

/** The red strip between header and body, shown only while a warning is in effect. */
function WarningStrip({ popup }: { popup: ZonePopup }) {
  if (!popup.hasWarning) return null

  return (
    <div
      className="mb-2 flex items-center gap-[5px] px-2 py-[0.2rem] text-[0.8rem] font-bold uppercase text-white"
      style={{ backgroundColor: dangerColor(4) }}
    >
      {/* A white triangle with the strip's red showing through as the "!", like the widget's. */}
      <AlertTriangle
        className="h-[1.2rem] w-[1.2rem] shrink-0 fill-white"
        style={{ color: dangerColor(4) }}
        aria-hidden="true"
      />
      <span>Avalanche Warning in Effect</span>
    </div>
  )
}

/** Zone name, plus its avalanche center on an all-centers map where the zones differ. */
function ZoneIdentity({ popup }: { popup: ZonePopup }) {
  return (
    <div className="mb-2 space-y-2">
      <div className="text-[0.9rem] font-bold uppercase tracking-[0.5px]">{popup.zoneName}</div>
      {popup.centerName && (
        <div className="text-[0.8rem] font-bold uppercase" style={{ color: MUTED_GREY }}>
          {popup.centerName}
        </div>
      )}
    </div>
  )
}

/** The forecast's validity window — both ends or neither, as the widget shows it. */
function ValidityWindow({ popup }: { popup: ZonePopup }) {
  if (!popup.publishedText || !popup.expiresText) return null

  return (
    <div className="mb-[0.8rem]">
      <strong>PUBLISHED:</strong> {popup.publishedText}
      <br />
      <strong>EXPIRES:</strong> {popup.expiresText}
    </div>
  )
}

function TravelAdvice({ popup }: { popup: ZonePopup }) {
  if (!popup.advice) return null

  return (
    <div>
      <div className="font-bold uppercase">Travel Advice</div>
      {/* Advice is a literal in `dangerScale.ts` (the published danger scale), not API or user
          content, so it carries only the <strong> we wrote and needs no sanitizer — which also
          keeps sanitize-html out of the client bundle. */}
      <div dangerouslySetInnerHTML={{ __html: popup.advice }} />
    </div>
  )
}

export function ZonePopupCard({ popup }: { popup: ZonePopup }) {
  return (
    // The widget's 0.8rem body text at `line-height: normal`, inset 0.5rem on every side.
    <div className="w-[300px] overflow-hidden rounded-md bg-white p-2 text-left text-[0.8rem] leading-[normal] text-neutral-900 shadow-[0_2px_7px_1px_rgba(0,0,0,0.3)]">
      <PopupHeader popup={popup} />
      <WarningStrip popup={popup} />
      <ZoneIdentity popup={popup} />
      <ValidityWindow popup={popup} />
      <TravelAdvice popup={popup} />
    </div>
  )
}
