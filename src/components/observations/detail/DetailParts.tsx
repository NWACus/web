/**
 * The building blocks both detail views share, after the widget's `ObsHeaderField`,
 * `ContentPanel` and `TextField`. Server-renderable and client-renderable alike: the same markup
 * is the full page and the modal over the list.
 */
import { MapPin } from 'lucide-react'
import type { ReactNode } from 'react'

import type { LatLng } from '@/services/nac/model/observation'
import { cn } from '@/utilities/ui'

/** A labelled value in a detail header; omitted when `value` is given and empty. */
/** Nothing to show: absent, empty, or a `{value && …}` that came out false. */
function isEmpty(node: ReactNode): boolean {
  return node === null || node === undefined || node === '' || node === false
}

export function HeaderField({
  title,
  children,
  wide,
}: {
  title: string
  children: ReactNode
  wide?: boolean
}) {
  if (isEmpty(children)) return null
  return (
    <div className={cn('border-l-2 border-border pl-2', wide && 'sm:col-span-2')}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="text-sm">{children}</div>
    </div>
  )
}

/** How a detail is titled: with its own heading, or (null) under the page's H1, which carries it. */
export type DetailTitleTag = 'h1' | 'h2' | null

/** "Field Observation" or "Avalanche Occurrence", over the location it was at. */
export function RecordTitle({
  TitleTag,
  title,
  location,
}: {
  TitleTag: DetailTitleTag
  title: string
  location: string | null
}) {
  if (!TitleTag) {
    if (!location) return null
    return (
      <p className="flex items-center gap-2 text-xl font-semibold uppercase text-muted-foreground">
        <MapPin className="h-5 w-5 shrink-0" aria-hidden="true" />
        {location}
      </p>
    )
  }
  return (
    <div>
      <TitleTag className="text-3xl font-bold">{title}</TitleTag>
      <p className="text-lg font-semibold uppercase text-muted-foreground">{location}</p>
    </div>
  )
}

/** One of the detail's panels, headed by an icon and a title. */
export function Section({
  icon,
  title,
  children,
  className,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('flex flex-col gap-3', className)}>
      <h2 className="flex items-center gap-2 border-b pb-1 text-xl font-bold">
        <span className="text-primary" aria-hidden="true">
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </section>
  )
}

export function Panel({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-6 rounded-lg border bg-card p-4 sm:p-6">{children}</div>
}

/**
 * Submitter text as text: escaped by React, line breaks kept. The widget's `TextField` also turned
 * a stored `<br>` back into a line break before escaping, so a form that saved one shows a break.
 */
// A stored <br> becomes a newline.
export function TextBlock({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn('whitespace-pre-line text-sm', className)}>
      {text.replace(/<br\s*\/?>/gi, '\n')}
    </div>
  )
}

/** Submitter HTML, sanitized on the server by `prepareDetail`. */
export function HtmlBlock({ html }: { html: string }) {
  return (
    <div
      className="prose prose-sm max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export function NotObserved() {
  return <em className="text-sm text-muted-foreground">Not Observed</em>
}

/** Shown under anything a forecaster didn't write, as the widget shows it. */
export function ReviewDisclaimer() {
  return (
    <p className="text-sm italic text-muted-foreground">
      This information is provided &quot;as is&quot; and has not been reviewed for accuracy by
      Avalanche Center staff.
    </p>
  )
}

const STATIC_STYLE = 'avalanche-org/cmg1bsw48002301pshwzoen5y'

/**
 * Where the record is, as a small static map with a pin in the marker's color — the widget's
 * header map at the same zoom (9), as an image from Mapbox's Static Images API rather than a live
 * map, since it is only ever looked at.
 */
export function LocationMap({
  location,
  color,
  label,
  count = null,
}: {
  location: LatLng | null
  color: string
  label: string
  /** Printed in the pin when over 1, as the widget numbers a report of several avalanches. */
  count?: number | null
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!location || !token) return null
  const { lng, lat } = location
  // The Static Images API labels a pin with a number up to 99.
  const pinLabel = count !== null && count > 1 && count < 100 ? `-${count}` : ''
  // Drops the '#' from the hex color, which the API takes bare.
  const pin = `pin-s${pinLabel}+${color.replace('#', '')}(${lng},${lat})`
  const src = `https://api.mapbox.com/styles/v1/${STATIC_STYLE}/static/${pin}/${lng},${lat},9/400x280@2x?access_token=${token}`
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`Map showing ${label}`}
      width={400}
      height={280}
      className="h-auto w-full rounded-lg border bg-muted"
      loading="lazy"
    />
  )
}
