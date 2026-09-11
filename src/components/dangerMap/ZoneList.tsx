/**
 * The map's content as text.
 *
 * A Mapbox map is a `<canvas>`: nothing on it is reachable by keyboard or exposed to a screen
 * reader, so on its own the danger map would publish today's avalanche danger in a form some
 * readers cannot get at. This renders the same zones as a list of links — the rating, whether a
 * warning is in effect, and the forecast — so the information is available to everyone even though
 * the picture isn't. On an information exchange the same list points at observations, as the map's
 * popups do.
 *
 * Invisible until something inside it takes focus, then it opens as a card over the map, under the
 * avalanche.org link in the top-left corner. A keyboard user has to be able to *see* where they
 * are while tabbing, and a list that reflowed the page under the map on first Tab would shove the
 * rest of the page down.
 *
 * Hidden with `opacity-0` rather than `sr-only` because the two can't be combined here:
 * `not-sr-only` resets `position` to static, which would fight the absolute placement at exactly
 * the moment the card needs it. `opacity-0` leaves the list in the accessibility tree and
 * focusable, which is the whole point, and `pointer-events-none` keeps it from swallowing hover on
 * the zones underneath while it is invisible.
 */
import type {
  ZonePopup,
  ZonePopupSettings,
  ZoneRenderFeature,
} from '@/services/nac/dangerMap/dangerMapZones'
import { zonePopup } from '@/services/nac/dangerMap/dangerMapZones'
import { dangerColor } from '@/services/nac/dangerScale'
import { cn } from '@/utilities/ui'

interface ZoneListProps {
  zones: { features: ZoneRenderFeature[] } | null
  settings: ZonePopupSettings
}

/** Clears the avalanche.org link (29px tall at a 10px inset) with a gap of its own. */
const BELOW_CORNER_LINK = 'top-[47px]'

/**
 * What the list is a list of. An exchange's own zones are ways into observations, but on an
 * all-centers map they sit beside neighboring centers' rated zones, and a heading that named
 * either would misdescribe the other — so that case gets a heading that claims nothing.
 */
function listHeading({ informationExchange, allCenters }: ZonePopupSettings): string {
  if (!informationExchange) return 'Avalanche danger by forecast zone'
  return allCenters ? 'Forecast zones on the map' : 'Observations by zone'
}

export function ZoneList({ zones, settings }: ZoneListProps) {
  const features = zones?.features ?? []
  if (features.length === 0) return null

  return (
    <div
      className={cn(
        'pointer-events-none absolute left-2.5 z-10 w-60 opacity-0 transition-opacity',
        BELOW_CORNER_LINK,
        // An all-centers map lists every zone in the country, so the card scrolls rather than
        // running off the bottom of a map whose height the center chose.
        'max-h-[calc(100%-3.5rem)] overflow-y-auto',
        'rounded-md bg-white text-left shadow-lg',
        'focus-within:pointer-events-auto focus-within:opacity-100',
      )}
    >
      <h3 className="sticky top-0 border-b bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
        {listHeading(settings)}
      </h3>
      <ul className="p-1">
        {features.map((zone) => (
          <ZoneListItem
            key={String(zone.id ?? zone.properties.name)}
            popup={zonePopup(zone.properties, settings)}
          />
        ))}
      </ul>
    </div>
  )
}

/** Row chrome, shared so a zone with nowhere to link still lines up with the ones that do. */
const ROW = 'block rounded px-2 py-1.5 text-xs leading-tight'

function ZoneListItem({ popup }: { popup: ZonePopup }) {
  const body = (
    <>
      <span className="block font-medium text-neutral-900">{popup.zoneName}</span>
      <span className="block text-neutral-600">{popup.headline}</span>
      {popup.hasWarning && (
        <span className="block font-semibold" style={{ color: dangerColor(4) }}>
          Avalanche Warning in effect
        </span>
      )}
    </>
  )

  return (
    <li>
      {popup.href ? (
        <a
          href={popup.href}
          {...(popup.isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          // The whole row is the target, not just the name: it reads as one button, and the
          // accessible name becomes "{zone}: {what you get}" rather than the zone alone.
          // The outline is inset so it draws inside the card rather than under its rounded edge —
          // a fill alone is too weak to be the focus indicator on the one surface that exists
          // specifically for people navigating by keyboard.
          className={cn(
            ROW,
            'hover:bg-neutral-100 focus-visible:bg-neutral-100',
            'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2',
          )}
        >
          {body}
        </a>
      ) : (
        <span className={ROW}>{body}</span>
      )}
    </li>
  )
}
